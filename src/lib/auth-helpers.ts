'use server'

import { authOptions } from '@/lib/auth'
import { ShortUrl, ShortUrlApiError, unauthorizedError } from '@/lib/auth-types'
import { db } from '@/lib/db'
import { shortUrls, users } from '@/lib/db/schema'
import { nanoid, sanitize } from '@/lib/utils'
import { blocked } from '@/url-center/blocked'
import { and, eq, like } from 'drizzle-orm'
import { getServerSession } from 'next-auth'

// MARK: - Helpers

export const getUserIdForApiKey = async (apiKey: string) => {
  const user = await db
    .select({
      id: users.id,
      apiKeySalt: users.apiKeySalt,
    })
    .from(users)
    .where(eq(users.apiKey, apiKey.slice(0, 32)))

  if (!user.length) {
    return false
  }

  const encodedSalt = new TextEncoder().encode(user[0].apiKeySalt as string)
  const encodedKey = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

  const importedKey = await crypto.subtle.importKey(
    'raw',
    encodedSalt,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  )

  const encryptedText = atob(apiKey)
  const encryptedBuffer = new Uint8Array(
    encryptedText.split('').map((char) => char.charCodeAt(0)),
  ) as any

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encodedKey,
      },
      importedKey,
      encryptedBuffer,
    )

    const decryptedString = new TextDecoder().decode(decrypted)

    if (decryptedString === user[0].id + '.' + user[0].apiKeySalt) {
      return user[0].id
    }

    return null
  } catch {
    return null
  }
}

export const getApiKey = async ({ intent }: { intent: string }) => {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Session not found')

  console.log('session', intent)

  // check if API key exists
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))

  if (intent === 'new' || !user[0].apiKey) {
    const salt = nanoid(32)
    const text = `${session.user.id}.${salt}`
    const key = process.env.NEXTAUTH_SECRET

    const encodedSalt = new TextEncoder().encode(salt)
    const encodedText = new TextEncoder().encode(text)
    const encodedKey = new TextEncoder().encode(key)

    const importedKey = await crypto.subtle.importKey(
      'raw',
      encodedSalt,
      { name: 'AES-GCM' },
      false,
      ['encrypt'],
    )
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: encodedKey,
      },
      importedKey,
      encodedText,
    )
    const encryptedText = btoa(
      String.fromCharCode.apply(null, new Uint8Array(encrypted) as any),
    )

    // update user
    await db
      .update(users)
      .set({
        apiKey: encryptedText.slice(0, 32),
        apiKeySalt: salt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return encryptedText
  }

  return true

  // const decryptedText = atob(encryptedText)
  // const decryptedBuffer = new Uint8Array(
  //   decryptedText.split('').map((char) => char.charCodeAt(0)),
  // ) as any

  // const decrypted = await crypto.subtle.decrypt(
  //   {
  //     name: 'AES-GCM',
  //     iv: encodedKey,
  //   },
  //   importedKey,
  //   decryptedBuffer,
  // )

  // const decryptedString = new TextDecoder().decode(decrypted)
}

// MARK: - Get URLs

export const getShortUrlsSessioned = async () => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw unauthorizedError
  }

  return await getShortUrlsUnsafe(session.user.id)
}

export const getShortUrlsWithApiKey = async (apiKey: string) => {
  const userId = await getUserIdForApiKey(apiKey)
  if (!userId) {
    throw unauthorizedError
  }

  return await getShortUrlsUnsafe(userId)
}

const getShortUrlsUnsafe = async (userId: string) => {
  return await db.select().from(shortUrls).where(eq(shortUrls.userId, userId))
}

// MARK: - Create URLs

export const createShortUrlSessioned = async (urlPayload: ShortUrl) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw unauthorizedError
  }

  return await createShortUrlUnsafe(urlPayload, session.user.id)
}

export const createShortUrlWithApiKey = async (
  urlPayload: ShortUrl,
  apiKey: string,
) => {
  const userId = await getUserIdForApiKey(apiKey)
  if (!userId) {
    throw unauthorizedError
  }
  return await createShortUrlUnsafe(urlPayload, userId)
}

async function createShortUrlUnsafe(
  urlPayload: ShortUrl,
  userId: string,
): Promise<ShortUrl> {
  const id = sanitize(urlPayload.id || '') || nanoid(6)
  const url = new URL(urlPayload.url)

  if (id.length < 4) {
    throw new ShortUrlApiError(
      400,
      'Short URL must be at least 4 characters long',
    )
  }

  for (const blockedUrl of blocked) {
    if (url.host.includes(blockedUrl)) {
      try {
        await db.delete(shortUrls).where(like(shortUrls.url, `%${blockedUrl}%`))
      } catch {
        console.log('Error deleting old shortUrls')
      }

      throw new ShortUrlApiError(406, 'URL not acceptable or is blocked')
    }
  }

  if (urlPayload.clickLimit && isNaN(urlPayload.clickLimit)) {
    throw new ShortUrlApiError(400, 'Click limit is not a number')
  }

  const data = {
    userId: userId,
    id,
    url: url.toString(),
    title: urlPayload.title,
    enabled: urlPayload.enabled,
    clickLimit: urlPayload.clickLimit,
    password: urlPayload.password,
    timeOffset: urlPayload.timeOffset,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  if (data.id.startsWith('_')) {
    throw new ShortUrlApiError(400, 'Short URL cannot start with an underscore')
  }

  try {
    await db.insert(shortUrls).values(data)
    return data
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new ShortUrlApiError(400, 'Short URL already exists')
    } else {
      throw new ShortUrlApiError(500, error.message)
    }
  }
}

// MARK: - Update URLs

export const updateShortUrl = async ({
  id,
  newId,
  title,
  url,
}: {
  id: string
  newId: string
  title?: string | undefined
  url: string
}) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Session not found')
  }

  const xid = newId || id

  if (xid.startsWith('_')) {
    return {
      error: {
        code: '400',
        message: 'Short URL cannot start with an underscore',
      },
    }
  }

  try {
    return await db
      .update(shortUrls)
      .set({
        id: sanitize(xid),
        title: title || null,
        url,
        updatedAt: new Date(),
      })
      .where(and(eq(shortUrls.userId, session.user.id), eq(shortUrls.id, id)))
  } catch (error: any) {
    if (error?.code === '23505') {
      return {
        error: {
          code: '23505',
          message: 'Short URL already exists',
        },
      }
    } else {
      return {
        error: {
          code: '500',
          message: error.message,
        },
      }
    }
  }
}

// MARK: - Delete URLs

export const deleteShortUrl = async ({ id }: { id: string }) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Session not found')
  }

  return await db.delete(shortUrls).where(eq(shortUrls.id, id))
}
