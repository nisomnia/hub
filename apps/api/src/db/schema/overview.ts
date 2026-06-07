import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"

import { languageEnum } from "./language"
import { movieOverviews } from "./movie"

export const OVERVIEW_TYPE = ["game", "movie", "tv"] as const

export const overviewType = z.enum(OVERVIEW_TYPE)

export const overviewTypeEnum = pgEnum("overview_type", OVERVIEW_TYPE)

export const overviews = pgTable("overviews", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: overviewTypeEnum("type").notNull().default("game"),
  language: languageEnum("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertOverviewSchema = createInsertSchema(overviews)
export const updateOverviewSchema = createUpdateSchema(overviews)

export const overviewsRelations = relations(overviews, ({ many }) => ({
  movies: many(movieOverviews),
}))

export type InsertOverview = typeof overviews.$inferInsert
export type SelectOverview = typeof overviews.$inferSelect

export type OverviewType = z.infer<typeof overviewType>
