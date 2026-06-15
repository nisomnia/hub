import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

vi.mock("arctic", () => ({
  Google: class MockGoogle {
    createAuthorizationURL() {
      return new URL("https://accounts.google.com/o/oauth2/v2/auth")
    }

    async validateAuthorizationCode() {
      return { idToken: () => "id_token" }
    }
  },
  generateState: () => "oauth_state",
  generateCodeVerifier: () => "code_verifier",
  decodeIdToken: () => ({
    sub: "google_123",
    name: "Test User",
    picture: "https://example.com/avatar.png",
    email: "test@example.com",
  }),
}))

vi.mock("auth", () => ({
  createSession: vi.fn(),
  invalidateSession: vi.fn(),
  validateSession: vi.fn(),
}))

vi.mock("@/db", () => {
  let callIndex = 0

  const proxy: unknown = new Proxy(() => proxy, {
    get(_target: unknown, prop: string) {
      if (prop === "then") {
        return (resolve: (value: unknown) => void) => {
          const queue =
            (globalThis as { __authDbQueue?: unknown[] }).__authDbQueue ?? []
          const value = queue[callIndex] ?? queue[queue.length - 1]
          callIndex++
          resolve(value)
        }
      }
      return () => proxy
    },
    apply() {
      return proxy
    },
  })

  return {
    db: proxy,
    accounts: Symbol("accounts"),
    sessions: Symbol("sessions"),
    users: Symbol("users"),
  }
})

vi.mock("env/server", () => ({
  honoEnv: {
    NODE_ENV: "development",
    GOOGLE_CLIENT_ID: "google_client_id",
    GOOGLE_CLIENT_SECRET: "google_client_secret",
    GOOGLE_REDIRECT_URL:
      "http://localhost:8000/api/public/auth/login/google/callback",
    PUBLIC_API_URL: "http://localhost:8000/api",
  },
}))

vi.mock("@/lib/utils", () => ({
  cuid: () => "new_user_id",
}))

import type { AuthUser } from "auth"
import { createSession, invalidateSession, validateSession } from "auth"

import { mountAuthRoutes } from "@/routers/auth"

import { userFixture } from "./fixtures"

function createApp() {
  const app = new Hono()
  mountAuthRoutes(app)
  return app
}

function getCookies(res: Response): string[] {
  return (res.headers as unknown as { getSetCookie(): string[] }).getSetCookie()
}

describe("auth routes", () => {
  beforeEach(() => {
    vi.mocked(createSession).mockReset()
    vi.mocked(invalidateSession).mockReset()
    vi.mocked(validateSession).mockReset()
    ;(globalThis as { __authDbQueue?: unknown[] }).__authDbQueue = []
  })

  describe("GET /api/public/auth/login/google", () => {
    it("redirects to Google with OAuth state cookies", async () => {
      const app = createApp()
      const res = await app.request("/api/public/auth/login/google")

      expect(res.status).toBe(302)
      expect(res.headers.get("location")).toBe(
        "https://accounts.google.com/o/oauth2/v2/auth",
      )

      const cookies = getCookies(res)
      expect(
        cookies.some((cookie) => cookie.startsWith("google_oauth_state=")),
      ).toBe(true)
      expect(
        cookies.some((cookie) => cookie.startsWith("google_code_verifier=")),
      ).toBe(true)
    })
  })

  describe("GET /api/public/auth/login/google/callback", () => {
    it("creates a session for an existing account and redirects", async () => {
      ;(globalThis as { __authDbQueue?: unknown[] }).__authDbQueue = [
        [{ userId: "existing_user_id" }],
      ]
      vi.mocked(createSession).mockResolvedValue({
        token: "session_token",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const app = createApp()
      const res = await app.request(
        "/api/public/auth/login/google/callback?code=code&state=oauth_state",
        {
          headers: {
            Cookie:
              "google_oauth_state=oauth_state; google_code_verifier=code_verifier",
          },
        },
      )

      expect(res.status).toBe(302)
      expect(vi.mocked(createSession)).toHaveBeenCalledWith(
        expect.anything(),
        "existing_user_id",
      )

      const cookies = getCookies(res)
      expect(cookies.some((cookie) => cookie.startsWith("session="))).toBe(true)
    })

    it("creates a new user and session when no account exists", async () => {
      ;(globalThis as { __authDbQueue?: unknown[] }).__authDbQueue = [
        [],
        [],
        [],
      ]
      vi.mocked(createSession).mockResolvedValue({
        token: "session_token",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const app = createApp()
      const res = await app.request(
        "/api/public/auth/login/google/callback?code=code&state=oauth_state",
        {
          headers: {
            Cookie:
              "google_oauth_state=oauth_state; google_code_verifier=code_verifier",
          },
        },
      )

      expect(res.status).toBe(302)
      expect(vi.mocked(createSession)).toHaveBeenCalledWith(
        expect.anything(),
        "new_user_id",
      )
      const cookies = getCookies(res)
      expect(cookies.some((cookie) => cookie.startsWith("session="))).toBe(true)
    })

    it("rejects callback when state is missing", async () => {
      const app = createApp()
      const res = await app.request(
        "/api/public/auth/login/google/callback?code=code&state=oauth_state",
      )

      expect(res.status).toBe(400)
      expect(vi.mocked(createSession)).not.toHaveBeenCalled()
    })
  })

  describe("POST /api/public/auth/logout", () => {
    it("invalidates the session and clears the cookie", async () => {
      vi.mocked(validateSession).mockResolvedValue({
        session: {
          id: "session_hash",
          userId: "user_001",
          expiresAt: new Date(),
        },
        user: userFixture() as AuthUser,
      })

      const app = createApp()
      const res = await app.request("/api/public/auth/logout", {
        method: "POST",
        headers: { Cookie: "session=session_token" },
      })

      expect(res.status).toBe(302)
      expect(vi.mocked(validateSession)).toHaveBeenCalledWith(
        expect.anything(),
        "session_token",
      )
      expect(vi.mocked(invalidateSession)).toHaveBeenCalledWith(
        expect.anything(),
        "session_hash",
      )

      const cookies = getCookies(res)
      expect(cookies.some((cookie) => cookie.startsWith("session=;"))).toBe(
        true,
      )
    })

    it("still clears the cookie when no session exists", async () => {
      vi.mocked(validateSession).mockResolvedValue({
        session: null,
        user: null,
      })

      const app = createApp()
      const res = await app.request("/api/public/auth/logout", {
        method: "POST",
        headers: { Cookie: "session=invalid_token" },
      })

      expect(res.status).toBe(302)
      expect(vi.mocked(invalidateSession)).not.toHaveBeenCalled()

      const cookies = getCookies(res)
      expect(cookies.some((cookie) => cookie.startsWith("session=;"))).toBe(
        true,
      )
    })
  })
})
