import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { movieGenres } from "./movie"
import { statusEnum } from "./status"

export const genres = pgTable("genres", {
  id: text("id").primaryKey(),
  tmdbId: text("tmdb_id"),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  featuredImage: text("featured_image"),
  status: statusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const genresRelations = relations(genres, ({ many }) => ({
  movies: many(movieGenres),
}))

export type InsertGenre = typeof genres.$inferInsert
export type SelectGenre = typeof genres.$inferSelect
