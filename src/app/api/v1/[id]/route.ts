import { withApiKey } from '@/lib/api-helpers'
import { deleteShortUrlWithApiKey } from '@/lib/short-url-helpers'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  return await withApiKey(request, async (apiKey) => {
    await deleteShortUrlWithApiKey(params.id, apiKey)
    return NextResponse.json(undefined, { status: 201 })
  })
}
