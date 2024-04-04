import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { serverEnvironment } from '../env'

const queryClient = postgres(serverEnvironment.POSTGRES_URL as string)

export const db: PostgresJsDatabase = drizzle(queryClient)
