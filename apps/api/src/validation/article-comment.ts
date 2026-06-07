import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { articleComments } from "../db/schema/article-comment"

export const createArticleCommentSchema = createInsertSchema(articleComments)
  .omit({
    id: true,
    authorId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    content: z
      .string({
        message: "Content is required",
      })
      .min(1)
      .max(600),
    replyToId: z
      .string({
        message: "Article Comment Id must be a string",
      })
      .nullish(),
  })

export const updateArticleCommentSchema = createInsertSchema(articleComments)
  .omit({
    createdAt: true,
    updatedAt: true,
    articleId: true,
    authorId: true,
    replyToId: true,
  })
  .extend({
    id: z.string({
      message: "Id is required",
    }),
    content: z
      .string({
        message: "Content is required",
      })
      .min(1)
      .max(600),
  })
