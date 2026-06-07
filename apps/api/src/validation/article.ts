import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { ARTICLE_VISIBILITY, articles } from "../db/schema/article"
import { LANGUAGE_TYPE } from "../db/schema/language"
import { STATUS_TYPE } from "../db/schema/status"

export const articleVisibility = z.enum(ARTICLE_VISIBILITY)

export const createArticleSchema = createInsertSchema(articles)
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
    articleTranslationId: true,
  })
  .extend({
    title: z
      .string({
        message: "Title is required",
      })
      .min(3),
    content: z
      .string({
        message: "Content must be a string",
      })
      .min(50),
    excerpt: z
      .string({
        message: "Content must be a string",
      })
      .optional(),
    metaTitle: z
      .string({
        message: "Meta Title must be a string",
      })
      .optional(),
    metaDescription: z
      .string({
        message: "Meta Description must be a string",
      })
      .optional(),
    featuredImage: z.string({
      message: "Featured Image is required",
    }),
    topics: z
      .string({
        message: "Topic Id is required",
      })
      .array(),
    authors: z
      .string({
        message: "Author Id is required",
      })
      .array(),
    editors: z
      .string({
        message: "Editor Id is required",
      })
      .array(),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
    visibility: z
      .enum(ARTICLE_VISIBILITY, {
        message: "only public and member are accepted",
      })
      .optional(),
  })

export const translateArticleSchema = createInsertSchema(articles)
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z
      .string({
        message: "Title is required",
      })
      .min(3),
    content: z
      .string({
        message: "Content must be a string",
      })
      .min(50),
    excerpt: z
      .string({
        message: "Content must be a string",
      })
      .optional(),
    metaTitle: z
      .string({
        message: "Meta Title must be a string",
      })
      .optional(),
    metaDescription: z
      .string({
        message: "Meta Description must be a string",
      })
      .optional(),
    featuredImage: z.string({
      message: "Featured Image is required",
    }),
    articleTranslationId: z.string({
      message: "Article Translation ID is required",
    }),
    topics: z
      .string({
        message: "Topic Id is required",
      })
      .array(),
    authors: z
      .string({
        message: "Author Id is required",
      })
      .array(),
    editors: z
      .string({
        message: "Editor Id is required",
      })
      .array(),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
    visibility: z
      .enum(ARTICLE_VISIBILITY, {
        message: "only public and member are accepted",
      })
      .optional(),
  })

export const updateArticleSchema = createInsertSchema(articles)
  .omit({
    createdAt: true,
    updatedAt: true,
    articleTranslationId: true,
  })
  .extend({
    id: z
      .string({
        message: "ID is required",
      })
      .min(1),
    slug: z
      .string({
        message: "Slug is required",
      })
      .regex(new RegExp(/^[a-zA-Z0-9_-]*$/), {
        message: "Slug should be character a-z, A-Z, number, - and _",
      }),
    title: z
      .string({
        message: "Title is required",
      })
      .min(3),
    content: z
      .string({
        message: "Content must be a string",
      })
      .min(50),
    excerpt: z
      .string({
        message: "Content must be a string",
      })
      .optional(),
    metaTitle: z
      .string({
        message: "Meta Title must be a string",
      })
      .optional(),
    metaDescription: z
      .string({
        message: "Meta Description must be a string",
      })
      .optional(),
    featuredImage: z.string({
      message: "Featured Image is required",
    }),
    topics: z
      .string({
        message: "Topic Id is required",
      })
      .array(),
    authors: z
      .string({
        message: "Author Id is required",
      })
      .array(),
    editors: z
      .string({
        message: "Editor Id is required",
      })
      .array(),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
    visibility: z
      .enum(ARTICLE_VISIBILITY, {
        message: "only public and member are accepted",
      })
      .optional(),
  })

export type ArticleVisibility = z.infer<typeof articleVisibility>
