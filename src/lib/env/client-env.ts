import z from 'zod'

const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string(),
  NEXT_PUBLIC_UMAMI_URL: z.string().url().optional(),
  NEXT_PUBLIC_UMAMI_SHARE_URL: z.string().url().optional(),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
})

export const clientEnvironment = clientEnvironmentSchema.parse({
  NEXT_PUBLIC_APP_URL:
    process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_UMAMI_URL: process.env.NEXT_PUBLIC_UMAMI_URL,
  NEXT_PUBLIC_UMAMI_SHARE_URL: process.env.NEXT_PUBLIC_UMAMI_SHARE_URL,
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
})
