import { os } from "@orpc/server"
import { and, count, desc, eq, ilike, lt, ne, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "../db"
import {
  articleAuthors,
  articleEditors,
  articleTopics,
  articleTranslations,
  articles,
  insertArticleSchema,
  updateArticleSchema,
} from "../db/schema/article"
import { languageType } from "../db/schema/language"
import { topics } from "../db/schema/topic"
import { users } from "../db/schema/user"
import { cuid, generateUniqueArticleSlug, trimText } from "../lib/utils"
import {
  firstOrNull,
  firstValue,
  idInputSchema,
  infiniteSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const createArticleSchema = insertArticleSchema
  .omit({
    id: true,
    articleTranslationId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    slug: z.string().min(1).optional(),
    excerpt: z.string().optional(),
    topics: z.array(z.string()).min(1),
    authors: z.array(z.string()).min(1),
    editors: z.array(z.string()).min(1),
  })

const editArticleSchema = updateArticleSchema.extend({
  id: z.string(),
  topics: z.array(z.string()).default([]),
  authors: z.array(z.string()).default([]),
  editors: z.array(z.string()).default([]),
})

const _createArticle = os
  .route({ method: "POST", path: "/article/create" })
  .input(createArticleSchema)
  .output(z.array(z.any()))
  .handler(async ({ input }) => {
    const slug = input.slug ?? (await generateUniqueArticleSlug(input.title))
    const generatedExcerpt = input.excerpt ?? trimText(input.content, 160)
    const generatedMetaTitle = input.metaTitle ?? input.title
    const generatedMetaDescription = input.metaDescription ?? generatedExcerpt

    const articleTranslationId = cuid()
    const articleId = cuid()

    const articleTranslation = await db
      .insert(articleTranslations)
      .values({ id: articleTranslationId })
      .returning()

    const data = await db
      .insert(articles)
      .values({
        ...input,
        id: articleId,
        slug,
        excerpt: generatedExcerpt,
        metaTitle: generatedMetaTitle,
        metaDescription: generatedMetaDescription,
        articleTranslationId: articleTranslation[0].id,
      })
      .returning()

    const topicValues = input.topics.map((topic) => ({
      articleId: data[0].id,
      topicId: topic,
    }))

    const authorValues = input.authors.map((author) => ({
      articleId: data[0].id,
      userId: author,
    }))

    const editorValues = input.editors.map((editor) => ({
      articleId: data[0].id,
      userId: editor,
    }))

    await db.transaction(async () => {
      await db.insert(articleTopics).values(topicValues)
      await db.insert(articleAuthors).values(authorValues)
      await db.insert(articleEditors).values(editorValues)
    })

    return data
  })

export const articleRouter = {
  articleTranslationById: os
    .route({ method: "GET", path: "/article/article-translation-by-id/{id}" })
    .input(idInputSchema)
    .output(z.any().nullable())
    .handler(async ({ input }) => {
      const translation = firstOrNull(
        await db
          .select()
          .from(articleTranslations)
          .where(eq(articleTranslations.id, input.id))
          .limit(1),
      )

      if (!translation) return null

      const translatedArticles = await db
        .select()
        .from(articles)
        .where(eq(articles.articleTranslationId, input.id))

      return { ...translation, articles: translatedArticles }
    }),
  articleById: os
    .route({ method: "GET", path: "/article/by-id/{id}" })
    .input(idInputSchema)
    .output(z.any().nullable())
    .handler(async ({ input }) => {
      const article = firstOrNull(
        await db
          .select()
          .from(articles)
          .where(eq(articles.id, input.id))
          .limit(1),
      )

      if (!article) return null

      const articleTopicRows = await db
        .select({ id: topics.id, title: topics.title, slug: topics.slug })
        .from(articleTopics)
        .innerJoin(topics, eq(articleTopics.topicId, topics.id))
        .where(eq(articleTopics.articleId, article.id))
      const authorRows = await db
        .select({ id: users.id, name: users.name, username: users.username })
        .from(articleAuthors)
        .innerJoin(users, eq(articleAuthors.userId, users.id))
        .where(eq(articleAuthors.articleId, article.id))
      const editorRows = await db
        .select({ id: users.id, name: users.name })
        .from(articleEditors)
        .innerJoin(users, eq(articleEditors.userId, users.id))
        .where(eq(articleEditors.articleId, article.id))

      return {
        ...article,
        topics: articleTopicRows,
        authors: authorRows,
        editors: editorRows,
      }
    }),
  articleBySlug: os
    .route({ method: "GET", path: "/article/by-slug/{slug}" })
    .input(z.object({ slug: z.string() }))
    .output(z.any().nullable())
    .handler(async ({ input }) => {
      const article = firstOrNull(
        await db
          .select()
          .from(articles)
          .where(eq(articles.slug, input.slug))
          .limit(1),
      )

      if (!article) return null

      const articleTopicRows = await db
        .select({ id: topics.id, title: topics.title, slug: topics.slug })
        .from(articleTopics)
        .innerJoin(topics, eq(articleTopics.topicId, topics.id))
        .where(eq(articleTopics.articleId, article.id))
      const authorRows = await db
        .select({ id: users.id, name: users.name, username: users.username })
        .from(articleAuthors)
        .innerJoin(users, eq(articleAuthors.userId, users.id))
        .where(eq(articleAuthors.articleId, article.id))
      const editorRows = await db
        .select({ id: users.id, name: users.name })
        .from(articleEditors)
        .innerJoin(users, eq(articleEditors.userId, users.id))
        .where(eq(articleEditors.articleId, article.id))

      return {
        ...article,
        topics: articleTopicRows,
        authors: authorRows,
        editors: editorRows,
      }
    }),
  articleByLanguage: os
    .route({ method: "POST", path: "/article/by-language" })
    .input(pageSchema.extend({ language: languageType }))
    .output(z.array(z.any()))
    .handler(({ input }) =>
      db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.language, input.language),
            eq(articles.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(articles.updatedAt)),
    ),
  articleByLanguageInfinite: os
    .route({ method: "POST", path: "/article/by-language-infinite" })
    .input(infiniteSchema.extend({ language: languageType }))
    .output(z.any())
    .handler(async ({ input }) => {
      const data = await db
        .select()
        .from(articles)
        .where(
          input.cursor
            ? and(
                eq(articles.language, input.language),
                eq(articles.status, "published"),
                lt(articles.updatedAt, input.cursor),
              )
            : and(
                eq(articles.language, input.language),
                eq(articles.status, "published"),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(articles.updatedAt))
      const nextItem = data.length > input.limit ? data.pop() : undefined

      return { articles: data, nextCursor: nextItem?.updatedAt ?? null }
    }),
  articleByTopicId: os
    .route({ method: "POST", path: "/article/by-topic-id" })
    .input(pageSchema.extend({ language: languageType, topicId: z.string() }))
    .output(z.array(z.any()))
    .handler(({ input }) =>
      db
        .select({ article: articles })
        .from(articleTopics)
        .innerJoin(articles, eq(articleTopics.articleId, articles.id))
        .where(
          and(
            eq(articleTopics.topicId, input.topicId),
            eq(articles.language, input.language),
            eq(articles.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(articles.updatedAt)),
    ),
  articleByTopicIdInfinite: os
    .route({ method: "POST", path: "/article/by-topic-id-infinite" })
    .input(
      infiniteSchema.extend({ language: languageType, topicId: z.string() }),
    )
    .output(z.any())
    .handler(async ({ input }) => {
      const data = await db
        .select({ article: articles })
        .from(articleTopics)
        .innerJoin(articles, eq(articleTopics.articleId, articles.id))
        .where(
          input.cursor
            ? and(
                eq(articleTopics.topicId, input.topicId),
                eq(articles.language, input.language),
                eq(articles.status, "published"),
                lt(articles.updatedAt, input.cursor),
              )
            : and(
                eq(articleTopics.topicId, input.topicId),
                eq(articles.language, input.language),
                eq(articles.status, "published"),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(articles.updatedAt))
      const articlesData = data.map((item) => item.article)
      const nextItem =
        articlesData.length > input.limit ? articlesData.pop() : undefined

      return { articles: articlesData, nextCursor: nextItem?.updatedAt ?? null }
    }),
  articleByAuthorId: os
    .route({ method: "POST", path: "/article/by-author-id" })
    .input(pageSchema.extend({ authorId: z.string(), language: languageType }))
    .output(z.array(z.any()))
    .handler(({ input }) =>
      db
        .select({ article: articles })
        .from(articleAuthors)
        .innerJoin(articles, eq(articleAuthors.articleId, articles.id))
        .where(
          and(
            eq(articleAuthors.userId, input.authorId),
            eq(articles.language, input.language),
            eq(articles.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(articles.updatedAt)),
    ),
  articleByAuthorIdInfinite: os
    .route({ method: "POST", path: "/article/by-author-id-infinite" })
    .input(
      infiniteSchema.extend({ authorId: z.string(), language: languageType }),
    )
    .output(z.any())
    .handler(async ({ input }) => {
      const data = await db
        .select({ article: articles })
        .from(articleAuthors)
        .innerJoin(articles, eq(articleAuthors.articleId, articles.id))
        .where(
          input.cursor
            ? and(
                eq(articleAuthors.userId, input.authorId),
                eq(articles.language, input.language),
                eq(articles.status, "published"),
                lt(articles.updatedAt, input.cursor),
              )
            : and(
                eq(articleAuthors.userId, input.authorId),
                eq(articles.language, input.language),
                eq(articles.status, "published"),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(articles.updatedAt))
      const articlesData = data.map((item) => item.article)
      const nextItem =
        articlesData.length > input.limit ? articlesData.pop() : undefined

      return { articles: articlesData, nextCursor: nextItem?.updatedAt ?? null }
    }),
  articleRelatedInfinite: os
    .route({ method: "POST", path: "/article/related-infinite" })
    .input(
      infiniteSchema.extend({
        currentArticleId: z.string(),
        language: languageType,
        topicId: z.string(),
      }),
    )
    .output(z.any())
    .handler(async ({ input }) => {
      const data = await db
        .select({ article: articles })
        .from(articleTopics)
        .innerJoin(articles, eq(articleTopics.articleId, articles.id))
        .where(
          input.cursor
            ? and(
                eq(articleTopics.topicId, input.topicId),
                eq(articles.language, input.language),
                eq(articles.status, "published"),
                ne(articles.id, input.currentArticleId),
                lt(articles.updatedAt, input.cursor),
              )
            : and(
                eq(articleTopics.topicId, input.topicId),
                eq(articles.language, input.language),
                eq(articles.status, "published"),
                ne(articles.id, input.currentArticleId),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(articles.updatedAt))
      const articlesData = data.map((item) => item.article)
      const nextItem =
        articlesData.length > input.limit ? articlesData.pop() : undefined

      return { articles: articlesData, nextCursor: nextItem?.updatedAt ?? null }
    }),
  articleDashboard: os
    .route({ method: "POST", path: "/article/dashboard" })
    .input(pageSchema.extend({ language: languageType }))
    .output(z.array(z.any()))
    .handler(({ input }) =>
      db
        .select()
        .from(articles)
        .where(eq(articles.language, input.language))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(articles.updatedAt)),
    ),
  articleSitemap: os
    .route({ method: "POST", path: "/article/sitemap" })
    .input(pageSchema.extend({ language: languageType }))
    .output(z.array(z.any()))
    .handler(({ input }) =>
      db
        .select({ slug: articles.slug, updatedAt: articles.updatedAt })
        .from(articles)
        .where(
          and(
            eq(articles.language, input.language),
            eq(articles.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(articles.id)),
    ),
  articleCount: os
    .route({ method: "GET", path: "/article/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(
        await db
          .select({ value: count() })
          .from(articles)
          .where(eq(articles.status, "published")),
      ),
    ),
  articleCountDashboard: os
    .route({ method: "GET", path: "/article/count-dashboard" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(articles)),
    ),
  articleCountByLanguage: os
    .route({ method: "GET", path: "/article/count-by-language/{language}" })
    .input(z.object({ language: languageType }))
    .output(z.number())
    .handler(async ({ input }) =>
      firstValue(
        await db
          .select({ value: count() })
          .from(articles)
          .where(
            and(
              eq(articles.language, input.language),
              eq(articles.status, "published"),
            ),
          ),
      ),
    ),
  articleCountByLanguageDashboard: os
    .route({
      method: "GET",
      path: "/article/count-by-language-dashboard/{language}",
    })
    .input(z.object({ language: languageType }))
    .output(z.number())
    .handler(async ({ input }) =>
      firstValue(
        await db
          .select({ value: count() })
          .from(articles)
          .where(eq(articles.language, input.language)),
      ),
    ),
  articleSearch: os
    .route({ method: "POST", path: "/article/search" })
    .input(searchSchema.extend({ language: languageType }))
    .output(z.array(z.any()))
    .handler(({ input }) =>
      db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.language, input.language),
            eq(articles.status, "published"),
            or(
              ilike(articles.title, `%${input.searchQuery}%`),
              ilike(articles.slug, `%${input.searchQuery}%`),
            ),
          ),
        )
        .limit(input.limit),
    ),
  articleSearchDashboard: os
    .route({ method: "POST", path: "/article/search-dashboard" })
    .input(searchSchema)
    .output(z.array(z.any()))
    .handler(({ input }) =>
      db
        .select()
        .from(articles)
        .where(
          or(
            ilike(articles.title, `%${input.searchQuery}%`),
            ilike(articles.slug, `%${input.searchQuery}%`),
          ),
        )
        .limit(input.limit),
    ),
  articleCreate: _createArticle,
  articleUpdate: os
    .route({ method: "POST", path: "/article/update" })
    .input(editArticleSchema)
    .output(z.array(z.any()))
    .handler(async ({ input }) => {
      const { authors, editors, id, topics: topicIds, ...values } = input
      const data = await db
        .update(articles)
        .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(articles.id, id))
        .returning()

      await db.transaction(async () => {
        await db.delete(articleTopics).where(eq(articleTopics.articleId, id))
        await db.delete(articleAuthors).where(eq(articleAuthors.articleId, id))
        await db.delete(articleEditors).where(eq(articleEditors.articleId, id))
        if (topicIds.length > 0) {
          await db
            .insert(articleTopics)
            .values(topicIds.map((topicId) => ({ articleId: id, topicId })))
        }
        if (authors.length > 0) {
          await db
            .insert(articleAuthors)
            .values(authors.map((userId) => ({ articleId: id, userId })))
        }
        if (editors.length > 0) {
          await db
            .insert(articleEditors)
            .values(editors.map((userId) => ({ articleId: id, userId })))
        }
      })

      return data
    }),
  articleUpdateWithoutChangeUpdatedDate: os
    .route({
      method: "POST",
      path: "/article/update-without-change-updated-date",
    })
    .input(editArticleSchema)
    .output(z.array(z.any()))
    .handler(async ({ input }) => {
      const { authors, editors, id, topics: topicIds, ...values } = input
      const data = await db
        .update(articles)
        .set(values)
        .where(eq(articles.id, id))
        .returning()

      await db.transaction(async () => {
        await db.delete(articleTopics).where(eq(articleTopics.articleId, id))
        await db.delete(articleAuthors).where(eq(articleAuthors.articleId, id))
        await db.delete(articleEditors).where(eq(articleEditors.articleId, id))
        if (topicIds.length > 0) {
          await db
            .insert(articleTopics)
            .values(topicIds.map((topicId) => ({ articleId: id, topicId })))
        }
        if (authors.length > 0) {
          await db
            .insert(articleAuthors)
            .values(authors.map((userId) => ({ articleId: id, userId })))
        }
        if (editors.length > 0) {
          await db
            .insert(articleEditors)
            .values(editors.map((userId) => ({ articleId: id, userId })))
        }
      })

      return data
    }),
  articleTranslate: os
    .route({ method: "POST", path: "/article/translate" })
    .input(createArticleSchema.extend({ articleTranslationId: z.string() }))
    .output(z.array(z.any()))
    .handler(async ({ input }) => {
      const slug = input.slug ?? (await generateUniqueArticleSlug(input.title))
      const generatedExcerpt = input.excerpt ?? trimText(input.content, 160)
      const generatedMetaTitle = input.metaTitle ?? input.title
      const generatedMetaDescription = input.metaDescription ?? generatedExcerpt
      const articleId = cuid()
      const data = await db
        .insert(articles)
        .values({
          ...input,
          id: articleId,
          slug,
          excerpt: generatedExcerpt,
          metaTitle: generatedMetaTitle,
          metaDescription: generatedMetaDescription,
        })
        .returning()

      await db.transaction(async () => {
        await db
          .insert(articleTopics)
          .values(input.topics.map((topicId) => ({ articleId, topicId })))
        await db
          .insert(articleAuthors)
          .values(input.authors.map((userId) => ({ articleId, userId })))
        await db
          .insert(articleEditors)
          .values(input.editors.map((userId) => ({ articleId, userId })))
      })

      return data
    }),
  articleDelete: os
    .route({ method: "POST", path: "/article/delete" })
    .input(idInputSchema)
    .output(z.array(z.any()))
    .handler(async ({ input }) => {
      await db
        .delete(articleTopics)
        .where(eq(articleTopics.articleId, input.id))
      await db
        .delete(articleAuthors)
        .where(eq(articleAuthors.articleId, input.id))
      await db
        .delete(articleEditors)
        .where(eq(articleEditors.articleId, input.id))

      return db.delete(articles).where(eq(articles.id, input.id)).returning()
    }),
  articleDeleteByAdmin: os
    .route({ method: "POST", path: "/article/delete-by-admin" })
    .input(idInputSchema)
    .output(z.array(z.any()))
    .handler(async ({ input }) => {
      await db
        .delete(articleTopics)
        .where(eq(articleTopics.articleId, input.id))
      await db
        .delete(articleAuthors)
        .where(eq(articleAuthors.articleId, input.id))
      await db
        .delete(articleEditors)
        .where(eq(articleEditors.articleId, input.id))

      return db.delete(articles).where(eq(articles.id, input.id)).returning()
    }),
}
