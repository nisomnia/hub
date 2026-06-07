// TODO: remove all from enum

import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { MEDIA_CATEGORY, MEDIA_TYPE } from "@/lib/validation/media"
import { users } from "./user"

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

export const mediaRelations = relations(medias, ({ one }) => ({
  author: one(users, {
    fields: [medias.authorId],
    references: [users.id],
  }),
}))

export type InsertMedia = typeof medias.$inferInsert
export type SelectMedia = typeof medias.$inferSelect
