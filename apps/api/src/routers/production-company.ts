import { os } from "@orpc/server"
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "../db"
import {
  insertProductionCompanySchema,
  productionCompanies,
  selectProductionCompanySchema,
  updateProductionCompanySchema,
} from "../db/schema/production-company"
import { cuid, generateUniqueProductionCompanySlug } from "../lib/utils"
import {
  firstOrNull,
  firstValue,
  idInputSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const createProductionCompanySchema = insertProductionCompanySchema.omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
})

const editProductionCompanySchema = updateProductionCompanySchema.extend({
  id: z.string(),
})

const sitemapOutput = z.object({
  slug: z.string(),
  updatedAt: z.date().nullable(),
})

const _createProductionCompany = os
  .route({ method: "POST", path: "/production-company/create" })
  .input(createProductionCompanySchema)
  .output(z.array(selectProductionCompanySchema))
  .handler(async ({ input }) => {
    const slug = await generateUniqueProductionCompanySlug(input.name)
    const generatedMetaTitle = input.metaTitle ?? input.name
    const generatedMetaDescription = input.metaDescription ?? input.description

    return db
      .insert(productionCompanies)
      .values({
        ...input,
        id: cuid(),
        slug,
        metaTitle: generatedMetaTitle,
        metaDescription: generatedMetaDescription,
      })
      .returning()
  })

export const productionCompanyRouter = {
  productionCompanyDashboard: os
    .route({ method: "POST", path: "/production-company/dashboard" })
    .input(pageSchema)
    .output(z.array(selectProductionCompanySchema))
    .handler(({ input }) =>
      db
        .select()
        .from(productionCompanies)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(productionCompanies.updatedAt)),
    ),
  productionCompanyById: os
    .route({ method: "GET", path: "/production-company/by-id/{id}" })
    .input(idInputSchema)
    .output(selectProductionCompanySchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(productionCompanies)
          .where(eq(productionCompanies.id, input.id))
          .limit(1),
      ),
    ),
  productionCompanyByTmdbId: os
    .route({ method: "GET", path: "/production-company/by-tmdb-id/{tmdbId}" })
    .input(z.object({ tmdbId: z.string() }))
    .output(selectProductionCompanySchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(productionCompanies)
          .where(eq(productionCompanies.tmdbId, input.tmdbId))
          .limit(1),
      ),
    ),
  productionCompanyBySlug: os
    .route({ method: "GET", path: "/production-company/by-slug/{slug}" })
    .input(z.object({ slug: z.string() }))
    .output(selectProductionCompanySchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(productionCompanies)
          .where(eq(productionCompanies.slug, input.slug))
          .limit(1),
      ),
    ),
  productionCompanySitemap: os
    .route({ method: "POST", path: "/production-company/sitemap" })
    .input(pageSchema)
    .output(z.array(sitemapOutput))
    .handler(({ input }) =>
      db
        .select({
          slug: productionCompanies.slug,
          updatedAt: productionCompanies.updatedAt,
        })
        .from(productionCompanies)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(productionCompanies.id)),
    ),
  productionCompanyCount: os
    .route({ method: "GET", path: "/production-company/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(
        await db
          .select({ value: count() })
          .from(productionCompanies)
          .where(eq(productionCompanies.status, "published")),
      ),
    ),
  productionCompanyCountDashboard: os
    .route({ method: "GET", path: "/production-company/count-dashboard" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(productionCompanies)),
    ),
  productionCompanySearch: os
    .route({ method: "POST", path: "/production-company/search" })
    .input(searchSchema)
    .output(z.array(selectProductionCompanySchema))
    .handler(({ input }) =>
      db
        .select()
        .from(productionCompanies)
        .where(
          and(
            eq(productionCompanies.status, "published"),
            or(
              ilike(productionCompanies.name, `%${input.searchQuery}%`),
              ilike(productionCompanies.slug, `%${input.searchQuery}%`),
            ),
          ),
        )
        .limit(input.limit),
    ),
  productionCompanySearchDashboard: os
    .route({ method: "POST", path: "/production-company/search-dashboard" })
    .input(searchSchema)
    .output(z.array(selectProductionCompanySchema))
    .handler(({ input }) =>
      db
        .select()
        .from(productionCompanies)
        .where(
          or(
            ilike(productionCompanies.name, `%${input.searchQuery}%`),
            ilike(productionCompanies.slug, `%${input.searchQuery}%`),
          ),
        )
        .limit(input.limit),
    ),
  productionCompanyCreate: _createProductionCompany,
  productionCompanyUpdate: os
    .route({ method: "POST", path: "/production-company/update" })
    .input(editProductionCompanySchema)
    .output(z.array(selectProductionCompanySchema))
    .handler(({ input }) => {
      const { id, ...values } = input

      return db
        .update(productionCompanies)
        .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(productionCompanies.id, id))
        .returning()
    }),
  productionCompanyDelete: os
    .route({ method: "POST", path: "/production-company/delete" })
    .input(idInputSchema)
    .output(z.array(selectProductionCompanySchema))
    .handler(({ input }) =>
      db
        .delete(productionCompanies)
        .where(eq(productionCompanies.id, input.id))
        .returning(),
    ),
}
