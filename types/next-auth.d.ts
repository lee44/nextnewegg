import { DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: DefaultUser & { id: string; role: string | 'user' }
  }
  interface User extends DefaultUser {
    role: string | 'user'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string | 'user'
  }
}
