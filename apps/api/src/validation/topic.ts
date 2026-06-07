import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { LANGUAGE_TYPE } from "../db/schema/language"
import { STATUS_TYPE } from "../db/schema/status"
import { TOPIC_VISIBILITY, topics } from "../db/schema/topic"

export const topicVisibility = z.enum(TOPIC_VISIBILITY)

export const createTopicSchema = createInsertSchema(topics)
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
    topicTranslationId: true,
  })
  .extend({
    title: z
      .string({
        message: "Title is required",
      })
      .min(2)
      .max(32),
    description: z
      .string({
        message: "Description must be a string",
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
    visibility: z
      .enum(TOPIC_VISIBILITY, {
        message: "only public and internal are accepted",
      })
      .optional(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
    featuredImage: z
      .string({
        message: "Featured Image ID must be a string",
      })
      .nullish(),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
  })

export const translateTopicSchema = createInsertSchema(topics)
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
      .min(2)
      .max(32),
    description: z
      .string({
        message: "Description must be a string",
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
    visibility: z
      .enum(TOPIC_VISIBILITY, {
        message: "only public and internal are accepted",
      })
      .optional(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
    featuredImage: z
      .string({
        message: "Featured Image ID must be a string",
      })
      .nullish(),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
    topicTranslationId: z.string({
      message: "Topic Translation ID is required",
    }),
  })

export const updateTopicSchema = createInsertSchema(topics)
  .omit({
    createdAt: true,
    updatedAt: true,
    topicTranslationId: true,
  })
  .extend({
    id: z.string({
      message: "Id is required",
    }),
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
      .min(2)
      .max(32),
    description: z
      .string({
        message: "Description must be a string",
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
    visibility: z
      .enum(TOPIC_VISIBILITY, {
        message: "only public and internal are accepted",
      })
      .optional(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
    featuredImage: z
      .string({
        message: "Featured Image ID must be a string",
      })
      .nullish(),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
  })

export type CreateTopicSchema = z.infer<typeof createTopicSchema>
export type UpdateTopicSchema = z.infer<typeof updateTopicSchema>
export type TopicVisibility = z.infer<typeof topicVisibility>
