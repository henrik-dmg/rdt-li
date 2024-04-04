import z from 'zod'

const serverEnvironmentSchema = z.object({
  POSTGRES_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string(),
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_SECRET: z.string(),
  AUTH0_ISSUER: z.string().url(),
})

export const serverEnvironment = serverEnvironmentSchema.parse({
  POSTGRES_URL: process.env.POSTGRES_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_SECRET: process.env.AUTH0_SECRET,
  AUTH0_ISSUER: process.env.AUTH0_ISSUER,
})
