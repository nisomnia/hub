import { describe, expect, it, vi } from "vite-plus/test"

import {
  createMockDb,
  callHandler,
  articleFixture,
  articleTranslationFixture,
  topicFixture,
  userFixture,
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

import { articleRouter } from "@/routers/article"

const {
  articleTranslationById,
  articleById,
  articleBySlug,
  articleByLanguage,
  articleByLanguageInfinite,
  articleByTopicId,
  articleByTopicIdInfinite,
  articleByAuthorId,
  articleByAuthorIdInfinite,
  articleRelatedInfinite,
  articleDashboard,
  articleSitemap,
  articleCount,
  articleCountDashboard,
  articleCountByLanguage,
  articleCountByLanguageDashboard,
  articleSearch,
  articleSearchDashboard,
  articleCreate,
  articleUpdate,
  articleUpdateWithoutChangeUpdatedDate,
  articleTranslate,
  articleDelete,
  articleDeleteByAdmin,
} = articleRouter

describe("articleTranslationById", () => {
  it("returns translation with articles when found", async () => {
    const at = articleTranslationFixture()
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[at], [a]]
    const result = await callHandler(articleTranslationById, { id: "at_001" })
    expect(result).toEqual({ ...at, articles: [a] })
  })

  it("returns null when translation not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(articleTranslationById, {
      id: "nonexistent",
    })
    expect(result).toBeNull()
  })
})

describe("articleById", () => {
  it("returns article detail with topics, authors, editors when found", async () => {
    const a = articleFixture()
    const t = topicFixture()
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[a], [t], [u], [u]]
    const result = await callHandler(articleById, { id: "article_001" })
    expect(result).toEqual({
      ...a,
      topics: [{ id: "topic_001", title: "Test Topic", slug: "test-topic" }],
      authors: [{ id: "user_001", name: "Test User", username: "testuser" }],
      editors: [{ id: "user_001", name: "Test User" }],
    })
  })

  it("returns null when article not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(articleById, { id: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("articleBySlug", () => {
  it("returns article detail with topics, authors, editors when found", async () => {
    const a = articleFixture()
    const t = topicFixture()
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[a], [t], [u], [u]]
    const result = await callHandler(articleBySlug, { slug: "test-article" })
    expect(result).toEqual({
      ...a,
      topics: [{ id: "topic_001", title: "Test Topic", slug: "test-topic" }],
      authors: [{ id: "user_001", name: "Test User", username: "testuser" }],
      editors: [{ id: "user_001", name: "Test User" }],
    })
  })

  it("returns null when article not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(articleBySlug, { slug: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("articleByLanguage", () => {
  it("returns paginated published articles by language", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[a]]
    const result = await callHandler(articleByLanguage, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([a])
  })
})

describe("articleByLanguageInfinite", () => {
  it("returns articles without cursor", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[a]]
    const result = await callHandler(articleByLanguageInfinite, {
      language: "id",
      limit: 10,
    })
    expect(result).toEqual({ articles: [a], nextCursor: null })
  })

  it("returns articles with nextCursor when more than limit", async () => {
    const a1 = articleFixture({ id: "article_001" })
    const a2 = articleFixture({ id: "article_002" })
    const a3 = articleFixture({ id: "article_003" })
    mockCallIndex = 0
    mockReturnValues = [[a1, a2, a3]]
    const result = await callHandler(articleByLanguageInfinite, {
      language: "id",
      limit: 2,
      cursor: new Date(),
    })
    expect(result.articles).toEqual([a1, a2])
    expect(result.nextCursor).toBe(a3.updatedAt)
  })
})

describe("articleByTopicId", () => {
  it("returns articles by topic id", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ article: a }]]
    const result = await callHandler(articleByTopicId, {
      language: "id",
      topicId: "topic_001",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([{ article: a }])
  })
})

