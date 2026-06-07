import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { OVERVIEW_TYPE } from "@/lib/validation/overview"
import { languageEnum } from "./language"
import { movieOverviews } from "./movie"

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

export const overviewsRelations = relations(overviews, ({ many }) => ({
  movies: many(movieOverviews),
}))
