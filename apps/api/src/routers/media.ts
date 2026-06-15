import { count, desc, eq, ilike, sql } from "drizzle-orm"
import { z } from "zod"

import { os, requireAuthorOrAdminMiddleware } from "@/auth/orpc"
import { db } from "@/db"
import {
  insertMediaSchema,
  mediaCategory,
  medias,
  selectMediaSchema,
  updateMediaSchema,
} from "@/db/schema/media"
import { cuid } from "@/lib/utils"

import {
  firstOrNull,
  firstValue,
  idInputSchema,
  infiniteSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const createMediaSchema = insertMediaSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

const editMediaSchema = updateMediaSchema.extend({ id: z.string() })

const infiniteOutput = z.object({
  medias: z.array(selectMediaSchema),
  nextCursor: z.date().nullable(),
})

const sitemapOutput = z.object({
  name: z.string(),
  updatedAt: z.date().nullable(),
})

export const mediaRouter = {
  mediaDashboard: os
    .route({ method: "POST", path: "/media/dashboard" })
    .use(requireAuthorOrAdminMiddleware)
    .input(pageSchema)
    .output(z.array(selectMediaSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(medias)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(medias.createdAt)),
    ),
  mediaDashboardInfinite: os
    .route({ method: "POST", path: "/media/dashboard-infinite" })
    .use(requireAuthorOrAdminMiddleware)
    .input(infiniteSchema)
    .output(infiniteOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select()
        .from(medias)
        .where(
          input.cursor ? sql`${medias.createdAt} < ${input.cursor}` : undefined,
        )
        .limit(input.limit + 1)
        .orderBy(desc(medias.createdAt))
      const nextItem = data.length > input.limit ? data.pop() : undefined

      return { medias: data, nextCursor: nextItem?.createdAt ?? null }
    }),
  mediaDashboardInfiniteByCategory: os
    .route({ method: "POST", path: "/media/dashboard-infinite-by-category" })
    .use(requireAuthorOrAdminMiddleware)
    .input(infiniteSchema.extend({ category: mediaCategory }))
    .output(infiniteOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select()
        .from(medias)
        .where(
          input.cursor
            ? sql`${medias.category} = ${input.category} AND ${medias.createdAt} < ${input.cursor}`
            : eq(medias.category, input.category),
        )
        .limit(input.limit + 1)
        .orderBy(desc(medias.createdAt))
      const nextItem = data.length > input.limit ? data.pop() : undefined

      return { medias: data, nextCursor: nextItem?.createdAt ?? null }
    }),
  mediaById: os
    .route({ method: "GET", path: "/media/image/by-id/{imageId}" })
    .input(z.object({ imageId: z.string() }))
    .output(selectMediaSchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(medias)
          .where(eq(medias.id, input.imageId))
          .limit(1),
      ),
    ),
  mediaByName: os
    .route({ method: "GET", path: "/media/by-name/{name}" })
    .input(z.object({ name: z.string() }))
    .output(selectMediaSchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(medias)
          .where(eq(medias.name, input.name))
          .limit(1),
      ),
    ),
  mediaByAuthorId: os
    .route({ method: "POST", path: "/media/by-author-id" })
    .input(pageSchema.extend({ authorId: z.string() }))
    .output(z.array(selectMediaSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(medias)
        .where(eq(medias.authorId, input.authorId))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(medias.createdAt)),
    ),
  mediaSearch: os
    .route({ method: "POST", path: "/media/search" })
    .input(searchSchema)
    .output(z.array(selectMediaSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(medias)
        .where(ilike(medias.name, `%${input.searchQuery}%`))
        .limit(input.limit),
    ),
  mediaByCategory: os
    .route({ method: "POST", path: "/media/by-category" })
    .input(pageSchema.extend({ category: mediaCategory }))
    .output(z.array(selectMediaSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(medias)
        .where(eq(medias.category, input.category))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(medias.createdAt)),
    ),
  mediaSearchByCategory: os
    .route({ method: "POST", path: "/media/search-by-category" })
    .input(searchSchema.extend({ category: mediaCategory }))
    .output(z.array(selectMediaSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(medias)
        .where(
          sql`${medias.category} = ${input.category} AND ${medias.name} ILIKE ${`%${input.searchQuery}%`}`,
        )
        .limit(input.limit),
    ),
  mediaSitemap: os
    .route({ method: "POST", path: "/media/sitemap" })
    .input(pageSchema)
    .output(z.array(sitemapOutput))
    .handler(({ input }) =>
      db
        .select({ name: medias.name, updatedAt: medias.updatedAt })
        .from(medias)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(medias.id)),
    ),
  mediaCount: os
    .route({ method: "GET", path: "/media/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(medias)),
    ),
  mediaCreate: os
    .route({ method: "POST", path: "/media/create" })
    .use(requireAuthorOrAdminMiddleware)
    .input(createMediaSchema)
    .output(z.array(selectMediaSchema))
    .handler(({ input }) =>
      db
        .insert(medias)
        .values({ ...input, id: cuid() })
        .returning(),
    ),
  mediaUpdate: os
    .route({ method: "POST", path: "/media/update" })
    .use(requireAuthorOrAdminMiddleware)
    .input(editMediaSchema)
    .output(z.array(selectMediaSchema))
    .handler(({ input }) => {
      const { id, ...values } = input

      return db
        .update(medias)
        .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(medias.id, id))
        .returning()
    }),
  mediaDeleteById: os
    .route({ method: "POST", path: "/media/delete-by-id" })
    .use(requireAuthorOrAdminMiddleware)
    .input(idInputSchema)
    .output(z.array(selectMediaSchema))
    .handler(({ input }) =>
      db.delete(medias).where(eq(medias.id, input.id)).returning(),
    ),
  mediaDeleteByName: os
    .route({ method: "POST", path: "/media/delete-by-name" })
    .use(requireAuthorOrAdminMiddleware)
    .input(z.object({ name: z.string() }))
    .output(z.array(selectMediaSchema))
    .handler(({ input }) =>
      db.delete(medias).where(eq(medias.name, input.name)).returning(),
    ),
}
