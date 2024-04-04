import z from 'zod'

// MARK: - Server Environment

const serverEnvironmentSchema = z.object({
  POSTGRES_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string(),
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_SECRET: z.string(),
  AUTH0_ISSUER: z.string().url(),
})

const parsedServerEnvironment = serverEnvironmentSchema.safeParse({
  POSTGRES_URL: process.env.POSTGRES_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_SECRET: process.env.AUTH0_SECRET,
  AUTH0_ISSUER: process.env.AUTH0_ISSUER,
})

if (!parsedServerEnvironment.success) {
  console.error(parsedServerEnvironment.error.issues)
  throw new Error(
    'There is an error with the server-side environment variables',
  )
}

export const serverEnvironment = parsedServerEnvironment.data

// MARK: - Client Environment

const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string(),
  NEXT_PUBLIC_UMAMI_URL: z.string().url().optional(),
  NEXT_PUBLIC_UMAMI_SHARE_URL: z.string().url().optional(),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
})

export const parsedClientEnvironment = clientEnvironmentSchema.safeParse({
  NEXT_PUBLIC_APP_URL:
    process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_UMAMI_URL: process.env.NEXT_PUBLIC_UMAMI_URL,
  NEXT_PUBLIC_UMAMI_SHARE_URL: process.env.NEXT_PUBLIC_UMAMI_SHARE_URL,
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
})

if (!parsedClientEnvironment.success) {
  console.error(parsedClientEnvironment.error.issues)
  throw new Error(
    'There is an error with the client-side environment variables',
  )
}

export const clientEnvironment = parsedClientEnvironment.data