describe("articleByTopicIdInfinite", () => {
  it("returns articles without cursor", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ article: a }]]
    const result = await callHandler(articleByTopicIdInfinite, {
      language: "id",
      topicId: "topic_001",
      limit: 10,
    })
    expect(result).toEqual({ articles: [a], nextCursor: null })
  })

  it("returns articles with nextCursor when more than limit", async () => {
    const a1 = articleFixture({ id: "article_001" })
    const a2 = articleFixture({ id: "article_002" })
    const a3 = articleFixture({ id: "article_003" })
    mockCallIndex = 0
    mockReturnValues = [[{ article: a1 }, { article: a2 }, { article: a3 }]]
    const result = await callHandler(articleByTopicIdInfinite, {
      language: "id",
      topicId: "topic_001",
      limit: 2,
      cursor: new Date(),
    })
    expect(result.articles).toEqual([a1, a2])
    expect(result.nextCursor).toBe(a3.updatedAt)
  })
})

describe("articleByAuthorId", () => {
  it("returns articles by author id", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ article: a }]]
    const result = await callHandler(articleByAuthorId, {
      language: "id",
      authorId: "user_001",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([{ article: a }])
  })
})

describe("articleByAuthorIdInfinite", () => {
  it("returns articles without cursor", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ article: a }]]
    const result = await callHandler(articleByAuthorIdInfinite, {
      language: "id",
      authorId: "user_001",
      limit: 10,
    })
    expect(result).toEqual({ articles: [a], nextCursor: null })
  })

  it("returns articles with nextCursor when more than limit", async () => {
    const a1 = articleFixture({ id: "article_001" })
    const a2 = articleFixture({ id: "article_002" })
    const a3 = articleFixture({ id: "article_003" })
    mockCallIndex = 0
    mockReturnValues = [[{ article: a1 }, { article: a2 }, { article: a3 }]]
    const result = await callHandler(articleByAuthorIdInfinite, {
      language: "id",
      authorId: "user_001",
      limit: 2,
      cursor: new Date(),
    })
    expect(result.articles).toEqual([a1, a2])
    expect(result.nextCursor).toBe(a3.updatedAt)
  })
})

describe("articleRelatedInfinite", () => {
  it("returns related articles without cursor", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ article: a }]]
    const result = await callHandler(articleRelatedInfinite, {
      language: "id",
      topicId: "topic_001",
      currentArticleId: "article_002",
      limit: 10,
    })
    expect(result).toEqual({ articles: [a], nextCursor: null })
  })

  it("returns related articles with nextCursor when more than limit", async () => {
    const a1 = articleFixture({ id: "article_003" })
    const a2 = articleFixture({ id: "article_004" })
    const a3 = articleFixture({ id: "article_005" })
    mockCallIndex = 0
    mockReturnValues = [[{ article: a1 }, { article: a2 }, { article: a3 }]]
    const result = await callHandler(articleRelatedInfinite, {
      language: "id",
      topicId: "topic_001",
      currentArticleId: "article_002",
      limit: 2,
      cursor: new Date(),
    })
    expect(result.articles).toEqual([a1, a2])
    expect(result.nextCursor).toBe(a3.updatedAt)
  })
})

describe("articleDashboard", () => {
  it("returns paginated articles by language", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[a]]
    const result = await callHandler(articleDashboard, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([a])
  })
})

describe("articleSitemap", () => {
  it("returns paginated slug and updatedAt", async () => {
    const row = {
      slug: "test-article",
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    }
    mockCallIndex = 0
    mockReturnValues = [[row]]
    const result = await callHandler(articleSitemap, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([row])
  })
})

describe("articleCount", () => {
  it("returns published article count", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 10 }]]
    const result = await callHandler(articleCount, {})
    expect(result).toBe(10)
  })
})

describe("articleCountDashboard", () => {
  it("returns total article count", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 20 }]]
    const result = await callHandler(articleCountDashboard, {})
    expect(result).toBe(20)
  })
})

describe("articleCountByLanguage", () => {
  it("returns published count by language", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 5 }]]
    const result = await callHandler(articleCountByLanguage, { language: "id" })
    expect(result).toBe(5)
  })
})

describe("articleCountByLanguageDashboard", () => {
  it("returns total count by language", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 8 }]]
    const result = await callHandler(articleCountByLanguageDashboard, {
      language: "id",
    })
    expect(result).toBe(8)
  })
})

describe("articleSearch", () => {
  it("returns matching published articles", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[a]]
    const result = await callHandler(articleSearch, {
      language: "id",
      searchQuery: "test",
      limit: 10,
    })
    expect(result).toEqual([a])
  })
})

