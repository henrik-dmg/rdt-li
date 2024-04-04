export type ShortUrl = {
  id: string | null
  url: string
  title: string | null
  enabled: boolean
  clickLimit: number | null
  password: string | null
  timeOffset: number
}

export class ShortUrlApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export const unauthorizedError = new ShortUrlApiError(401, 'Unauthorized')
