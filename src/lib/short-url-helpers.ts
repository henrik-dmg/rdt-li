'use server'

import { getUserIdForApiKey } from '@/lib/api-helpers'
import { authOptions } from '@/lib/auth'
import { blocked } from '@/lib/blocked-urls'
import { db } from '@/lib/db'
import { shortUrls } from '@/lib/db/schema'
import {
  ShortUrl,
  ShortUrlApiError,
  ShortUrlUpdate,
  unauthorizedError,
} from '@/lib/short-url-types'
import { nanoid, sanitize } from '@/lib/utils'
import { and, eq, like, sql } from 'drizzle-orm'
import { getServerSession } from 'next-auth'

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

export async function updateShortUrlSessioned(updatedShortUrl: ShortUrlUpdate) {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Session not found')
  }
  return await updateShortUrlUnsafe(updatedShortUrl, session.user.id)
}

export async function updateShortUrlWithApiKey(
  updatedShortUrl: ShortUrlUpdate,
  apiKey: string,
) {
  const userId = await getUserIdForApiKey(apiKey)
  if (!userId) {
    throw unauthorizedError
  }
  return await updateShortUrlUnsafe(updatedShortUrl, userId)
}

async function updateShortUrlUnsafe(
  updatedShortUrl: ShortUrlUpdate,
  userId: string,
) {
  const xid = updatedShortUrl.newId || updatedShortUrl.id

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
        title: updatedShortUrl.title || null,
        url: updatedShortUrl.url,
        updatedAt: new Date(),
      })
      .where(
        and(eq(shortUrls.userId, userId), eq(shortUrls.id, updatedShortUrl.id)),
      )
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

export const deleteShortUrlSessioned = async (id: string) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw unauthorizedError
  }
  await deleteShortUrlUnsafe(id, session.user.id)
}

export const deleteShortUrlWithApiKey = async (id: string, apiKey: string) => {
  const userId = await getUserIdForApiKey(apiKey)
  if (!userId) {
    throw unauthorizedError
  }
  await deleteShortUrlUnsafe(id, userId)
}

async function deleteShortUrlUnsafe(id: string, userId: string) {
  const data = await db
    .select({
      exists: sql<number>`1`,
    })
    .from(shortUrls)
    .where(and(eq(shortUrls.id, id), eq(shortUrls.userId, userId)))

  if (!data.length) {
    throw new ShortUrlApiError(404, 'shortend url not found')
  }
  await db
    .delete(shortUrls)
    .where(and(eq(shortUrls.id, id), eq(shortUrls.userId, userId)))
}
