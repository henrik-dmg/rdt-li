import { NextResponse } from "next/server"

import { createShortUrlWithApiKey, getShortUrlsWithApiKey } from "@/lib/auth-helpers"
import { ShortUrl, unauthorizedError } from "@/lib/auth-types"

const authorizedHandler = async (request: Request, handler: (apiKey: string) => Promise<NextResponse>) => {
  try {
    const apiKey = request.headers.get("Authorization")?.split(" ")[1]
    if (apiKey) {
      return handler(apiKey)
    }

    return NextResponse.json(unauthorizedError)
  } catch (exception) {
    console.log(exception)
    return NextResponse.json({ message: "Please try again", status: 409 })
  }
}

// GET /api/v1 returns list of all short urls
export async function GET(request: Request) {
  return await authorizedHandler(request, async (apiKey) => {
    const shortUrlsData = await getShortUrlsWithApiKey(apiKey)

    return NextResponse.json({
      data: shortUrlsData,
      status: 200,
    })
  })
}

// POST /api/v1 creates new short url
export async function POST(request: Request) {
  return await authorizedHandler(request, async (apiKey) => {
    const urlPayload: ShortUrl = await request.json()
    const shortUrl = await createShortUrlWithApiKey(urlPayload, apiKey)

    return NextResponse.json({
      data: shortUrl,
      status: 201,
    })
  })
}
