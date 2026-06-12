import { describe, expect, it, vi } from "vite-plus/test"

import {
  callHandler,
  createMockDb,
  feedFixture,
  feedTopicFixture,
} from "@/test/fixtures"

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

import { feedRouter } from "@/routers/feed"

const {
  feedById,
  feedByLanguage,
  feedByLanguageInfinite,
  feedByTopicId,
  feedByTopicIdInfinite,
  feedByOwner,
  feedByOwnerInfinite,
  feedRelatedInfinite,
  feedDashboard,
  feedSitemap,
  feedCount,
  feedCountDashboard,
  feedCountByLanguage,
  feedSearch,
  feedSearchDashboard,
  feedCreate,
  feedUpdate,
  feedUpdateWithoutChangeUpdatedDate,
  feedDelete,
} = feedRouter

describe("feedById", () => {
  it("returns feed with topics when found", async () => {
    const feed = feedFixture()
    const topic = { id: "topic_001", title: "Test Topic" }
    mockCallIndex = 0
    mockReturnValues = [[feed], [topic]]
    const result = await callHandler(feedById, { id: feed.id })
    expect(result).toEqual({ ...feed, topics: [topic] })
  })

  it("returns null when feed not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(feedById, { id: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("feedByLanguage", () => {
  it("returns paginated feeds by language ordered by updatedAt desc", async () => {
    const feed = feedFixture({ language: "id" })
    mockCallIndex = 0
    mockReturnValues = [[feed]]
    const result = await callHandler(feedByLanguage, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([feed])
  })
})

describe("feedByLanguageInfinite", () => {
  it("returns feeds with nextCursor when overflow", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    const f2 = feedFixture({ id: "feed_002" })
    const f3 = feedFixture({ id: "feed_003" })
    mockCallIndex = 0
    mockReturnValues = [[f1, f2, f3]]
    const result = await callHandler(feedByLanguageInfinite, {
      language: "id",
      limit: 2,
    })
    expect(result.feeds).toEqual([f1, f2])
    expect(result.nextCursor).toBe(f3.updatedAt)
  })

  it("returns feeds with null nextCursor when no overflow", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    const f2 = feedFixture({ id: "feed_002" })
    mockCallIndex = 0
    mockReturnValues = [[f1, f2]]
    const result = await callHandler(feedByLanguageInfinite, {
      language: "id",
      limit: 2,
    })
    expect(result.feeds).toEqual([f1, f2])
    expect(result.nextCursor).toBeNull()
  })

  it("returns feeds with cursor filter", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    mockCallIndex = 0
    mockReturnValues = [[f1]]
    const result = await callHandler(feedByLanguageInfinite, {
      language: "id",
      limit: 2,
      cursor: new Date("2026-06-01"),
    })
    expect(result.feeds).toEqual([f1])
    expect(result.nextCursor).toBeNull()
  })
})

describe("feedByTopicId", () => {
  it("returns feeds filtered by topic id", async () => {
    const feed = feedFixture({ id: "feed_001" })
    mockCallIndex = 0
    mockReturnValues = [[{ feedId: "feed_001" }], [feed]]
    const result = await callHandler(feedByTopicId, {
      language: "id",
      topicId: "topic_001",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([feed])
  })
})

describe("feedByTopicIdInfinite", () => {
  it("returns feeds with nextCursor when overflow after filter", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    const f2 = feedFixture({ id: "feed_002" })
    const f3 = feedFixture({ id: "feed_003" })
    mockCallIndex = 0
    mockReturnValues = [
      [{ feedId: "feed_001" }, { feedId: "feed_002" }, { feedId: "feed_003" }],
      [f1, f2, f3],
    ]
    const result = await callHandler(feedByTopicIdInfinite, {
      language: "id",
      topicId: "topic_001",
      limit: 2,
    })
    expect(result.feeds).toEqual([f1, f2])
    expect(result.nextCursor).toBe(f3.updatedAt)
  })

  it("returns feeds with null nextCursor when no overflow after filter", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    mockCallIndex = 0
    mockReturnValues = [[{ feedId: "feed_001" }], [f1]]
    const result = await callHandler(feedByTopicIdInfinite, {
      language: "id",
      topicId: "topic_001",
      limit: 2,
    })
    expect(result.feeds).toEqual([f1])
    expect(result.nextCursor).toBeNull()
  })

  it("returns feeds with cursor filter", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    mockCallIndex = 0
    mockReturnValues = [[{ feedId: "feed_001" }], [f1]]
    const result = await callHandler(feedByTopicIdInfinite, {
      language: "id",
      topicId: "topic_001",
      limit: 2,
      cursor: new Date("2026-06-01"),
    })
    expect(result.feeds).toEqual([f1])
    expect(result.nextCursor).toBeNull()
  })
})

