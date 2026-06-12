import { describe, expect, it, vi } from "vite-plus/test"

import { createMockDb, genreFixture, callHandler } from "@/test/fixtures"

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

import { genreRouter } from "@/routers/genre"

const {
  genreDashboard,
  genreById,
  genreByTmdbId,
  genreByMovieCount,
  genreSitemap,
  genreBySlug,
  genreSearch,
  genreSearchDashboard,
  genreCount,
  genreCountDashboard,
  genreCreate,
  genreUpdate,
  genreDelete,
} = genreRouter

describe("genreDashboard", () => {
  it("returns paginated genres ordered by updatedAt desc", async () => {
    const g = genreFixture()
    mockCallIndex = 0
    mockReturnValues = [[g]]
    const result = await callHandler(genreDashboard, { page: 1, perPage: 10 })
    expect(result).toEqual([g])
  })
})

describe("genreById", () => {
  it("returns genre when found", async () => {
    const g = genreFixture()
    mockCallIndex = 0
    mockReturnValues = [[g]]
    const result = await callHandler(genreById, { id: "genre_001" })
    expect(result).toEqual(g)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(genreById, { id: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("genreByTmdbId", () => {
  it("returns genre by tmdbId", async () => {
    const g = genreFixture({ tmdbId: "28" })
    mockCallIndex = 0
    mockReturnValues = [[g]]
    const result = await callHandler(genreByTmdbId, { tmdbId: "28" })
    expect(result).toEqual(g)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(genreByTmdbId, { tmdbId: "999" })
    expect(result).toBeNull()
  })
})

describe("genreByMovieCount", () => {
  it("returns genres with movie counts", async () => {
    const row = { id: "genre_001", title: "Action", slug: "action", count: 5 }
    mockCallIndex = 0
    mockReturnValues = [[row]]
    const result = await callHandler(genreByMovieCount, {
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([row])
  })
})

describe("genreSitemap", () => {
  it("returns sitemap data", async () => {
    const row = { slug: "action", updatedAt: new Date() }
    mockCallIndex = 0
    mockReturnValues = [[row]]
    const result = await callHandler(genreSitemap, { page: 1, perPage: 10 })
    expect(result).toEqual([row])
  })
})

describe("genreBySlug", () => {
  it("returns genre by slug", async () => {
    const g = genreFixture({ slug: "action" })
    mockCallIndex = 0
    mockReturnValues = [[g]]
    const result = await callHandler(genreBySlug, { slug: "action" })
    expect(result).toEqual(g)
  })

  it("returns null when slug not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(genreBySlug, { slug: "nope" })
    expect(result).toBeNull()
  })
})

describe("genreSearch", () => {
  it("returns matching published genres", async () => {
    const g = genreFixture({ status: "published" })
    mockCallIndex = 0
    mockReturnValues = [[g]]
    const result = await callHandler(genreSearch, {
      searchQuery: "Act",
      limit: 10,
    })
    expect(result).toEqual([g])
  })
})

describe("genreSearchDashboard", () => {
  it("returns matching genres regardless of status", async () => {
    const g = genreFixture({ status: "draft" })
    mockCallIndex = 0
    mockReturnValues = [[g]]
    const result = await callHandler(genreSearchDashboard, {
      searchQuery: "Act",
      limit: 10,
    })
    expect(result).toEqual([g])
  })
})

describe("genreCount", () => {
  it("returns count of published genres", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 3 }]]
    const result = await callHandler(genreCount, {})
    expect(result).toBe(3)
  })

  it("returns 0 when no published genres", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(genreCount, {})
    expect(result).toBe(0)
  })
})

describe("genreCountDashboard", () => {
  it("returns count of all genres", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 10 }]]
    const result = await callHandler(genreCountDashboard, {})
    expect(result).toBe(10)
  })
})

describe("genreCreate", () => {
  it("creates a genre with generated slug", async () => {
    const g = genreFixture({ title: "New Genre", slug: "new-genre" })
    mockCallIndex = 0
    mockReturnValues = [[], [g]]
    const result = await callHandler(genreCreate, {
      title: "New Genre",
      description: "Desc",
      status: "published",
    })
    expect(result).toEqual([g])
  })
})

describe("genreUpdate", () => {
  it("updates a genre", async () => {
    const g = genreFixture({ title: "Updated Genre" })
    mockCallIndex = 0
    mockReturnValues = [[g]]
    const result = await callHandler(genreUpdate, {
      id: "genre_001",
      title: "Updated Genre",
    })
    expect(result).toEqual([g])
  })
})

describe("genreDelete", () => {
  it("deletes movieGenres and genre", async () => {
    const g = genreFixture()
    mockCallIndex = 0
    mockReturnValues = [undefined, [g]]
    const result = await callHandler(genreDelete, { id: "genre_001" })
    expect(result).toEqual([g])
  })
})
