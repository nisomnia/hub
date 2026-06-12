// TODO: remove all from enum

import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod"
import { z } from "zod"

import { users } from "./user"

export const MEDIA_CATEGORY = [
  "all",
  "article",
  "feed",
  "topic",
  "genre",
  "review",
  "tutorial",
  "movie",
  "tv",
  "game",
  "production_company",
] as const

export const MEDIA_TYPE = [
  "image",
  "audio",
  "video",
  "document",
  "other",
] as const

export const mediaCategory = z.enum(MEDIA_CATEGORY)
export const mediaType = z.enum(MEDIA_TYPE)

export const mediaCategoryEnum = pgEnum("media_category", MEDIA_CATEGORY)
export const mediaTypeEnum = pgEnum("media_type", MEDIA_TYPE)

export const medias = pgTable("medias", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  fileType: text("file_type").notNull(),
  category: mediaCategoryEnum("category").notNull().default("article"),
  type: mediaTypeEnum("type").notNull().default("image"),
  description: text("description"),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const selectMediaSchema = createSelectSchema(medias)
export const insertMediaSchema = createInsertSchema(medias)
export const updateMediaSchema = createUpdateSchema(medias)

export const mediaRelations = relations(medias, ({ one }) => ({
  author: one(users, {
    fields: [medias.authorId],
    references: [users.id],
  }),
}))

export type InsertMedia = typeof medias.$inferInsert
export type SelectMedia = typeof medias.$inferSelect

export type MediaCategory = z.infer<typeof mediaCategory>
export type MediaType = z.infer<typeof mediaType>