describe("articleSearchDashboard", () => {
  it("returns matching articles across all statuses", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[a]]
    const result = await callHandler(articleSearchDashboard, {
      searchQuery: "test",
      limit: 10,
    })
    expect(result).toEqual([a])
  })
})

describe("articleCreate", () => {
  it("creates article with generated slug and excerpt", async () => {
    const at = articleTranslationFixture()
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[], [at], [a], undefined, undefined, undefined]
    const result = await callHandler(articleCreate, {
      title: "Test Article",
      content: "Content here",
      language: "id",
      status: "published",
      visibility: "public",
      featuredImage: "https://example.com/img.jpg",
      topics: ["topic_001"],
      authors: ["user_001"],
      editors: ["user_001"],
    })
    expect(result).toEqual([a])
  })

  it("creates article with provided slug and excerpt", async () => {
    const at = articleTranslationFixture()
    const a = articleFixture({ slug: "custom-slug", excerpt: "Custom excerpt" })
    mockCallIndex = 0
    mockReturnValues = [[at], [a], undefined, undefined, undefined]
    const result = await callHandler(articleCreate, {
      title: "Test Article",
      content: "Content here",
      language: "id",
      status: "published",
      visibility: "public",
      featuredImage: "https://example.com/img.jpg",
      slug: "custom-slug",
      excerpt: "Custom excerpt",
      topics: ["topic_001"],
      authors: ["user_001"],
      editors: ["user_001"],
    })
    expect(result).toEqual([a])
  })
})

describe("articleUpdate", () => {
  it("updates article with topics, authors, editors", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [
      [a],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]
    const result = await callHandler(articleUpdate, {
      id: "article_001",
      title: "Updated Title",
      topics: ["topic_001"],
      authors: ["user_001"],
      editors: ["user_001"],
    })
    expect(result).toEqual([a])
  })

  it("updates article without topics, authors, editors", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[a], undefined, undefined, undefined]
    const result = await callHandler(articleUpdate, {
      id: "article_001",
      title: "Updated Title",
      topics: [],
      authors: [],
      editors: [],
    })
    expect(result).toEqual([a])
  })
})

describe("articleUpdateWithoutChangeUpdatedDate", () => {
  it("updates article without changing updatedAt", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [
      [a],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]
    const result = await callHandler(articleUpdateWithoutChangeUpdatedDate, {
      id: "article_001",
      title: "Updated Title",
      topics: ["topic_001"],
      authors: ["user_001"],
      editors: ["user_001"],
    })
    expect(result).toEqual([a])
  })
})

describe("articleTranslate", () => {
  it("creates translated article with generated slug", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [[], [a], undefined, undefined, undefined]
    const result = await callHandler(articleTranslate, {
      title: "Test Article",
      content: "Content here",
      language: "id",
      status: "published",
      visibility: "public",
      featuredImage: "https://example.com/img.jpg",
      articleTranslationId: "at_001",
      topics: ["topic_001"],
      authors: ["user_001"],
      editors: ["user_001"],
    })
    expect(result).toEqual([a])
  })

  it("creates translated article with provided slug", async () => {
    const a = articleFixture({ slug: "custom-slug" })
    mockCallIndex = 0
    mockReturnValues = [[a], undefined, undefined, undefined]
    const result = await callHandler(articleTranslate, {
      title: "Test Article",
      content: "Content here",
      language: "id",
      status: "published",
      visibility: "public",
      featuredImage: "https://example.com/img.jpg",
      articleTranslationId: "at_001",
      slug: "custom-slug",
      topics: ["topic_001"],
      authors: ["user_001"],
      editors: ["user_001"],
    })
    expect(result).toEqual([a])
  })
})

describe("articleDelete", () => {
  it("deletes article and related data", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [undefined, undefined, undefined, [a]]
    const result = await callHandler(articleDelete, { id: "article_001" })
    expect(result).toEqual([a])
  })
})

describe("articleDeleteByAdmin", () => {
  it("deletes article and related data as admin", async () => {
    const a = articleFixture()
    mockCallIndex = 0
    mockReturnValues = [undefined, undefined, undefined, [a]]
    const result = await callHandler(articleDeleteByAdmin, {
      id: "article_001",
    })
    expect(result).toEqual([a])
  })
})
