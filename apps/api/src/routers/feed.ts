import { os } from "@orpc/server"
import { and, count, desc, eq, ilike, lt, ne, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import {
  feeds,
  feedTopics,
  insertFeedSchema,
  selectFeedSchema,
  updateFeedSchema,
} from "@/db/schema/feed"
import { languageType } from "@/db/schema/language"
import { topics } from "@/db/schema/topic"
import { cuid, generateUniqueFeedSlug } from "@/lib/utils"

import {
  firstOrNull,
  firstValue,
  idInputSchema,
  infiniteSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const feedTopicOutput = z.object({
  id: z.string(),
  title: z.string(),
})

const feedDetailOutput = selectFeedSchema.extend({
  topics: z.array(feedTopicOutput),
})

const infiniteFeedsOutput = z.object({
  feeds: z.array(selectFeedSchema),
  nextCursor: z.date().nullable(),
})

const feedSitemapOutput = z.object({
  slug: z.string(),
  updatedAt: z.date().nullable(),
})

const createFeedSchema = insertFeedSchema
  .omit({ id: true, slug: true, createdAt: true, updatedAt: true })
  .extend({ topics: z.array(z.string()).default([]) })

const editFeedSchema = updateFeedSchema.extend({
  id: z.string(),
  topics: z.array(z.string()).default([]),
})

const languagePageSchema = pageSchema.extend({ language: languageType })

const languageInfiniteSchema = infiniteSchema.extend({ language: languageType })

const topicPageSchema = languagePageSchema.extend({ topicId: z.string() })

const topicInfiniteSchema = languageInfiniteSchema.extend({
  topicId: z.string(),
})

const ownerPageSchema = languagePageSchema.extend({ owner: z.string() })

const ownerInfiniteSchema = languageInfiniteSchema.extend({ owner: z.string() })

const feedSearchSchema = searchSchema.extend({ language: languageType })

function topicsForFeed(feedId: string) {
  return db
    .select({ id: topics.id, title: topics.title })
    .from(feedTopics)
    .innerJoin(topics, eq(feedTopics.topicId, topics.id))
    .where(eq(feedTopics.feedId, feedId))
}

function feedIdsByTopic(topicId: string) {
  return db
    .select({ feedId: feedTopics.feedId })
    .from(feedTopics)
    .where(eq(feedTopics.topicId, topicId))
}

async function insertFeedTopics(feedId: string, topicIds: string[]) {
  if (topicIds.length === 0) return

  await db
    .insert(feedTopics)
    .values(topicIds.map((topicId) => ({ feedId, topicId })))
}

export const feedRouter = {
  feedById: os
    .route({ method: "GET", path: "/feed/by-id/{id}" })
    .input(idInputSchema)
    .output(feedDetailOutput.nullable())
    .handler(async ({ input }) => {
      const feed = firstOrNull(
        await db.select().from(feeds).where(eq(feeds.id, input.id)).limit(1),
      )

      if (!feed) return null

      return { ...feed, topics: await topicsForFeed(feed.id) }
    }),
  feedByLanguage: os
    .route({ method: "POST", path: "/feed/by-language" })
    .input(languagePageSchema)
    .output(z.array(selectFeedSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(feeds)
        .where(eq(feeds.language, input.language))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(feeds.updatedAt))
    }),
  feedByLanguageInfinite: os
    .route({ method: "POST", path: "/feed/by-language-infinite" })
    .input(languageInfiniteSchema)
    .output(infiniteFeedsOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select()
        .from(feeds)
        .where(
          input.cursor
            ? and(
                eq(feeds.language, input.language),
                lt(feeds.updatedAt, input.cursor),
              )
            : eq(feeds.language, input.language),
        )
        .limit(input.limit + 1)
        .orderBy(desc(feeds.updatedAt))
      const nextItem = data.length > input.limit ? data.pop() : undefined

      return { feeds: data, nextCursor: nextItem?.updatedAt ?? null }
    }),
  feedByTopicId: os
    .route({ method: "POST", path: "/feed/by-topic-id" })
    .input(topicPageSchema)
    .output(z.array(selectFeedSchema))
    .handler(async ({ input }) => {
      const ids = (await feedIdsByTopic(input.topicId)).map(
        (item) => item.feedId,
      )
      const data = await db
        .select()
        .from(feeds)
        .where(eq(feeds.language, input.language))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(feeds.updatedAt))

      return data.filter((feed) => ids.includes(feed.id))
    }),
  feedByTopicIdInfinite: os
    .route({ method: "POST", path: "/feed/by-topic-id-infinite" })
    .input(topicInfiniteSchema)
    .output(infiniteFeedsOutput)
    .handler(async ({ input }) => {
      const ids = (await feedIdsByTopic(input.topicId)).map(
        (item) => item.feedId,
      )
      const data = await db
        .select()
        .from(feeds)
        .where(
          input.cursor
            ? and(
                eq(feeds.language, input.language),
                lt(feeds.updatedAt, input.cursor),
              )
            : eq(feeds.language, input.language),
        )
        .limit(input.limit + 1)
        .orderBy(desc(feeds.updatedAt))
      const filtered = data.filter((feed) => ids.includes(feed.id))
      const nextItem =
        filtered.length > input.limit ? filtered.pop() : undefined

      return { feeds: filtered, nextCursor: nextItem?.updatedAt ?? null }
    }),
  feedByOwner: os
    .route({ method: "POST", path: "/feed/by-owner" })
    .input(ownerPageSchema)
    .output(z.array(selectFeedSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(feeds)
        .where(
          and(eq(feeds.language, input.language), eq(feeds.owner, input.owner)),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(feeds.updatedAt))
    }),
  feedByOwnerInfinite: os
    .route({ method: "POST", path: "/feed/by-owner-infinite" })
    .input(ownerInfiniteSchema)
    .output(infiniteFeedsOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select()
        .from(feeds)
        .where(
          input.cursor
            ? and(
                eq(feeds.language, input.language),
                eq(feeds.owner, input.owner),
                lt(feeds.updatedAt, input.cursor),
              )
            : and(
                eq(feeds.language, input.language),
                eq(feeds.owner, input.owner),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(feeds.updatedAt))
      const nextItem = data.length > input.limit ? data.pop() : undefined

      return { feeds: data, nextCursor: nextItem?.updatedAt ?? null }
    }),
  feedRelatedInfinite: os
    .route({ method: "POST", path: "/feed/related-infinite" })
    .input(
      topicInfiniteSchema.extend({
        currentFeedId: z.string(),
      }),
    )
    .output(infiniteFeedsOutput)
    .handler(async ({ input }) => {
      const ids = (await feedIdsByTopic(input.topicId)).map(
        (item) => item.feedId,
      )
      const data = await db
        .select()
        .from(feeds)
        .where(
          input.cursor
            ? and(
                eq(feeds.language, input.language),
                ne(feeds.id, input.currentFeedId),
                lt(feeds.updatedAt, input.cursor),
              )
            : and(
                eq(feeds.language, input.language),
                ne(feeds.id, input.currentFeedId),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(feeds.updatedAt))
      const filtered = data.filter((feed) => ids.includes(feed.id))
      const nextItem =
        filtered.length > input.limit ? filtered.pop() : undefined

      return { feeds: filtered, nextCursor: nextItem?.updatedAt ?? null }
    }),
  feedDashboard: os
    .route({ method: "POST", path: "/feed/dashboard" })
    .input(pageSchema)
    .output(z.array(selectFeedSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(feeds)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(feeds.updatedAt))
    }),
  feedSitemap: os
    .route({ method: "POST", path: "/feed/sitemap" })
    .input(languagePageSchema)
    .output(z.array(feedSitemapOutput))
    .handler(({ input }) => {
      return db
        .select({ slug: feeds.slug, updatedAt: feeds.updatedAt })
        .from(feeds)
        .where(eq(feeds.language, input.language))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(feeds.id))
    }),
  feedCount: os
    .route({ method: "GET", path: "/feed/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(feeds)),
    ),
  feedCountDashboard: os
    .route({ method: "GET", path: "/feed/count-dashboard" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(feeds)),
    ),
  feedCountByLanguage: os
    .route({ method: "POST", path: "/feed/count-by-language" })
    .input(z.object({ language: languageType }))
    .output(z.number())
    .handler(async ({ input }) => {
      return firstValue(
        await db
          .select({ value: count() })
          .from(feeds)
          .where(eq(feeds.language, input.language)),
      )
    }),
  feedSearch: os
    .route({ method: "POST", path: "/feed/search" })
    .input(feedSearchSchema)
    .output(z.array(selectFeedSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(feeds)
        .where(
          and(
            eq(feeds.language, input.language),
            or(
              ilike(feeds.title, `%${input.searchQuery}%`),
              ilike(feeds.slug, `%${input.searchQuery}%`),
            ),
          ),
        )
        .limit(input.limit)
    }),
  feedSearchDashboard: os
    .route({ method: "POST", path: "/feed/search-dashboard" })
    .input(feedSearchSchema)
    .output(z.array(selectFeedSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(feeds)
        .where(
          and(
            eq(feeds.language, input.language),
            or(
              ilike(feeds.title, `%${input.searchQuery}%`),
              ilike(feeds.slug, `%${input.searchQuery}%`),
            ),
          ),
        )
        .limit(input.limit)
    }),
  feedCreate: os
    .route({ method: "POST", path: "/feed/create" })
    .input(createFeedSchema)
    .output(z.array(selectFeedSchema))
    .handler(async ({ input }) => {
      const feedId = cuid()
      const data = await db
        .insert(feeds)
        .values({
          ...input,
          id: feedId,
          slug: await generateUniqueFeedSlug(input.title),
        })
        .returning()

      await insertFeedTopics(feedId, input.topics)

      return data
    }),
  feedUpdate: os
    .route({ method: "POST", path: "/feed/update" })
    .input(editFeedSchema)
    .output(z.array(selectFeedSchema))
    .handler(async ({ input }) => {
      const data = await db
        .update(feeds)
        .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(feeds.id, input.id))
        .returning()

      await db.delete(feedTopics).where(eq(feedTopics.feedId, input.id))
      await insertFeedTopics(input.id, input.topics)

      return data
    }),
  feedUpdateWithoutChangeUpdatedDate: os
    .route({ method: "POST", path: "/feed/update-without-change-updated-date" })
    .input(editFeedSchema)
    .output(z.array(selectFeedSchema))
    .handler(async ({ input }) => {
      const data = await db
        .update(feeds)
        .set(input)
        .where(eq(feeds.id, input.id))
        .returning()

      await db.delete(feedTopics).where(eq(feedTopics.feedId, input.id))
      await insertFeedTopics(input.id, input.topics)

      return data
    }),
  feedDelete: os
    .route({ method: "POST", path: "/feed/delete" })
    .input(idInputSchema)
    .output(z.array(selectFeedSchema))
    .handler(async ({ input }) => {
      await db.delete(feedTopics).where(eq(feedTopics.feedId, input.id))
      return db.delete(feeds).where(eq(feeds.id, input.id)).returning()
    }),
}