describe("feedByOwner", () => {
  it("returns paginated feeds by language and owner", async () => {
    const feed = feedFixture({ language: "id", owner: "Test Owner" })
    mockCallIndex = 0
    mockReturnValues = [[feed]]
    const result = await callHandler(feedByOwner, {
      language: "id",
      owner: "Test Owner",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([feed])
  })
})

describe("feedByOwnerInfinite", () => {
  it("returns feeds with nextCursor when overflow", async () => {
    const f1 = feedFixture({ id: "feed_001", owner: "Test Owner" })
    const f2 = feedFixture({ id: "feed_002", owner: "Test Owner" })
    const f3 = feedFixture({ id: "feed_003", owner: "Test Owner" })
    mockCallIndex = 0
    mockReturnValues = [[f1, f2, f3]]
    const result = await callHandler(feedByOwnerInfinite, {
      language: "id",
      owner: "Test Owner",
      limit: 2,
    })
    expect(result.feeds).toEqual([f1, f2])
    expect(result.nextCursor).toBe(f3.updatedAt)
  })

  it("returns feeds with null nextCursor when no overflow", async () => {
    const f1 = feedFixture({ id: "feed_001", owner: "Test Owner" })
    const f2 = feedFixture({ id: "feed_002", owner: "Test Owner" })
    mockCallIndex = 0
    mockReturnValues = [[f1, f2]]
    const result = await callHandler(feedByOwnerInfinite, {
      language: "id",
      owner: "Test Owner",
      limit: 2,
    })
    expect(result.feeds).toEqual([f1, f2])
    expect(result.nextCursor).toBeNull()
  })

  it("returns feeds with cursor filter", async () => {
    const f1 = feedFixture({ id: "feed_001", owner: "Test Owner" })
    mockCallIndex = 0
    mockReturnValues = [[f1]]
    const result = await callHandler(feedByOwnerInfinite, {
      language: "id",
      owner: "Test Owner",
      limit: 2,
      cursor: new Date("2026-06-01"),
    })
    expect(result.feeds).toEqual([f1])
    expect(result.nextCursor).toBeNull()
  })
})

describe("feedRelatedInfinite", () => {
  it("returns related feeds with nextCursor when overflow after filter", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    const f2 = feedFixture({ id: "feed_002" })
    const f3 = feedFixture({ id: "feed_003" })
    mockCallIndex = 0
    mockReturnValues = [
      [{ feedId: "feed_001" }, { feedId: "feed_002" }, { feedId: "feed_003" }],
      [f1, f2, f3],
    ]
    const result = await callHandler(feedRelatedInfinite, {
      language: "id",
      topicId: "topic_001",
      currentFeedId: "feed_000",
      limit: 2,
    })
    expect(result.feeds).toEqual([f1, f2])
    expect(result.nextCursor).toBe(f3.updatedAt)
  })

  it("returns related feeds with null nextCursor when no overflow", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    mockCallIndex = 0
    mockReturnValues = [[{ feedId: "feed_001" }], [f1]]
    const result = await callHandler(feedRelatedInfinite, {
      language: "id",
      topicId: "topic_001",
      currentFeedId: "feed_000",
      limit: 2,
    })
    expect(result.feeds).toEqual([f1])
    expect(result.nextCursor).toBeNull()
  })

  it("returns related feeds with cursor filter", async () => {
    const f1 = feedFixture({ id: "feed_001" })
    mockCallIndex = 0
    mockReturnValues = [[{ feedId: "feed_001" }], [f1]]
    const result = await callHandler(feedRelatedInfinite, {
      language: "id",
      topicId: "topic_001",
      currentFeedId: "feed_000",
      limit: 2,
      cursor: new Date("2026-06-01"),
    })
    expect(result.feeds).toEqual([f1])
    expect(result.nextCursor).toBeNull()
  })
})

describe("feedDashboard", () => {
  it("returns paginated feeds ordered by updatedAt desc", async () => {
    const feed = feedFixture()
    mockCallIndex = 0
    mockReturnValues = [[feed]]
    const result = await callHandler(feedDashboard, { page: 1, perPage: 10 })
    expect(result).toEqual([feed])
  })
})

