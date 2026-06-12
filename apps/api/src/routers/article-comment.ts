import { os } from "@orpc/server"
import { and, count, desc, eq, lt, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "../db"
import {
  articleComments,
  insertArticleCommentSchema,
  selectArticleCommentSchema,
  updateArticleCommentSchema,
} from "../db/schema/article-comment"
import { cuid } from "../lib/utils"
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

export const articleCommentRouter = {
  articleCommentDashboard: os
    .route({ method: "POST", path: "/article-comment/dashboard" })
    .input(pageSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(articleComments)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(articleComments.createdAt))
    }),
  articleCommentByArticleId: os
    .route({ method: "POST", path: "/article-comment/by-article-id" })
    .input(byArticleInput)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(articleComments)
        .where(eq(articleComments.articleId, input.articleId))
        .orderBy(desc(articleComments.createdAt))
    }),
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
        .orderBy(desc(articleComments.createdAt))
      const nextItem = data.length > input.limit ? data.pop() : undefined

      return { articleComments: data, nextCursor: nextItem?.createdAt ?? null }
    }),
  articleCommentById: os
    .route({ method: "GET", path: "/article-comment/by-id/{id}" })
    .input(idInputSchema)
    .output(selectArticleCommentSchema.nullable())
    .handler(async ({ input }) => {
      return firstOrNull(
        await db
          .select()
          .from(articleComments)
          .where(eq(articleComments.id, input.id))
          .limit(1),
      )
    }),
  articleCommentCount: os
    .route({ method: "GET", path: "/article-comment/count" })
    .output(z.number())
    .handler(async () => {
      return firstValue(
        await db.select({ value: count() }).from(articleComments),
      )
    }),
  articleCommentCountByArticleId: os
    .route({ method: "POST", path: "/article-comment/count-by-article-id" })
    .input(idInputSchema)
    .output(z.number())
    .handler(async ({ input }) => {
      return firstValue(
        await db
          .select({ value: count() })
          .from(articleComments)
          .where(
            and(
              eq(articleComments.id, input.id),
              eq(articleComments.replyToId, ""),
            ),
          ),
      )
    }),
  articleCommentCreate: os
    .route({ method: "POST", path: "/article-comment/create" })
    .input(createArticleCommentSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) => {
      return db
        .insert(articleComments)
        .values({ ...input, id: cuid(), replyToId: input.replyToId ?? "" })
        .returning()
    }),
  articleCommentUpdate: os
    .route({ method: "POST", path: "/article-comment/update" })
    .input(editArticleCommentSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) => {
      return db
        .update(articleComments)
        .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(articleComments.id, input.id))
        .returning()
    }),
  articleCommentUpdateByAdmin: os
    .route({ method: "POST", path: "/article-comment/update-by-admin" })
    .input(editArticleCommentSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) => {
      return db
        .update(articleComments)
        .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(articleComments.id, input.id))
        .returning()
    }),
  articleCommentDelete: os
    .route({ method: "POST", path: "/article-comment/delete" })
    .input(idInputSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) => {
      return db
        .delete(articleComments)
        .where(eq(articleComments.id, input.id))
        .returning()
    }),
  articleCommentDeleteByAdmin: os
    .route({ method: "POST", path: "/article-comment/delete-by-admin" })
    .input(idInputSchema)
    .output(z.array(selectArticleCommentSchema))
    .handler(({ input }) => {
      return db
        .delete(articleComments)
        .where(eq(articleComments.id, input.id))
        .returning()
    }),
}
