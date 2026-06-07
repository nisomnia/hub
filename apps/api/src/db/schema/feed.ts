import { relations } from "drizzle-orm"
import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"

import { languageEnum } from "./language"
import { statusEnum } from "./status"
import { topics } from "./topic"

export const FEED_TYPE = ["website", "tiktok", "x", "facebook"] as const

export const feedType = z.enum(FEED_TYPE)

export const feedTypeEnum = pgEnum("feed_type", FEED_TYPE)

export const feeds = pgTable("feeds", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  language: languageEnum("language").notNull().default("id"),
  featuredImage: text("featured_image"),
  link: text("link"),
  type: feedTypeEnum("type").notNull().default("website"),
  owner: text("owner"),
  status: statusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertFeedSchema = createInsertSchema(feeds)
export const updateFeedSchema = createUpdateSchema(feeds)

export const feedsRelations = relations(feeds, ({ many }) => ({
  topics: many(feedTopics),
}))

export const feedTopics = pgTable(
  "_feed_topics",
  {
    feedId: text("feed_id")
      .notNull()
      .references(() => feeds.id),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
  },
  (t) => ({
    compoundKey: primaryKey({
      columns: [t.feedId, t.topicId],
    }),
  }),
)

export const insertFeedTopicSchema = createInsertSchema(feedTopics)
export const updateFeedTopicSchema = createUpdateSchema(feedTopics)

export const feedTopicsRelations = relations(feedTopics, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedTopics.feedId],
    references: [feeds.id],
  }),
  topic: one(topics, {
    fields: [feedTopics.topicId],
    references: [topics.id],
  }),
}))

export type InsertFeed = typeof feeds.$inferInsert
export type SelectFeed = typeof feeds.$inferSelect

export type InsertFeedTopic = typeof feedTopics.$inferInsert
export type SelectFeedTopic = typeof feedTopics.$inferSelect

export type FeedType = z.infer<typeof feedType>
