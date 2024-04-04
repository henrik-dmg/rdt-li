import { withApiKey } from '@/lib/api-helpers'
import {
  createShortUrlWithApiKey,
  getShortUrlsWithApiKey,
} from '@/lib/short-url-helpers'
import { ShortUrl } from '@/lib/short-url-types'
import { NextResponse } from 'next/server'

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
