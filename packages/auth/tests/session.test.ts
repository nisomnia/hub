import { describe, expect, it, vi } from "vite-plus/test"

import {
  createSession,
  generateSessionToken,
  invalidateSession,
  validateSession,
} from "../src/session.ts"

function createMockDb() {
  const calls: { method: string; args: unknown[] }[] = []
  const returnValues: unknown[] = []
  let returnIndex = 0

  const pushCall = (method: string, args: unknown[]) => {
    calls.push({ method, args })
  }

  const proxy: unknown = new Proxy(() => proxy, {
    get(_target: unknown, prop: string) {
      if (prop === "then") {
        return (resolve: (value: unknown) => void) => {
          const value = returnValues[returnIndex] ?? returnValues.at(-1)
          returnIndex++
          resolve(value)
        }
      }

      return (...args: unknown[]) => {
        pushCall(prop, args)
        return proxy
      }
    },
    apply(_target: unknown, _thisArg: unknown, args: unknown[]) {
      pushCall("apply", args)
      return proxy
    },
  })

  return {
    db: proxy,
    calls,
    queue(values: unknown[]) {
      returnValues.push(...values)
    },
  }
}

const usersTable = Symbol("users")
const sessionsTable = Symbol("sessions")

const authUser = {
  id: "user_001",
  email: "test@example.com",
  name: "Test User",
  username: "testuser",
  image: null,
  phoneNumber: null,
  about: null,
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
}

function makeSessionRow(expiresAt: Date) {
  return {
    user: authUser,
    session: {
      id: "session_hash",
      userId: authUser.id,
      expiresAt,
    },
  }
}

describe("generateSessionToken", () => {
  it("produces a 32-character base32 token", () => {
    const token = generateSessionToken()
    expect(token).toHaveLength(32)
    expect(token).toMatch(/^[a-z2-7]+$/)
  })

  it("produces unique tokens", () => {
    const tokens = new Set(Array.from({ length: 10 }, generateSessionToken))
    expect(tokens.size).toBe(10)
  })
})

describe("createSession", () => {
  it("inserts a session and returns token with 30-day expiry", async () => {
    const { db, calls } = createMockDb()

    const result = await createSession(
      { db, tables: { users: usersTable, sessions: sessionsTable } },
      authUser.id,
    )

    expect(result.token).toHaveLength(32)
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(result.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
      30 * 24 * 60 * 60 * 1000 + 1000,
    )

    const insertCall = calls.find((call) => call.method === "insert")
    expect(insertCall?.args[0]).toBe(sessionsTable)

    const valuesCall = calls.find((call) => call.method === "values")
    expect(valuesCall?.args[0]).toMatchObject({
      userId: authUser.id,
      expiresAt: result.expiresAt,
    })
    expect(valuesCall?.args[0]).toHaveProperty("id")
  })
})

describe("validateSession", () => {
  it("returns session and user for a valid token", async () => {
    const { db, queue } = createMockDb()
    queue([[makeSessionRow(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))]])

    const result = await validateSession(
      { db, tables: { users: usersTable, sessions: sessionsTable } },
      "valid_token",
    )

    expect(result.session).not.toBeNull()
    expect(result.user).toMatchObject(authUser)
  })

  it("returns null for an unknown token", async () => {
    const { db, queue } = createMockDb()
    queue([[]])

    const result = await validateSession(
      { db, tables: { users: usersTable, sessions: sessionsTable } },
      "unknown_token",
    )

    expect(result.session).toBeNull()
    expect(result.user).toBeNull()
  })

  it("deletes expired sessions and returns null", async () => {
    const { db, calls, queue } = createMockDb()
    queue([[makeSessionRow(new Date(Date.now() - 1000))]])

    const result = await validateSession(
      { db, tables: { users: usersTable, sessions: sessionsTable } },
      "expired_token",
    )

    expect(result.session).toBeNull()
    expect(result.user).toBeNull()
    expect(calls.some((call) => call.method === "delete")).toBe(true)
  })

  it("refreshes sessions close to expiry", async () => {
    const { db, calls, queue } = createMockDb()
    const nearExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    queue([[makeSessionRow(nearExpiry)]])

    const result = await validateSession(
      { db, tables: { users: usersTable, sessions: sessionsTable } },
      "near_expiry_token",
    )

    expect(result.session).not.toBeNull()

    const updateCall = calls.find((call) => call.method === "update")
    expect(updateCall?.args[0]).toBe(sessionsTable)

    const setCall = calls.find((call) => call.method === "set")
    const setValues = setCall?.args[0] as { expiresAt: Date }
    expect(setValues).toMatchObject({
      expiresAt: expect.any(Date),
    })
    expect(setValues.expiresAt.getTime()).toBeGreaterThan(nearExpiry.getTime())
  })
})

describe("invalidateSession", () => {
  it("deletes the session by id", async () => {
    const { db, calls } = createMockDb()

    await invalidateSession(
      { db, tables: { users: usersTable, sessions: sessionsTable } },
      "session_hash",
    )

    const deleteCall = calls.find((call) => call.method === "delete")
    expect(deleteCall?.args[0]).toBe(sessionsTable)
  })
})
