import { withApiKey } from '@/lib/api-helpers'
import {
  deleteShortUrlWithApiKey,
  updateShortUrlWithApiKey,
} from '@/lib/short-url-helpers'
import { ShortUrlUpdate } from '@/lib/short-url-types'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  return await withApiKey(request, async (apiKey) => {
    await deleteShortUrlWithApiKey(params.id, apiKey)
    return NextResponse.json(undefined, { status: 200 })
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  return await withApiKey(request, async (apiKey) => {
    const { newId, title, url } = await request.json()
    const updatedShortUrl: ShortUrlUpdate = { id: params.id, newId, title, url }

    await updateShortUrlWithApiKey(updatedShortUrl, apiKey)
    return NextResponse.json(undefined, { status: 200 })
  })
}
