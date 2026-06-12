import { describe, expect, it, vi } from "vite-plus/test"

import { callHandler, createMockDb, mediaFixture } from "./fixtures"

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

import { mediaRouter } from "@/routers/media"

const {
  mediaDashboard,
  mediaDashboardInfinite,
  mediaDashboardInfiniteByCategory,
  mediaById,
  mediaByName,
  mediaByAuthorId,
  mediaSearch,
  mediaByCategory,
  mediaSearchByCategory,
  mediaSitemap,
  mediaCount,
  mediaCreate,
  mediaUpdate,
  mediaDeleteById,
  mediaDeleteByName,
} = mediaRouter

describe("mediaDashboard", () => {
  it("returns paginated media ordered by createdAt desc", async () => {
    const m = mediaFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaDashboard, { page: 1, perPage: 10 })
    expect(result).toEqual([m])
  })
})

describe("mediaDashboardInfinite", () => {
  it("returns medias without cursor and no overflow", async () => {
    const m1 = mediaFixture({ id: "media_001" })
    const m2 = mediaFixture({ id: "media_002" })
    mockCallIndex = 0
    mockReturnValues = [[m1, m2]]
    const result = await callHandler(mediaDashboardInfinite, { limit: 2 })
    expect(result.medias).toEqual([m1, m2])
    expect(result.nextCursor).toBeNull()
  })

  it("returns medias with cursor and overflow", async () => {
    const m1 = mediaFixture({ id: "media_001" })
    const m2 = mediaFixture({ id: "media_002" })
    const m3 = mediaFixture({ id: "media_003" })
    mockCallIndex = 0
    mockReturnValues = [[m1, m2, m3]]
    const result = await callHandler(mediaDashboardInfinite, {
      limit: 2,
      cursor: new Date("2026-01-02T00:00:00.000Z"),
    })
    expect(result.medias).toEqual([m1, m2])
    expect(result.nextCursor).toEqual(m3.createdAt)
  })

  it("returns medias with cursor and no overflow", async () => {
    const m1 = mediaFixture({ id: "media_001" })
    const m2 = mediaFixture({ id: "media_002" })
    mockCallIndex = 0
    mockReturnValues = [[m1, m2]]
    const result = await callHandler(mediaDashboardInfinite, {
      limit: 2,
      cursor: new Date("2026-01-02T00:00:00.000Z"),
    })
    expect(result.medias).toEqual([m1, m2])
    expect(result.nextCursor).toBeNull()
  })
})

describe("mediaDashboardInfiniteByCategory", () => {
  it("returns medias by category without cursor and no overflow", async () => {
    const m1 = mediaFixture({ id: "media_001", category: "article" })
    const m2 = mediaFixture({ id: "media_002", category: "article" })
    mockCallIndex = 0
    mockReturnValues = [[m1, m2]]
    const result = await callHandler(mediaDashboardInfiniteByCategory, {
      limit: 2,
      category: "article",
    })
    expect(result.medias).toEqual([m1, m2])
    expect(result.nextCursor).toBeNull()
  })

  it("returns medias by category with cursor and overflow", async () => {
    const m1 = mediaFixture({ id: "media_001", category: "article" })
    const m2 = mediaFixture({ id: "media_002", category: "article" })
    const m3 = mediaFixture({ id: "media_003", category: "article" })
    mockCallIndex = 0
    mockReturnValues = [[m1, m2, m3]]
    const result = await callHandler(mediaDashboardInfiniteByCategory, {
      limit: 2,
      cursor: new Date("2026-01-02T00:00:00.000Z"),
      category: "article",
    })
    expect(result.medias).toEqual([m1, m2])
    expect(result.nextCursor).toEqual(m3.createdAt)
  })

  it("returns medias by category with cursor and no overflow", async () => {
    const m1 = mediaFixture({ id: "media_001", category: "article" })
    const m2 = mediaFixture({ id: "media_002", category: "article" })
    mockCallIndex = 0
    mockReturnValues = [[m1, m2]]
    const result = await callHandler(mediaDashboardInfiniteByCategory, {
      limit: 2,
      cursor: new Date("2026-01-02T00:00:00.000Z"),
      category: "article",
    })
    expect(result.medias).toEqual([m1, m2])
    expect(result.nextCursor).toBeNull()
  })
})

describe("mediaById", () => {
  it("returns media when found", async () => {
    const m = mediaFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaById, { imageId: "media_001" })
    expect(result).toEqual(m)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(mediaById, { imageId: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("mediaByName", () => {
  it("returns media when found", async () => {
    const m = mediaFixture({ name: "test-image.jpg" })
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaByName, { name: "test-image.jpg" })
    expect(result).toEqual(m)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(mediaByName, { name: "nonexistent.jpg" })
    expect(result).toBeNull()
  })
})

describe("mediaByAuthorId", () => {
  it("returns paginated media by author", async () => {
    const m = mediaFixture({ authorId: "user_001" })
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaByAuthorId, {
      authorId: "user_001",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([m])
  })
})

describe("mediaSearch", () => {
  it("returns media matching search query", async () => {
    const m = mediaFixture({ name: "test-image.jpg" })
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaSearch, {
      searchQuery: "test",
      limit: 10,
    })
    expect(result).toEqual([m])
  })
})

describe("mediaByCategory", () => {
  it("returns paginated media by category", async () => {
    const m = mediaFixture({ category: "article" })
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaByCategory, {
      category: "article",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([m])
  })
})

describe("mediaSearchByCategory", () => {
  it("returns media matching search within category", async () => {
    const m = mediaFixture({ name: "test-image.jpg", category: "article" })
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaSearchByCategory, {
      searchQuery: "test",
      limit: 10,
      category: "article",
    })
    expect(result).toEqual([m])
  })
})

describe("mediaSitemap", () => {
  it("returns paginated name and updatedAt", async () => {
    const m = mediaFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ name: m.name, updatedAt: m.updatedAt }]]
    const result = await callHandler(mediaSitemap, { page: 1, perPage: 10 })
    expect(result).toEqual([{ name: m.name, updatedAt: m.updatedAt }])
  })
})

describe("mediaCount", () => {
  it("returns total count", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 5 }]]
    const result = await callHandler(mediaCount, {})
    expect(result).toBe(5)
  })

  it("returns 0 when no media", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(mediaCount, {})
    expect(result).toBe(0)
  })
})

describe("mediaCreate", () => {
  it("creates a new media", async () => {
    const m = mediaFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaCreate, {
      name: "test-image.jpg",
      url: "https://example.com/test.jpg",
      fileType: "jpg",
      category: "article",
      type: "image",
      description: "Test media",
      authorId: "user_001",
    })
    expect(result).toEqual([m])
  })
})

describe("mediaUpdate", () => {
  it("updates an existing media", async () => {
    const m = mediaFixture({ name: "updated.jpg" })
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaUpdate, {
      id: "media_001",
      name: "updated.jpg",
    })
    expect(result).toEqual([m])
  })
})

describe("mediaDeleteById", () => {
  it("deletes media by id", async () => {
    const m = mediaFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaDeleteById, { id: "media_001" })
    expect(result).toEqual([m])
  })
})

describe("mediaDeleteByName", () => {
  it("deletes media by name", async () => {
    const m = mediaFixture({ name: "test.jpg" })
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(mediaDeleteByName, { name: "test.jpg" })
    expect(result).toEqual([m])
  })
})
