import { describe, expect, it, vi } from "vite-plus/test"

import {
  callHandler,
  createMockDb,
  topicFixture,
  topicTranslationFixture,
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

import { topicRouter } from "@/routers/topic"

const {
  topicTranslationById,
  topicDashboard,
  topicById,
  topicByLanguage,
  topicByArticleCount,
  topicSitemap,
  topicByVisibility,
  topicBySlug,
  topicSearch,
  topicSearchDashboard,
  topicCount,
  topicCountDashboard,
  topicCountByLanguage,
  topicCountByLanguageDashboard,
  topicCreate,
  topicUpdate,
  topicTranslate,
  topicDelete,
} = topicRouter

describe("topicTranslationById", () => {
  it("returns translation with topics when found", async () => {
    const translation = topicTranslationFixture()
    const t = topicFixture({ topicTranslationId: translation.id })
    mockCallIndex = 0
    mockReturnValues = [[translation], [t]]
    const result = await callHandler(topicTranslationById, {
      id: translation.id,
    })
    expect(result).toEqual({ ...translation, topics: [t] })
  })

  it("returns null when translation not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(topicTranslationById, {
      id: "nonexistent",
    })
    expect(result).toBeNull()
  })
})

describe("topicDashboard", () => {
  it("returns paginated topics by language ordered by updatedAt desc", async () => {
    const t = topicFixture({ language: "id" })
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicDashboard, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([t])
  })
})

describe("topicById", () => {
  it("returns topic when found", async () => {
    const t = topicFixture()
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicById, { id: t.id })
    expect(result).toEqual(t)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(topicById, { id: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("topicByLanguage", () => {
  it("returns published topics by language ordered by createdAt desc", async () => {
    const t = topicFixture({ language: "id", status: "published" })
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicByLanguage, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([t])
  })
})

describe("topicByArticleCount", () => {
  it("returns topics with article counts", async () => {
    const row = {
      id: "topic_001",
      title: "Test Topic",
      slug: "test-topic",
      language: "id",
      count: 5,
    }
    mockCallIndex = 0
    mockReturnValues = [[row]]
    const result = await callHandler(topicByArticleCount, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([row])
  })
})

describe("topicSitemap", () => {
  it("returns sitemap data for published topics", async () => {
    const row = { slug: "test-topic", updatedAt: new Date() }
    mockCallIndex = 0
    mockReturnValues = [[row]]
    const result = await callHandler(topicSitemap, {
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([row])
  })
})

describe("topicByVisibility", () => {
  it("returns topics by visibility language and published status", async () => {
    const t = topicFixture({
      visibility: "public",
      language: "id",
      status: "published",
    })
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicByVisibility, {
      visibility: "public",
      language: "id",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([t])
  })
})

describe("topicBySlug", () => {
  it("returns topic by slug", async () => {
    const t = topicFixture({ slug: "test-topic" })
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicBySlug, { slug: "test-topic" })
    expect(result).toEqual(t)
  })

  it("returns null when slug not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(topicBySlug, { slug: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("topicSearch", () => {
  it("returns matching published public topics", async () => {
    const t = topicFixture({ status: "published", visibility: "public" })
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicSearch, {
      searchQuery: "Test",
      limit: 10,
      language: "id",
    })
    expect(result).toEqual([t])
  })
})

describe("topicSearchDashboard", () => {
  it("returns matching topics regardless of status or visibility", async () => {
    const t = topicFixture({ status: "draft", visibility: "internal" })
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicSearchDashboard, {
      searchQuery: "Test",
      limit: 10,
    })
    expect(result).toEqual([t])
  })
})

describe("topicCount", () => {
  it("returns count of published topics", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 7 }]]
    const result = await callHandler(topicCount, {})
    expect(result).toBe(7)
  })

  it("returns 0 when no published topics", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(topicCount, {})
    expect(result).toBe(0)
  })
})

describe("topicCountDashboard", () => {
  it("returns count of all topics", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 15 }]]
    const result = await callHandler(topicCountDashboard, {})
    expect(result).toBe(15)
  })
})

describe("topicCountByLanguage", () => {
  it("returns count of published topics by language", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 4 }]]
    const result = await callHandler(topicCountByLanguage, { language: "id" })
    expect(result).toBe(4)
  })

  it("returns 0 when no published topics for language", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(topicCountByLanguage, { language: "en" })
    expect(result).toBe(0)
  })
})

describe("topicCountByLanguageDashboard", () => {
  it("returns count of all topics by language", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 8 }]]
    const result = await callHandler(topicCountByLanguageDashboard, {
      language: "id",
    })
    expect(result).toBe(8)
  })
})

describe("topicCreate", () => {
  it("creates a topic with generated slug", async () => {
    const translation = topicTranslationFixture()
    const t = topicFixture({ title: "New Topic", slug: "new-topic" })
    mockCallIndex = 0
    mockReturnValues = [[], [translation], [t]]
    const result = await callHandler(topicCreate, {
      title: "New Topic",
      description: "Desc",
      language: "id",
      status: "published",
      visibility: "public",
    })
    expect(result).toEqual([t])
  })

  it("creates a topic with provided slug", async () => {
    const translation = topicTranslationFixture()
    const t = topicFixture({ title: "New Topic", slug: "custom-slug" })
    mockCallIndex = 0
    mockReturnValues = [[translation], [t]]
    const result = await callHandler(topicCreate, {
      title: "New Topic",
      description: "Desc",
      language: "id",
      status: "published",
      visibility: "public",
      slug: "custom-slug",
    })
    expect(result).toEqual([t])
  })
})

describe("topicUpdate", () => {
  it("updates a topic", async () => {
    const t = topicFixture({ title: "Updated Topic" })
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicUpdate, {
      id: "topic_001",
      title: "Updated Topic",
    })
    expect(result).toEqual([t])
  })
})

describe("topicTranslate", () => {
  it("creates a translated topic with generated slug", async () => {
    const t = topicFixture({
      title: "Translated Topic",
      slug: "translated-topic",
    })
    mockCallIndex = 0
    mockReturnValues = [[], [t]]
    const result = await callHandler(topicTranslate, {
      title: "Translated Topic",
      description: "Desc",
      language: "en",
      status: "published",
      visibility: "public",
      topicTranslationId: "tt_001",
    })
    expect(result).toEqual([t])
  })

  it("creates a translated topic with provided slug", async () => {
    const t = topicFixture({
      title: "Translated Topic",
      slug: "custom-translated",
    })
    mockCallIndex = 0
    mockReturnValues = [[t]]
    const result = await callHandler(topicTranslate, {
      title: "Translated Topic",
      description: "Desc",
      language: "en",
      status: "published",
      visibility: "public",
      topicTranslationId: "tt_001",
      slug: "custom-translated",
    })
    expect(result).toEqual([t])
  })
})

describe("topicDelete", () => {
  it("deletes articleTopics and topic", async () => {
    const t = topicFixture()
    mockCallIndex = 0
    mockReturnValues = [undefined, [t]]
    const result = await callHandler(topicDelete, { id: t.id })
    expect(result).toEqual([t])
  })
})
