import { serverEnvironment } from '@/lib/env/server-env'
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  driver: 'pg',
  dbCredentials: {
    connectionString: serverEnvironment.POSTGRES_URL,
  },
} satisfies Config
