import { NextResponse } from "next/server"

// GET /api/v1/docs for API docs :D
export async function GET() {
  return NextResponse.json({
    endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1`,
    headers: {
      authorization: "Bearer <API Key>",
    },
    methods: {
      GET: {
        description: "Returns all short URLs for the user",
      },
      POST: {
        description: "Creates a new shortened URL",
        body: {
          url: "https://example.com",
        },
      },
    },
    contributeAt: "https://github.com/nrjdalal/rdt-li/blob/main/src/app/api/v1/route.ts",
  })
}
