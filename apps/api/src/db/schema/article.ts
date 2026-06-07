import { relations } from "drizzle-orm"
import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { ARTICLE_VISIBILITY } from "@/lib/validation/article"
import { articleComments } from "./article-comment"
import { languageEnum } from "./language"
import { statusEnum } from "./status"
import { topics } from "./topic"
import { users } from "./user"

export const articleVisibilityEnum = pgEnum(
  "article_visibility",
  ARTICLE_VISIBILITY,
)

export const articleTranslations = pgTable("article_translations", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  language: languageEnum("language").notNull().default("id"),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  status: statusEnum("status").notNull().default("draft"),
  visibility: articleVisibilityEnum("visibility").notNull().default("public"),
  articleTranslationId: text("article_translation_id")
    .notNull()
    .references(() => articleTranslations.id),
  featuredImage: text("featured_image").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const articlesRelations = relations(articles, ({ one, many }) => ({
  articleTranslation: one(articleTranslations, {
    fields: [articles.articleTranslationId],
    references: [articleTranslations.id],
  }),
  topics: many(articleTopics),
  authors: many(articleAuthors),
  editors: many(articleEditors),
  comments: many(articleComments),
}))

export const articleTranslationsRelations = relations(
  articleTranslations,
  ({ many }) => ({
    articles: many(articles),
  }),
)

export const articleAuthors = pgTable(
  "_article_authors",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => ({
    compoundKey: primaryKey({
      columns: [t.articleId, t.userId],
    }),
  }),
)

export const articleAuthorsRelations = relations(articleAuthors, ({ one }) => ({
  article: one(articles, {
    fields: [articleAuthors.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [articleAuthors.userId],
    references: [users.id],
  }),
}))

export const articleEditors = pgTable(
  "_article_editors",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => ({
    compoundKey: primaryKey({
      columns: [t.articleId, t.userId],
    }),
  }),
)

export const articleEditorsRelations = relations(articleEditors, ({ one }) => ({
  article: one(articles, {
    fields: [articleEditors.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [articleEditors.userId],
    references: [users.id],
  }),
}))

export const articleTopics = pgTable(
  "_article_topics",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
  },
  (t) => ({
    compoundKey: primaryKey({
      columns: [t.articleId, t.topicId],
    }),
  }),
)

export const articleTopicsRelations = relations(articleTopics, ({ one }) => ({
  article: one(articles, {
    fields: [articleTopics.articleId],
    references: [articles.id],
  }),
  topic: one(topics, {
    fields: [articleTopics.topicId],
    references: [topics.id],
  }),
}))

export type InsertArticle = typeof articles.$inferInsert
export type SelectArticle = typeof articles.$inferSelect

export type InsertArticleTranslation = typeof articleTranslations.$inferInsert
export type SelectArticleTranslation = typeof articleTranslations.$inferSelect
