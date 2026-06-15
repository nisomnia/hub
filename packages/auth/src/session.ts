import { sha256 } from "@oslojs/crypto/sha2"
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding"
import { eq } from "drizzle-orm"

import type {
  AuthConfig,
  AuthSession,
  AuthUser,
  SessionValidationResult,
  UserRole,
} from "./types.js"

const EXPIRES_IN_DAYS = 30
const REFRESH_THRESHOLD_DAYS = 15

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return encodeBase32LowerCaseNoPadding(bytes)
}

function hashSessionToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
}

function parseUser(value: unknown): AuthUser {
  const user = value as Record<string, unknown>

  return {
    id: String(user.id),
    email: user.email === undefined ? null : (user.email as string | null),
    name: user.name === undefined ? null : (user.name as string | null),
    username: String(user.username),
    image: user.image === undefined ? null : (user.image as string | null),
    phoneNumber:
      user.phoneNumber === undefined
        ? null
        : (user.phoneNumber as string | null),
    about: user.about === undefined ? null : (user.about as string | null),
    role: String(user.role) as UserRole,
    createdAt:
      user.createdAt === undefined ? null : (user.createdAt as Date | null),
    updatedAt:
      user.updatedAt === undefined ? null : (user.updatedAt as Date | null),
  }
}

function parseSession(value: unknown): AuthSession {
  const session = value as Record<string, unknown>

  return {
    id: String(session.id),
    userId: String(session.userId),
    expiresAt: session.expiresAt as Date,
  }
}

export async function createSession(
  config: AuthConfig,
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken()
  const sessionId = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000)

  await config.db.insert(config.tables.sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  })

  return { token, expiresAt }
}

export async function validateSession(
  config: AuthConfig,
  token: string,
): Promise<SessionValidationResult> {
  const sessionId = hashSessionToken(token)
  const sessionsTable = config.tables.sessions
  const usersTable = config.tables.users
  const db = config.db

  const rows = await db
    .select({ user: usersTable, session: sessionsTable })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.id, sessionId))
    .limit(1)

  if (rows.length < 1) {
    return { session: null, user: null }
  }

  const row = rows[0] as Record<string, unknown>
  const session = parseSession(row.session)
  const user = parseUser(row.user)

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id))
    return { session: null, user: null }
  }

  if (
    Date.now() >=
    session.expiresAt.getTime() - REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  ) {
    session.expiresAt = new Date(
      Date.now() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    )
    await db
      .update(sessionsTable)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessionsTable.id, session.id))
  }

  return { session, user }
}

export async function invalidateSession(config: AuthConfig, sessionId: string) {
  const sessionsTable = config.tables.sessions
  await config.db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId))
}

export async function invalidateUserSessions(
  config: AuthConfig,
  userId: string,
) {
  const sessionsTable = config.tables.sessions
  await config.db.delete(sessionsTable).where(eq(sessionsTable.userId, userId))
}