describe("feedSitemap", () => {
  it("returns sitemap data by language", async () => {
    const row = { slug: "test-feed", updatedAt: new Date() }
    mockCallIndex = 0
    mockReturnValues = [[row]]
    const result = await callHandler(feedSitemap, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([row])
  })
})

describe("feedCount", () => {
  it("returns count of all feeds", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 42 }]]
    const result = await callHandler(feedCount, {})
    expect(result).toBe(42)
  })

  it("returns 0 when no feeds", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(feedCount, {})
    expect(result).toBe(0)
  })
})

describe("feedCountDashboard", () => {
  it("returns count of all feeds", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 42 }]]
    const result = await callHandler(feedCountDashboard, {})
    expect(result).toBe(42)
  })
})

describe("feedCountByLanguage", () => {
  it("returns count of feeds by language", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 5 }]]
    const result = await callHandler(feedCountByLanguage, { language: "id" })
    expect(result).toBe(5)
  })

  it("returns 0 when no feeds for language", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(feedCountByLanguage, { language: "en" })
    expect(result).toBe(0)
  })
})

describe("feedSearch", () => {
  it("returns matching feeds by language and search query", async () => {
    const feed = feedFixture({ title: "Test Feed" })
    mockCallIndex = 0
    mockReturnValues = [[feed]]
    const result = await callHandler(feedSearch, {
      searchQuery: "Test",
      limit: 10,
      language: "id",
    })
    expect(result).toEqual([feed])
  })
})

describe("feedSearchDashboard", () => {
  it("returns matching feeds by search query", async () => {
    const feed = feedFixture({ title: "Test Feed" })
    mockCallIndex = 0
    mockReturnValues = [[feed]]
    const result = await callHandler(feedSearchDashboard, {
      searchQuery: "Test",
      limit: 10,
      language: "id",
    })
    expect(result).toEqual([feed])
  })
})

describe("feedCreate", () => {
  it("creates a feed with topics", async () => {
    const feed = feedFixture({ title: "New Feed" })
    mockCallIndex = 0
    mockReturnValues = [[], [feed], undefined]
    const result = await callHandler(feedCreate, {
      title: "New Feed",
      language: "id",
      link: "https://example.com",
      type: "website",
      owner: "Test Owner",
      status: "published",
      topics: ["topic_001"],
    })
    expect(result).toEqual([feed])
  })

  it("creates a feed without topics", async () => {
    const feed = feedFixture({ title: "New Feed" })
    mockCallIndex = 0
    mockReturnValues = [[], [feed]]
    const result = await callHandler(feedCreate, {
      title: "New Feed",
      language: "id",
      link: "https://example.com",
      type: "website",
      owner: "Test Owner",
      status: "published",
      topics: [],
    })
    expect(result).toEqual([feed])
  })
})

describe("feedUpdate", () => {
  it("updates a feed with topics", async () => {
    const feed = feedFixture({ title: "Updated Feed" })
    mockCallIndex = 0
    mockReturnValues = [[feed], undefined, undefined]
    const result = await callHandler(feedUpdate, {
      id: "feed_001",
      title: "Updated Feed",
      language: "id",
      link: "https://example.com",
      type: "website",
      owner: "Test Owner",
      status: "published",
      topics: ["topic_001"],
    })
    expect(result).toEqual([feed])
  })

  it("updates a feed without topics", async () => {
    const feed = feedFixture({ title: "Updated Feed" })
    mockCallIndex = 0
    mockReturnValues = [[feed], undefined]
    const result = await callHandler(feedUpdate, {
      id: "feed_001",
      title: "Updated Feed",
      language: "id",
      link: "https://example.com",
      type: "website",
      owner: "Test Owner",
      status: "published",
      topics: [],
    })
    expect(result).toEqual([feed])
  })
})

describe("feedUpdateWithoutChangeUpdatedDate", () => {
  it("updates a feed without changing updatedAt", async () => {
    const feed = feedFixture({ title: "Updated Feed" })
    mockCallIndex = 0
    mockReturnValues = [[feed], undefined, undefined]
    const result = await callHandler(feedUpdateWithoutChangeUpdatedDate, {
      id: "feed_001",
      title: "Updated Feed",
      language: "id",
      link: "https://example.com",
      type: "website",
      owner: "Test Owner",
      status: "published",
      topics: ["topic_001"],
    })
    expect(result).toEqual([feed])
  })
})

describe("feedDelete", () => {
  it("deletes feedTopics and feed", async () => {
    const feed = feedFixture()
    mockCallIndex = 0
    mockReturnValues = [undefined, [feed]]
    const result = await callHandler(feedDelete, { id: feed.id })
    expect(result).toEqual([feed])
  })
})
