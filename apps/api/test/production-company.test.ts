import { describe, expect, it, vi } from "vite-plus/test"

import { callHandler, createMockDb, productionCompanyFixture } from "./fixtures"

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

import { productionCompanyRouter } from "@/routers/production-company"

const {
  productionCompanyDashboard,
  productionCompanyById,
  productionCompanyByTmdbId,
  productionCompanyBySlug,
  productionCompanySitemap,
  productionCompanyCount,
  productionCompanyCountDashboard,
  productionCompanySearch,
  productionCompanySearchDashboard,
  productionCompanyCreate,
  productionCompanyUpdate,
  productionCompanyDelete,
} = productionCompanyRouter

describe("productionCompanyDashboard", () => {
  it("returns paginated list", async () => {
    const pc = productionCompanyFixture()
    mockCallIndex = 0
    mockReturnValues = [[pc]]
    const result = await callHandler(productionCompanyDashboard, {
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([pc])
  })
})

describe("productionCompanyById", () => {
  it("returns company when found", async () => {
    const pc = productionCompanyFixture()
    mockCallIndex = 0
    mockReturnValues = [[pc]]
    const result = await callHandler(productionCompanyById, { id: "pc_001" })
    expect(result).toEqual(pc)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(productionCompanyById, {
      id: "nonexistent",
    })
    expect(result).toBeNull()
  })
})

describe("productionCompanyByTmdbId", () => {
  it("returns company by tmdbId", async () => {
    const pc = productionCompanyFixture({ tmdbId: "1" })
    mockCallIndex = 0
    mockReturnValues = [[pc]]
    const result = await callHandler(productionCompanyByTmdbId, { tmdbId: "1" })
    expect(result).toEqual(pc)
  })
})

describe("productionCompanyBySlug", () => {
  it("returns company by slug", async () => {
    const pc = productionCompanyFixture({ slug: "test-studio" })
    mockCallIndex = 0
    mockReturnValues = [[pc]]
    const result = await callHandler(productionCompanyBySlug, {
      slug: "test-studio",
    })
    expect(result).toEqual(pc)
  })
})

describe("productionCompanySitemap", () => {
  it("returns sitemap data", async () => {
    const row = { slug: "test-studio", updatedAt: new Date() }
    mockCallIndex = 0
    mockReturnValues = [[row]]
    const result = await callHandler(productionCompanySitemap, {
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([row])
  })
})

describe("productionCompanyCount", () => {
  it("returns count of published companies", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 5 }]]
    const result = await callHandler(productionCompanyCount, {})
    expect(result).toBe(5)
  })
})

describe("productionCompanyCountDashboard", () => {
  it("returns count of all companies", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 10 }]]
    const result = await callHandler(productionCompanyCountDashboard, {})
    expect(result).toBe(10)
  })
})

describe("productionCompanySearch", () => {
  it("returns published companies matching query", async () => {
    const pc = productionCompanyFixture()
    mockCallIndex = 0
    mockReturnValues = [[pc]]
    const result = await callHandler(productionCompanySearch, {
      searchQuery: "Studio",
      limit: 10,
    })
    expect(result).toEqual([pc])
  })
})

describe("productionCompanySearchDashboard", () => {
  it("returns all matching companies", async () => {
    const pc = productionCompanyFixture({ status: "draft" })
    mockCallIndex = 0
    mockReturnValues = [[pc]]
    const result = await callHandler(productionCompanySearchDashboard, {
      searchQuery: "Studio",
      limit: 10,
    })
    expect(result).toEqual([pc])
  })
})

describe("productionCompanyCreate", () => {
  it("creates with generated slug", async () => {
    const pc = productionCompanyFixture({
      name: "New Studio",
      slug: "new-studio",
    })
    mockCallIndex = 0
    mockReturnValues = [[], [pc]]
    const result = await callHandler(productionCompanyCreate, {
      name: "New Studio",
      tmdbId: "1",
      description: "Desc",
      status: "published",
    })
    expect(result).toEqual([pc])
  })
})

describe("productionCompanyUpdate", () => {
  it("updates a company", async () => {
    const pc = productionCompanyFixture({ name: "Updated Studio" })
    mockCallIndex = 0
    mockReturnValues = [[pc]]
    const result = await callHandler(productionCompanyUpdate, {
      id: "pc_001",
      name: "Updated Studio",
    })
    expect(result).toEqual([pc])
  })
})

describe("productionCompanyDelete", () => {
  it("deletes a company", async () => {
    const pc = productionCompanyFixture()
    mockCallIndex = 0
    mockReturnValues = [[pc]]
    const result = await callHandler(productionCompanyDelete, { id: "pc_001" })
    expect(result).toEqual([pc])
  })
})
