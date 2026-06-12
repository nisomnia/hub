import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod"
import { z } from "zod"

import { articleTopics } from "./article"
import { feedTopics } from "./feed"
import { languageEnum } from "./language"
import { statusEnum } from "./status"

export const TOPIC_VISIBILITY = ["public", "internal"] as const

export const topicVisibility = z.enum(TOPIC_VISIBILITY)

export const topicVisibilityEnum = pgEnum("topic_visibility", TOPIC_VISIBILITY)

export const topicTranslations = pgTable("topic_translations", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const selectTopicTranslationSchema =
  createSelectSchema(topicTranslations)
export const insertTopicTranslationSchema =
  createInsertSchema(topicTranslations)
export const updateTopicTranslationSchema =
  createUpdateSchema(topicTranslations)

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  language: languageEnum("language").notNull().default("id"),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  status: statusEnum("status").notNull().default("draft"),
  visibility: topicVisibilityEnum("visibility").notNull().default("public"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  topicTranslationId: text("topic_translation_id")
    .notNull()
    .references(() => topicTranslations.id),
  featuredImage: text("featured_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const selectTopicSchema = createSelectSchema(topics)
export const insertTopicSchema = createInsertSchema(topics)
export const updateTopicSchema = createUpdateSchema(topics)

export const topicsRelations = relations(topics, ({ one, many }) => ({
  topicTranslation: one(topicTranslations, {
    fields: [topics.topicTranslationId],
    references: [topicTranslations.id],
  }),
  articles: many(articleTopics),
  feeds: many(feedTopics),
}))

export const topicTranslationsRelations = relations(
  topicTranslations,
  ({ many }) => ({
    topics: many(topics),
  }),
)

export type InsertTopic = typeof topics.$inferInsert
export type SelectTopic = typeof topics.$inferSelect

export type InsertTopicTranslation = typeof topicTranslations.$inferInsert
export type SelectTopicTranslation = typeof topicTranslations.$inferSelect

export type TopicVisibility = z.infer<typeof topicVisibility>
