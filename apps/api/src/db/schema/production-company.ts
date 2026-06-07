import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { statusEnum } from "./status"

export const productionCompanies = pgTable("production_companies", {
  id: text("id").primaryKey(),
  tmdbId: text("tmdb_id").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  originCountry: text("origin_country"),
  description: text("description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  status: statusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type InsertProductionCompany = typeof productionCompanies.$inferInsert
export type SelectProductionCompany = typeof productionCompanies.$inferSelect
