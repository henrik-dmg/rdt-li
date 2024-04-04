export type ShortUrl = {
  id: string | null
  url: string
  title: string | null
  enabled: boolean
  clickLimit: number | null
  password: string | null
  timeOffset: number
}

export const unauthorizedError = {
  error: {
    code: "401",
    message: "Unauthorized",
  },
}
