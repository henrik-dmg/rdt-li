import {
  createShortUrlWithApiKey,
  getShortUrlsWithApiKey,
} from '@/lib/auth-helpers'
import { ShortUrl, ShortUrlApiError, unauthorizedError } from '@/lib/auth-types'
import { NextResponse } from 'next/server'

const withApiKey = async (
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
      return NextResponse.json(
        { error_message: 'Please try again' },
        { status: 500 },
      )
    }
  }
}

// GET /api/v1 returns list of all short urls
export async function GET(request: Request) {
  return await withApiKey(request, async (apiKey) => {
    const shortUrlsData = await getShortUrlsWithApiKey(apiKey)

    return NextResponse.json(shortUrlsData, { status: 200 })
  })
}

// POST /api/v1 creates new short url
export async function POST(request: Request) {
  return await withApiKey(request, async (apiKey) => {
    const urlPayload: ShortUrl = await request.json()
    const shortUrl = await createShortUrlWithApiKey(urlPayload, apiKey)

    return NextResponse.json(shortUrl, { status: 201 })
  })
}
