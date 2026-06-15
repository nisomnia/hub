import { describe, expect, it } from "vite-plus/test"

import {
  requireAdmin,
  requireAuth,
  requireAuthor,
  requireAuthorOrAdmin,
} from "../src/guards.ts"

const user = {
  id: "user_001",
  email: "test@example.com",
  name: "Test User",
  username: "testuser",
  image: null,
  phoneNumber: null,
  about: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const admin = { ...user, role: "admin" as const }
const author = { ...user, role: "author" as const }
const member = { ...user, role: "member" as const }

describe("requireAuth", () => {
  it("returns user when present", () => {
    expect(requireAuth(user)).toBe(user)
  })

  it("throws AuthError when user is null", () => {
    expect(() => requireAuth(null)).toThrow("Authentication required")
  })

  it("throws AuthError when user is undefined", () => {
    expect(() => requireAuth(undefined)).toThrow("Authentication required")
  })
})

describe("requireAdmin", () => {
  it("returns admin user", () => {
    expect(requireAdmin(admin)).toBe(admin)
  })

  it("throws for non-admin roles", () => {
    expect(() => requireAdmin(user)).toThrow("Admin access required")
    expect(() => requireAdmin(author)).toThrow("Admin access required")
  })

  it("throws when unauthenticated", () => {
    expect(() => requireAdmin(null)).toThrow("Authentication required")
  })
})

describe("requireAuthor", () => {
  it("returns author user", () => {
    expect(requireAuthor(author)).toBe(author)
  })

  it("throws for non-author roles", () => {
    expect(() => requireAuthor(user)).toThrow("Author access required")
    expect(() => requireAuthor(admin)).toThrow("Author access required")
  })
})

describe("requireAuthorOrAdmin", () => {
  it("returns author or admin user", () => {
    expect(requireAuthorOrAdmin(author)).toBe(author)
    expect(requireAuthorOrAdmin(admin)).toBe(admin)
  })

  it("throws for user or member roles", () => {
    expect(() => requireAuthorOrAdmin(user)).toThrow(
      "Author or admin access required",
    )
    expect(() => requireAuthorOrAdmin(member)).toThrow(
      "Author or admin access required",
    )
  })
})
