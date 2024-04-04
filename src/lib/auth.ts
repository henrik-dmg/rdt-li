import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { NextAuthOptions } from 'next-auth'
import type { User } from 'next-auth'
import { Adapter } from 'next-auth/adapters'
import Auth0Provider from 'next-auth/providers/auth0'
import { serverEnvironment } from './env'

export const authOptions: NextAuthOptions = {
  // debug: process.env.NODE_ENV === 'development',
  adapter: DrizzleAdapter(db) as Adapter,
  providers: [
    Auth0Provider({
      clientId: serverEnvironment.AUTH0_CLIENT_ID,
      clientSecret: serverEnvironment.AUTH0_SECRET,
      issuer: serverEnvironment.AUTH0_ISSUER,
    }),
  ],
  pages: {
    signIn: '/access',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }

      return session
    },
    async jwt({ token, user }) {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, token.email || ''))
        .limit(1)

      if (!dbUser) {
        if (user) {
          token.id = user?.id
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      }
    },
  },
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}

declare module 'next-auth' {
  interface Session {
    user: User & {
      id: string
    }
  }
}
