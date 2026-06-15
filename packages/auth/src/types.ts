export type UserRole = "user" | "member" | "author" | "admin"

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
  username: string
  image: string | null
  phoneNumber: string | null
  about: string | null
  role: UserRole
  createdAt: Date | null
  updatedAt: Date | null
}

export interface AuthSession {
  id: string
  userId: string
  expiresAt: Date
}

export interface AuthConfig {
  db: any
  tables: {
    users: any
    sessions: any
  }
}

export type SessionValidationResult =
  | { session: AuthSession; user: AuthUser }
  | { session: null; user: null }
