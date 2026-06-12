import { describe, expect, it, vi } from "vite-plus/test"

import { callHandler, createMockDb, adFixture } from "@/test/fixtures"

let mockCallIndex = 0
let mockReturnValues: any[] = []

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

describe("adDashboard", () => {
  it("returns paginated ads", async () => {
    const ad = adFixture()
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(adDashboard, { page: 1, perPage: 10 })
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
  it("creates a new ad", async () => {
    const ad = adFixture({
      title: "New Ad",
      position: "home_below_header",
      type: "plain_ad",
    })
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(adCreate, {
      title: "New Ad",
      content: "Content",
      position: "home_below_header",
      type: "plain_ad",
      active: true,
    })
    expect(result).toEqual([ad])
  })
})

describe("adUpdate", () => {
  it("updates an existing ad", async () => {
    const ad = adFixture({ title: "Updated Ad" })
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(adUpdate, {
      id: "ad_001",
      title: "Updated Ad",
    })
    expect(result).toEqual([ad])
  })
})

describe("adDelete", () => {
  it("deletes an ad", async () => {
    const ad = adFixture()
    mockCallIndex = 0
    mockReturnValues = [[ad]]
    const result = await callHandler(adDelete, { id: "ad_001" })
    expect(result).toEqual([ad])
  })
})
