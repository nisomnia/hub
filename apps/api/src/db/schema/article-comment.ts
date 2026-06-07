import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { articles } from "./article"
import { users } from "./user"

export const articleComments = pgTable("article_comments", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  replyToId: text("reply_to_id"),
  articleId: text("article_id")
    .notNull()
    .references(() => articles.id),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const articleCommentsRelations = relations(
  articleComments,
  ({ one, many }) => ({
    replyTo: one(articleComments, {
      fields: [articleComments.replyToId],
      references: [articleComments.id],
      relationName: "article_comments_replies",
    }),
    author: one(users, {
      fields: [articleComments.authorId],
      references: [users.id],
    }),
    article: one(articles, {
      fields: [articleComments.articleId],
      references: [articles.id],
    }),
    replies: many(articleComments, {
      relationName: "article_comments_replies",
    }),
  }),
)

export type InsertArticleComment = typeof articleComments.$inferInsert
export type SelectArticleComment = typeof articleComments.$inferSelect
