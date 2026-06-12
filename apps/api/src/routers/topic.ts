import { os } from "@orpc/server"
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { articleTopics } from "@/db/schema/article"
import { languageType } from "@/db/schema/language"
import {
  insertTopicSchema,
  selectTopicSchema,
  selectTopicTranslationSchema,
  topics,
  topicTranslations,
  topicVisibility,
  updateTopicSchema,
} from "@/db/schema/topic"
import { cuid, generateUniqueTopicSlug } from "@/lib/utils"

import {
  firstOrNull,
  firstValue,
  idInputSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const createTopicSchema = insertTopicSchema
  .omit({
    id: true,
    topicTranslationId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({ slug: z.string().min(1).optional() })

const editTopicSchema = updateTopicSchema.extend({ id: z.string() })

const topicTranslationDetailOutput = selectTopicTranslationSchema.extend({
  topics: z.array(selectTopicSchema),
})

const topicByArticleCountOutput = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  language: z.string(),
  count: z.number(),
})

const topicSitemapOutput = z.object({
  slug: z.string(),
  updatedAt: z.date().nullable(),
})

const _createTopic = os
  .route({ method: "POST", path: "/topic/create" })
  .input(createTopicSchema)
  .output(z.array(selectTopicSchema))
  .handler(async ({ input }) => {
    const slug = input.slug ?? (await generateUniqueTopicSlug(input.title))
    const generatedMetaTitle = input.metaTitle ?? input.title
    const generatedMetaDescription = input.metaDescription ?? input.description
    const topicTranslation = await db
      .insert(topicTranslations)
      .values({ id: cuid() })
      .returning()

    return db
      .insert(topics)
      .values({
        ...input,
        id: cuid(),
        slug,
        metaTitle: generatedMetaTitle,
        metaDescription: generatedMetaDescription,
        topicTranslationId: topicTranslation[0].id,
      })
      .returning()
  })

export const topicRouter = {
  topicTranslationById: os
    .route({ method: "GET", path: "/topic/topic-translation-by-id/{id}" })
    .input(idInputSchema)
    .output(topicTranslationDetailOutput.nullable())
    .handler(async ({ input }) => {
      const translation = firstOrNull(
        await db
          .select()
          .from(topicTranslations)
          .where(eq(topicTranslations.id, input.id))
          .limit(1),
      )

      if (!translation) return null

      const translatedTopics = await db
        .select()
        .from(topics)
        .where(eq(topics.topicTranslationId, input.id))

      return { ...translation, topics: translatedTopics }
    }),
  topicDashboard: os
    .route({ method: "POST", path: "/topic/dashboard" })
    .input(pageSchema.extend({ language: languageType }))
    .output(z.array(selectTopicSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(topics)
        .where(eq(topics.language, input.language))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(topics.updatedAt)),
    ),
  topicById: os
    .route({ method: "GET", path: "/topic/by-id/{id}" })
    .input(idInputSchema)
    .output(selectTopicSchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db.select().from(topics).where(eq(topics.id, input.id)).limit(1),
      ),
    ),
  topicByLanguage: os
    .route({ method: "POST", path: "/topic/by-language" })
    .input(pageSchema.extend({ language: languageType }))
    .output(z.array(selectTopicSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(topics)
        .where(
          and(
            eq(topics.language, input.language),
            eq(topics.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(topics.createdAt)),
    ),
  topicByArticleCount: os
    .route({ method: "POST", path: "/topic/by-article-count" })
    .input(pageSchema.extend({ language: languageType }))
    .output(z.array(topicByArticleCountOutput))
    .handler(({ input }) =>
      db
        .select({
          id: topics.id,
          title: topics.title,
          slug: topics.slug,
          language: topics.language,
          count: count(articleTopics.articleId),
        })
        .from(topics)
        .leftJoin(articleTopics, eq(articleTopics.topicId, topics.id))
        .where(
          and(
            eq(topics.language, input.language),
            eq(topics.status, "published"),
            eq(topics.visibility, "public"),
          ),
        )
        .groupBy(topics.id)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(count(articleTopics.articleId))),
    ),
  topicSitemap: os
    .route({ method: "POST", path: "/topic/sitemap" })
    .input(pageSchema.extend({ language: languageType }))
    .output(z.array(topicSitemapOutput))
    .handler(({ input }) =>
      db
        .select({ slug: topics.slug, updatedAt: topics.updatedAt })
        .from(topics)
        .where(
          and(
            eq(topics.language, input.language),
            eq(topics.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(topics.updatedAt)),
    ),
  topicByVisibility: os
    .route({ method: "POST", path: "/topic/by-visibility" })
    .input(
      pageSchema.extend({
        language: languageType,
        visibility: topicVisibility,
      }),
    )
    .output(z.array(selectTopicSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(topics)
        .where(
          and(
            eq(topics.visibility, input.visibility),
            eq(topics.language, input.language),
            eq(topics.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(topics.updatedAt)),
    ),
  topicBySlug: os
    .route({ method: "GET", path: "/topic/by-slug/{slug}" })
    .input(z.object({ slug: z.string() }))
    .output(selectTopicSchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(topics)
          .where(eq(topics.slug, input.slug))
          .limit(1),
      ),
    ),
  topicSearch: os
    .route({ method: "POST", path: "/topic/search" })
    .input(searchSchema.extend({ language: languageType }))
    .output(z.array(selectTopicSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(topics)
        .where(
          and(
            eq(topics.language, input.language),
            eq(topics.visibility, "public"),
            eq(topics.status, "published"),
            or(
              ilike(topics.title, `%${input.searchQuery}%`),
              ilike(topics.slug, `%${input.searchQuery}%`),
            ),
          ),
        )
        .limit(input.limit),
    ),
  topicSearchDashboard: os
    .route({ method: "POST", path: "/topic/search-dashboard" })
    .input(searchSchema)
    .output(z.array(selectTopicSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(topics)
        .where(
          or(
            ilike(topics.title, `%${input.searchQuery}%`),
            ilike(topics.slug, `%${input.searchQuery}%`),
          ),
        )
        .limit(input.limit),
    ),
  topicCount: os
    .route({ method: "GET", path: "/topic/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(
        await db
          .select({ value: count() })
          .from(topics)
          .where(eq(topics.status, "published")),
      ),
    ),
  topicCountDashboard: os
    .route({ method: "GET", path: "/topic/count-dashboard" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(topics)),
    ),
  topicCountByLanguage: os
    .route({ method: "GET", path: "/topic/count-by-language/{language}" })
    .input(z.object({ language: languageType }))
    .output(z.number())
    .handler(async ({ input }) =>
      firstValue(
        await db
          .select({ value: count() })
          .from(topics)
          .where(
            and(
              eq(topics.language, input.language),
              eq(topics.status, "published"),
            ),
          ),
      ),
    ),
  topicCountByLanguageDashboard: os
    .route({
      method: "GET",
      path: "/topic/count-by-language-dashboard/{language}",
    })
    .input(z.object({ language: languageType }))
    .output(z.number())
    .handler(async ({ input }) =>
      firstValue(
        await db
          .select({ value: count() })
          .from(topics)
          .where(eq(topics.language, input.language)),
      ),
    ),
  topicCreate: _createTopic,
  topicUpdate: os
    .route({ method: "POST", path: "/topic/update" })
    .input(editTopicSchema)
    .output(z.array(selectTopicSchema))
    .handler(({ input }) => {
      const { id, ...values } = input

      return db
        .update(topics)
        .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(topics.id, id))
        .returning()
    }),
  topicTranslate: os
    .route({ method: "POST", path: "/topic/translate" })
    .input(createTopicSchema.extend({ topicTranslationId: z.string() }))
    .output(z.array(selectTopicSchema))
    .handler(async ({ input }) => {
      const slug = input.slug ?? (await generateUniqueTopicSlug(input.title))
      const generatedMetaTitle = input.metaTitle ?? input.title
      const generatedMetaDescription =
        input.metaDescription ?? input.description

      return db
        .insert(topics)
        .values({
          ...input,
          id: cuid(),
          slug,
          metaTitle: generatedMetaTitle,
          metaDescription: generatedMetaDescription,
        })
        .returning()
    }),
  topicDelete: os
    .route({ method: "POST", path: "/topic/delete" })
    .input(idInputSchema)
    .output(z.array(selectTopicSchema))
    .handler(async ({ input }) => {
      return await db.transaction(async (tx) => {
        await tx
          .delete(articleTopics)
          .where(eq(articleTopics.topicId, input.id))

        return tx.delete(topics).where(eq(topics.id, input.id)).returning()
      })
    }),
}
