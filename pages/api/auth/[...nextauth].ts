import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import NextAuth, { AuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import prisma from '../../../prisma/lib/prisma'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as bcrypt from 'bcrypt-ts'
import { randomUUID } from 'crypto'
import { setCookie, getCookie } from 'cookies-next'

import { encode, decode } from 'next-auth/jwt'

const getAdapter = () => ({
  ...PrismaAdapter(prisma),
})

const session = {
  // strategy: 'database',

  // Seconds - How long until an idle session expires and is no longer valid.
  maxAge: 60 * 60 * 24,

  // Seconds - Throttle how frequently to write to database to extend a session.
  // Use it to limit write operations. Set to 0 to always update the database.
  // Note: This option is ignored if using JSON Web Tokens
  updateAge: 24 * 60 * 60,
}

export const authOptions = (req: NextApiRequest, res: NextApiResponse): AuthOptions => {
  const adapter = getAdapter()
  return {
    session: session,
    providers: [
      GithubProvider({
        clientId: process.env.GITHUB_ID as string,
        clientSecret: process.env.GITHUB_SECRET as string,
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        allowDangerousEmailAccountLinking: true,
      }),
      EmailProvider({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM,
      }),
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'email', type: 'text' },
          password: { label: 'password', type: 'password' },
        },

        async authorize(credentials) {
          try {
            const user = await prisma.user.findFirst({ where: { email: credentials?.email } })
            if (user !== null) {
              const res = await bcrypt.compare(credentials?.password as string, user?.password as string)
              if (res) {
                let userAccount = {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role || 'user',
                }
                console.log(`User ${user.name} has been authorized`)
                return userAccount
              } else {
                console.log('Wrong password')
                return null
              }
            } else {
              return null
            }
          } catch (err) {
            console.log('authorize error :', err)
          }
          return null
        },
      }),
    ],
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
    adapter: adapter,
    secret: process.env.NEXTAUTH_SECRET,
    // debug: true,
    // Callbacks are asynchronous functions you can use to control what happens when an action is performed
    callbacks: {
      async redirect({ url, baseUrl }) {
        console.log('Callback redirect')
        return url
      },
      async jwt({ token, user }) {
        console.log('JWT callback')

        if (user) {
          token.role = user.role
        }
        return token
      },
      async session({ session, user, token }) {
        console.log('Session callback')
        session.user.role = user.role
        return session
      },
      async signIn({ user }) {
        console.log('SignIn Callback')

        if (req.query.nextauth?.includes('callback') && req.query.nextauth?.includes('credentials') && req.method === 'POST') {
          if (user && 'id' in user) {
            const sessionToken = randomUUID()
            const sessionExpiry = new Date(Date.now() + session.maxAge * 1000)
            await adapter.createSession({
              sessionToken: sessionToken,
              userId: user.id,
              expires: sessionExpiry,
            })

            setCookie('next-auth.session-token', sessionToken, {
              expires: sessionExpiry,
              req: req,
              res: res,
            })
          }
        }
        return true
      },
    },
    jwt: {
      encode: async (params) => {
        if (req.query.nextauth?.includes('callback') && req.query.nextauth?.includes('credentials') && req.method === 'POST') {
          const cookie = getCookie('next-auth.session-token', { req: req })

          console.log('Cookie: ', cookie)

          if (cookie) return cookie as string
          else return ''
        }
        // Revert to default behaviour when not in the credentials provider callback flow
        return encode(params)
      },
      decode: async (params) => {
        if (req.query.nextauth?.includes('callback') && req.query.nextauth?.includes('credentials') && req.method === 'POST') {
          return null
        }
        // Revert to default behaviour when not in the credentials provider callback flow
        return decode(params)
      },
    },
    // Events are asynchronous functions that do not return a response, they are useful for audit logs / reporting
    events: {
      async signIn(message) {
        /* on successful sign in */
        console.log('Successfully signed in', message.user.name, 'using', message?.account?.provider)
      },
      async signOut(message) {
        /* on signout */
        console.log('Successfully signed out')
      },
      async createUser(message) {
        /* user created */
        console.log('User created')
      },
      async updateUser(message) {
        /* user updated - e.g. their email was verified */
        console.log('User updated')
      },
      async linkAccount(message) {
        /* account (e.g. Twitter) linked to a user */
        console.log('Account linked')
      },
      async session(message) {
        /* session is active */
        console.log('Session is active')
      },
    },
  }
}
// First function to be called in the authentication flow
const authHandler: NextApiHandler = async (req, res) => {
  if (req?.query?.nextauth?.includes('callback') && req.method === 'GET') {
    console.log('GET Request')
  } else if (req?.query?.nextauth?.includes('callback') && req.method === 'POST') {
    console.log('POST Request')

    const { name, email, password, confirm, csrfToken } = req.body

    try {
      const userExists = await prisma.user.findFirst({
        where: {
          email: email,
        },
      })

      if (!userExists) {
        const user = await prisma.user.create({
          data: {
            name: name,
            email: email,
            password: bcrypt.hashSync(password),
            role: 'user',
          },
        })

        const account = await prisma.account.create({
          data: {
            userId: user.id,
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: user.id,
          },
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  return await NextAuth(req, res, authOptions(req, res))
}
export default authHandler
