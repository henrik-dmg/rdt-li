'use server'

import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { serverEnvironment } from '@/lib/env/server-env'
import { ShortUrlApiError, unauthorizedError } from '@/lib/short-url-types'
import { nanoid } from '@/lib/utils'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export const withApiKey = async (
  request: Request,
  handler: (apiKey: string) => Promise<NextResponse>,
) => {
  try {
    const apiKey = request.headers.get('Authorization')?.split(' ')[1]
    if (apiKey) {
      return await handler(apiKey)
    }

    return NextResponse.json(unauthorizedError)
  } catch (error) {
    if (error instanceof ShortUrlApiError) {
      return NextResponse.json(
        { error_message: error.message },
        { status: error.code },
      )
    } else {
      console.log(error)
      return NextResponse.json(
        { error_message: 'Please try again' },
        { status: 500 },
      )
    }
  }
}

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
  const encodedKey = new TextEncoder().encode(serverEnvironment.NEXTAUTH_SECRET)

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
    const key = serverEnvironment.NEXTAUTH_SECRET

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
