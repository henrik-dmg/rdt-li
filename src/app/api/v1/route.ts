import { NextResponse } from "next/server"
import { createShortUrlWithApiKey, getUserIdForApiKey } from "@/app/(admin)/x/apis/shortUrls"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { shortUrls } from "@/lib/db/schema"

const authorizedHandler = async (request: Request, handler: (apiKey: string) => Promise<NextResponse>) => {
  try {
    const apiKey = request.headers.get("Authorization")?.split(" ")[1]
    if (apiKey) {
      return handler(apiKey)
    }

    return NextResponse.json({ message: "Unauthorized", status: 401 })
  } catch (exception) {
    console.log(exception)
    return NextResponse.json({ message: "Please try again", status: 409 })
  }
}

// GET /api/v1 returns list of all short urls
export async function GET(request: Request) {
  return await authorizedHandler(request, async (apiKey) => {
    const userId = await getUserIdForApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({
        message: "Unauthorized",
        status: 401,
      })
    }

    const shortUrlsData = await db.select().from(shortUrls).where(eq(shortUrls.userId, userId.id))

    return NextResponse.json({
      data: shortUrlsData,
      status: 200,
    })
  })
}

// POST /api/v1 creates new short url
export async function POST(request: Request) {
  return await authorizedHandler(request, async (apiKey) => {
    const data = await request.json()
    const shortUrl = await createShortUrlWithApiKey(
      {
        url: data.url,
        id: "",
        title: "",
        password: "",
        enabled: true,
        clickLimit: null,
        timeOffset: 0,
      },
      apiKey
    )

    return NextResponse.json({
      data: shortUrl,
      status: 201,
    })
  })
}
