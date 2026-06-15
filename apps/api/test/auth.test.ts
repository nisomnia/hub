import { Hono } from "hono"
import { describe, expect, it, vi } from "vite-plus/test"

vi.mock("auth", () => ({
  validateSession: vi.fn(),
}))

vi.mock("@/db", () => ({
  db: {},
}))

import { validateSession } from "auth"

import { authMiddleware } from "@/auth/middleware"

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

function createApp() {
  const app = new Hono()
  app.use(authMiddleware)
  app.get("/", (c) => {
    const user = c.get("user")
    return c.json({ userId: user?.id ?? null })
  })
  return app
}

describe("authMiddleware", () => {
  it("sets user to null when no session cookie is present", async () => {
    vi.mocked(validateSession).mockReset()

    const app = createApp()
    const res = await app.request("/")

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: null })
    expect(validateSession).not.toHaveBeenCalled()
  })

  it("sets user from a valid session", async () => {
    vi.mocked(validateSession).mockReset()
    vi.mocked(validateSession).mockResolvedValue({
      session: {
        id: "session_hash",
        userId: authUser.id,
        expiresAt: new Date(),
      },
      user: authUser,
    })

    const app = createApp()
    const res = await app.request("/", {
      headers: { Cookie: "session=valid_token" },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: authUser.id })
    expect(validateSession).toHaveBeenCalledWith(
      expect.anything(),
      "valid_token",
    )
  })

  it("sets user to null when session is invalid", async () => {
    vi.mocked(validateSession).mockReset()
    vi.mocked(validateSession).mockResolvedValue({ session: null, user: null })

    const app = createApp()
    const res = await app.request("/", {
      headers: { Cookie: "session=invalid_token" },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: null })
    expect(validateSession).toHaveBeenCalledWith(
      expect.anything(),
      "invalid_token",
    )
  })
})
