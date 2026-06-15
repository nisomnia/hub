import { describe, expect, it, vi } from "vite-plus/test"

import { callHandler, createMockDb, adFixture, userFixture } from "./fixtures"

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

import { adRouter } from "@/routers/ad"

const {
  adDashboard,
  adById,
  adByPosition,
  adCount,
  adSearch,
  adCreate,
  adUpdate,
  adDelete,
} = adRouter

const adminContext = { user: userFixture({ role: "admin" }) }
const userContext = { user: userFixture() }

describe("adDashboard", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(adDashboard, { page: 1, perPage: 10 }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(adDashboard, { page: 1, perPage: 10 }, userContext),
    ).rejects.toThrow("Admin access required")
  })

  it("returns paginated ads for admin", async () => {
    const ad = adFixture()
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(
      adDashboard,
      { page: 1, perPage: 10 },
      adminContext,
    )
    expect(result).toEqual([ad])
  })
})

describe("adById", () => {
  it("returns ad when found", async () => {
    const ad = adFixture()
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(adById, { id: "ad_001" })
    expect(result).toEqual(ad)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(adById, { id: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("adByPosition", () => {
  it("returns ads by position", async () => {
    const ad = adFixture({ position: "home_below_header" })
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(adByPosition, {
      position: "home_below_header",
    })
    expect(result).toEqual([ad])
  })
})

describe("adCount", () => {
  it("returns count", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 5 }]]
    const result = await callHandler(adCount, {})
    expect(result).toBe(5)
  })

  it("returns 0 when no ads", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(adCount, {})
    expect(result).toBe(0)
  })
})

describe("adSearch", () => {
  it("returns matching ads", async () => {
    const ad = adFixture({ title: "Test Ad" })
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(adSearch, {
      searchQuery: "Test",
      limit: 10,
    })
    expect(result).toEqual([ad])
  })

  it("respects limit", async () => {
    mockCallIndex = 0
    mockReturnValues = [[adFixture({ id: "ad_001" })]]
    const result = await callHandler(adSearch, {
      searchQuery: "Test",
      limit: 1,
    })
    expect(result).toHaveLength(1)
  })
})

describe("adCreate", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(
        adCreate,
        {
          title: "New Ad",
          content: "Content",
          position: "home_below_header",
          type: "plain_ad",
          active: true,
        },
        null,
      ),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(
        adCreate,
        {
          title: "New Ad",
          content: "Content",
          position: "home_below_header",
          type: "plain_ad",
          active: true,
        },
        userContext,
      ),
    ).rejects.toThrow("Admin access required")
  })

  it("creates a new ad for admin", async () => {
    const ad = adFixture({
      title: "New Ad",
      position: "home_below_header",
      type: "plain_ad",
    })
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(
      adCreate,
      {
        title: "New Ad",
        content: "Content",
        position: "home_below_header",
        type: "plain_ad",
        active: true,
      },
      adminContext,
    )
    expect(result).toEqual([ad])
  })
})

describe("adUpdate", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(adUpdate, { id: "ad_001", title: "Updated Ad" }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(adUpdate, { id: "ad_001", title: "Updated Ad" }, userContext),
    ).rejects.toThrow("Admin access required")
  })

  it("updates an existing ad for admin", async () => {
    const ad = adFixture({ title: "Updated Ad" })
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(
      adUpdate,
      {
        id: "ad_001",
        title: "Updated Ad",
      },
      adminContext,
    )
    expect(result).toEqual([ad])
  })
})

describe("adDelete", () => {
  it("throws when unauthenticated", async () => {
    await expect(callHandler(adDelete, { id: "ad_001" }, null)).rejects.toThrow(
      "Authentication required",
    )
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(adDelete, { id: "ad_001" }, userContext),
    ).rejects.toThrow("Admin access required")
  })

  it("deletes an ad for admin", async () => {
    const ad = adFixture()
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(adDelete, { id: "ad_001" }, adminContext)
    expect(result).toEqual([ad])
  })
})
