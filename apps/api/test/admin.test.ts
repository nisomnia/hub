import { describe, expect, it, vi } from "vite-plus/test"

import { callHandler, createMockDb, userFixture } from "./fixtures"

let mockCallIndex = 0
let mockReturnValues: unknown[] = []

vi.mock("@/db", () => ({
  db: createMockDb(() => {
    const idx = mockCallIndex
    mockCallIndex++
    return (
      mockReturnValues[idx] ?? mockReturnValues[mockReturnValues.length - 1]
    )
  }),
}))

import { adminRouter } from "@/routers/admin"

const { adminUserCount, adminUserDashboard } = adminRouter

const adminContext = { user: userFixture({ role: "admin" }) }
const userContext = { user: userFixture() }

describe("adminUserCount", () => {
  it("throws when unauthenticated", async () => {
    await expect(callHandler(adminUserCount, {}, null)).rejects.toThrow(
      "Authentication required",
    )
  })

  it("throws for non-admin user", async () => {
    await expect(callHandler(adminUserCount, {}, userContext)).rejects.toThrow(
      "Admin access required",
    )
  })

  it("returns count for admin", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 42 }]]
    const result = await callHandler(adminUserCount, {}, adminContext)
    expect(result).toBe(42)
  })
})

describe("adminUserDashboard", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(adminUserDashboard, { page: 1, perPage: 10 }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(adminUserDashboard, { page: 1, perPage: 10 }, userContext),
    ).rejects.toThrow("Admin access required")
  })

  it("returns users for admin", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(
      adminUserDashboard,
      { page: 1, perPage: 10 },
      adminContext,
    )
    expect(result).toEqual([u])
  })
})
