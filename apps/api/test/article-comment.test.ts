import { describe, expect, it, vi } from "vite-plus/test"

import {
  callHandler,
  createMockDb,
  articleCommentFixture,
  userFixture,
} from "./fixtures"

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

import { articleCommentRouter } from "@/routers/article-comment"

const {
  articleCommentDashboard,
  articleCommentByArticleId,
  articleCommentByArticleIdInfinite,
  articleCommentById,
  articleCommentCount,
  articleCommentCountByArticleId,
  articleCommentCreate,
  articleCommentUpdate,
  articleCommentUpdateByAdmin,
  articleCommentDelete,
  articleCommentDeleteByAdmin,
} = articleCommentRouter

const adminContext = { user: userFixture({ role: "admin" }) }
const userContext = { user: userFixture() }

describe("articleCommentDashboard", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(articleCommentDashboard, { page: 1, perPage: 10 }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-author/non-admin user", async () => {
    await expect(
      callHandler(
        articleCommentDashboard,
        { page: 1, perPage: 10 },
        userContext,
      ),
    ).rejects.toThrow("Author or admin access required")
  })

  it("returns paginated article comments ordered by createdAt desc", async () => {
    mockCallIndex = 0
    const comment = articleCommentFixture()
    mockReturnValues = [[comment]]
    const result = await callHandler(
      articleCommentDashboard,
      {
        page: 1,
        perPage: 10,
      },
      adminContext,
    )
    expect(result).toEqual([comment])
  })
})

describe("articleCommentByArticleId", () => {
  it("returns article comments by articleId ordered by createdAt desc", async () => {
    mockCallIndex = 0
    const comment = articleCommentFixture({ articleId: "article_001" })
    mockReturnValues = [[comment]]
    const result = await callHandler(articleCommentByArticleId, {
      articleId: "article_001",
    })
    expect(result).toEqual([comment])
  })
})

describe("articleCommentByArticleIdInfinite", () => {
  it("returns data and nextCursor without cursor", async () => {
    mockCallIndex = 0
    const comment1 = articleCommentFixture({ id: "comment_001" })
    const comment2 = articleCommentFixture({ id: "comment_002" })
    const comment3 = articleCommentFixture({ id: "comment_003" })
    mockReturnValues = [[comment1, comment2, comment3]]
    const result = await callHandler(articleCommentByArticleIdInfinite, {
      articleId: "article_001",
      limit: 2,
    })
    expect(result.articleComments).toEqual([comment1, comment2])
    expect(result.nextCursor).toEqual(comment3.createdAt)
  })

  it("returns filtered data with cursor", async () => {
    mockCallIndex = 0
    const comment1 = articleCommentFixture({ id: "comment_001" })
    const comment2 = articleCommentFixture({ id: "comment_002" })
    mockReturnValues = [[comment1, comment2]]
    const result = await callHandler(articleCommentByArticleIdInfinite, {
      articleId: "article_001",
      limit: 2,
      cursor: new Date("2026-01-02T00:00:00.000Z"),
    })
    expect(result.articleComments).toEqual([comment1, comment2])
    expect(result.nextCursor).toBeNull()
  })
})

describe("articleCommentById", () => {
  it("returns article comment when found", async () => {
    mockCallIndex = 0
    const comment = articleCommentFixture()
    mockReturnValues = [[comment]]
    const result = await callHandler(articleCommentById, { id: "comment_001" })
    expect(result).toEqual(comment)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(articleCommentById, { id: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("articleCommentCount", () => {
  it("returns count of all article comments", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 10 }]]
    const result = await callHandler(articleCommentCount, {})
    expect(result).toBe(10)
  })

  it("returns 0 when no article comments", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(articleCommentCount, {})
    expect(result).toBe(0)
  })
})

describe("articleCommentCountByArticleId", () => {
  it("returns count by articleId", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 5 }]]
    const result = await callHandler(articleCommentCountByArticleId, {
      articleId: "article_001",
    })
    expect(result).toBe(5)
  })
})

describe("articleCommentCreate", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(
        articleCommentCreate,
        {
          content: "Test comment",
          articleId: "article_001",
          authorId: "user_001",
        },
        null,
      ),
    ).rejects.toThrow("Authentication required")
  })

  it("creates a new article comment", async () => {
    mockCallIndex = 0
    const comment = articleCommentFixture()
    mockReturnValues = [[comment]]
    const result = await callHandler(
      articleCommentCreate,
      {
        content: "Test comment",
        articleId: "article_001",
        authorId: "user_001",
      },
      userContext,
    )
    expect(result).toEqual([comment])
  })
})

describe("articleCommentUpdate", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(
        articleCommentUpdate,
        { id: "comment_001", content: "Updated comment" },
        null,
      ),
    ).rejects.toThrow("Authentication required")
  })

  it("throws when user tries to update another comment", async () => {
    mockCallIndex = 0
    mockReturnValues = [[articleCommentFixture({ authorId: "user_002" })]]
    await expect(
      callHandler(
        articleCommentUpdate,
        { id: "comment_001", content: "Updated comment" },
        userContext,
      ),
    ).rejects.toThrow("You can only manage your own comments")
  })

  it("updates an existing article comment", async () => {
    mockCallIndex = 0
    const comment = articleCommentFixture({ content: "Updated comment" })
    mockReturnValues = [[comment]]
    const result = await callHandler(
      articleCommentUpdate,
      {
        id: "comment_001",
        content: "Updated comment",
      },
      userContext,
    )
    expect(result).toEqual([comment])
  })
})

describe("articleCommentUpdateByAdmin", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(
        articleCommentUpdateByAdmin,
        { id: "comment_001", content: "Admin updated comment" },
        null,
      ),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(
        articleCommentUpdateByAdmin,
        { id: "comment_001", content: "Admin updated comment" },
        userContext,
      ),
    ).rejects.toThrow("Admin access required")
  })

  it("updates an article comment as admin", async () => {
    mockCallIndex = 0
    const comment = articleCommentFixture({ content: "Admin updated comment" })
    mockReturnValues = [[comment]]
    const result = await callHandler(
      articleCommentUpdateByAdmin,
      {
        id: "comment_001",
        content: "Admin updated comment",
      },
      adminContext,
    )
    expect(result).toEqual([comment])
  })
})

describe("articleCommentDelete", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(articleCommentDelete, { id: "comment_001" }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws when user tries to delete another comment", async () => {
    mockCallIndex = 0
    mockReturnValues = [[articleCommentFixture({ authorId: "user_002" })]]
    await expect(
      callHandler(articleCommentDelete, { id: "comment_001" }, userContext),
    ).rejects.toThrow("You can only manage your own comments")
  })

  it("deletes an article comment", async () => {
    mockCallIndex = 0
    const comment = articleCommentFixture()
    mockReturnValues = [[comment]]
    const result = await callHandler(
      articleCommentDelete,
      { id: "comment_001" },
      userContext,
    )
    expect(result).toEqual([comment])
  })
})

describe("articleCommentDeleteByAdmin", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(articleCommentDeleteByAdmin, { id: "comment_001" }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(
        articleCommentDeleteByAdmin,
        { id: "comment_001" },
        userContext,
      ),
    ).rejects.toThrow("Admin access required")
  })

  it("deletes an article comment as admin", async () => {
    mockCallIndex = 0
    const comment = articleCommentFixture()
    mockReturnValues = [[comment]]
    const result = await callHandler(
      articleCommentDeleteByAdmin,
      { id: "comment_001" },
      adminContext,
    )
    expect(result).toEqual([comment])
  })
})
