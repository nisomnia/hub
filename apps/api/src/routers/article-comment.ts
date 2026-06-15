import { and, count, desc, eq, lt, sql } from "drizzle-orm"
import { z } from "zod"

import { createAuthError, requireAuth } from "auth"

import {
  os,
  requireAdminMiddleware,
  requireAuthMiddleware,
  requireAuthorOrAdminMiddleware,
} from "@/auth/orpc"
import { db } from "@/db"
import {
  articleComments,
  insertArticleCommentSchema,
  selectArticleCommentSchema,
  updateArticleCommentSchema,
} from "@/db/schema/article-comment"
import { cuid } from "@/lib/utils"

import {
  firstOrNull,
  firstValue,
  idInputSchema,
  infiniteSchema,
  offsetFromPage,
  pageSchema,
} from "./helpers"

const createArticleCommentSchema = insertArticleCommentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

const editArticleCommentSchema = updateArticleCommentSchema.extend({
  id: z.string(),
})

const byArticleInput = z.object({ articleId: z.string() })

const infiniteOutput = z.object({
  articleComments: z.array(selectArticleCommentSchema),
  nextCursor: z.date().nullable(),
})

async function getCommentById(id: string) {
  return firstOrNull(
    await db
      .select()
      .from(articleComments)
      .where(eq(articleComments.id, id))
      .limit(1),
  )
}

function verifyCommentOwner(comment: { authorId: string }, userId: string) {
  if (comment.authorId !== userId) {
    throw createAuthError(
      "You can only manage your own comments",
      403,
      "FORBIDDEN",
    )
  }
}

export const articleCommentRouter = {
  articleCommentDashboard: os
    .route({ method: "POST", path: "/article-comment/dashboard" })
    .use(requireAuthorOrAdminMiddleware)
    .input(pageSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(articleComments)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(articleComments.createdAt)),
    ),
  articleCommentByArticleId: os
    .route({ method: "POST", path: "/article-comment/by-article-id" })
    .input(byArticleInput)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(articleComments)
        .where(eq(articleComments.articleId, input.articleId))
        .orderBy(desc(articleComments.createdAt)),
    ),
  articleCommentByArticleIdInfinite: os
    .route({ method: "POST", path: "/article-comment/by-article-id-infinite" })
    .input(byArticleInput.merge(infiniteSchema))
    .output(infiniteOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select()
        .from(articleComments)
        .where(
          input.cursor
            ? and(
                eq(articleComments.articleId, input.articleId),
                eq(articleComments.replyToId, ""),
                lt(articleComments.updatedAt, input.cursor),
              )
            : and(
                eq(articleComments.articleId, input.articleId),
                eq(articleComments.replyToId, ""),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(articleComments.updatedAt))
      const nextItem = data.length > input.limit ? data.pop() : undefined

      return { articleComments: data, nextCursor: nextItem?.updatedAt ?? null }
    }),
  articleCommentById: os
    .route({ method: "GET", path: "/article-comment/by-id/{id}" })
    .input(idInputSchema)
    .output(selectArticleCommentSchema.nullable())
    .handler(({ input }) => getCommentById(input.id)),
  articleCommentCount: os
    .route({ method: "GET", path: "/article-comment/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(articleComments)),
    ),
  articleCommentCountByArticleId: os
    .route({ method: "POST", path: "/article-comment/count-by-article-id" })
    .input(byArticleInput)
    .output(z.number())
    .handler(async ({ input }) =>
      firstValue(
        await db
          .select({ value: count() })
          .from(articleComments)
          .where(
            and(
              eq(articleComments.articleId, input.articleId),
              eq(articleComments.replyToId, ""),
            ),
          ),
      ),
    ),
  articleCommentCreate: os
    .route({ method: "POST", path: "/article-comment/create" })
    .use(requireAuthMiddleware)
    .input(createArticleCommentSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input, context }) => {
      const user = requireAuth(context.user)

      return db
        .insert(articleComments)
        .values({
          ...input,
          id: cuid(),
          authorId: user.id,
          replyToId: input.replyToId ?? "",
        })
        .returning()
    }),
  articleCommentUpdate: os
    .route({ method: "POST", path: "/article-comment/update" })
    .use(requireAuthMiddleware)
    .input(editArticleCommentSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(async ({ input, context }) => {
      const user = requireAuth(context.user)
      const comment = await getCommentById(input.id)

      if (!comment) return []

      verifyCommentOwner(comment, user.id)

      return db
        .update(articleComments)
        .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(articleComments.id, input.id))
        .returning()
    }),
  articleCommentUpdateByAdmin: os
    .route({ method: "POST", path: "/article-comment/update-by-admin" })
    .use(requireAdminMiddleware)
    .input(editArticleCommentSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) =>
      db
        .update(articleComments)
        .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(articleComments.id, input.id))
        .returning(),
    ),
  articleCommentDelete: os
    .route({ method: "POST", path: "/article-comment/delete" })
    .use(requireAuthMiddleware)
    .input(idInputSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(async ({ input, context }) => {
      const user = requireAuth(context.user)
      const comment = await getCommentById(input.id)

      if (!comment) return []

      verifyCommentOwner(comment, user.id)

      return db
        .delete(articleComments)
        .where(eq(articleComments.id, input.id))
        .returning()
    }),
  articleCommentDeleteByAdmin: os
    .route({ method: "POST", path: "/article-comment/delete-by-admin" })
    .use(requireAdminMiddleware)
    .input(idInputSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) =>
      db
        .delete(articleComments)
        .where(eq(articleComments.id, input.id))
        .returning(),
    ),
}
