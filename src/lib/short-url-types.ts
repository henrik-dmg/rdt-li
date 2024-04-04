export type ShortUrl = {
  id: string | undefined | null
  url: string
  title: string | undefined | null
  enabled: boolean
  clickLimit: number | undefined | null
  password: string | undefined | null
  timeOffset: number
}

export type ShortUrlUpdate = {
  id: string
  newId: string
  title: string | undefined
  url: string
}

export class ShortUrlApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export const unauthorizedError = new ShortUrlApiError(401, 'Unauthorized')
