import { os } from "@orpc/server"
import { count, desc, eq, ilike, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "../db"
import {
  adPosition,
  ads,
  insertAdSchema,
  updateAdSchema,
} from "../db/schema/ad"
import { cuid } from "../lib/utils"
import {
  firstOrNull,
  firstValue,
  idInputSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const createAdSchema = insertAdSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

const editAdSchema = updateAdSchema.extend({ id: z.string() })

export const adRouter = {
  adDashboard: os
    .route({ method: "POST", path: "/ad/dashboard" })
    .input(pageSchema)
    .output(z.array(z.any()))
    .handler(({ input }) => {
      return db
        .select()
        .from(ads)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(ads.createdAt))
    }),
  adById: os
    .route({ method: "GET", path: "/ad/by-id/{id}" })
    .input(idInputSchema)
    .output(z.any().nullable())
    .handler(async ({ input }) => {
      return firstOrNull(
        await db.select().from(ads).where(eq(ads.id, input.id)).limit(1),
      )
    }),
  adByPosition: os
    .route({ method: "GET", path: "/ad/by-position/{position}" })
    .input(z.object({ position: adPosition }))
    .output(z.array(z.any()))
    .handler(({ input }) => {
      return db.select().from(ads).where(eq(ads.position, input.position))
    }),
  adCount: os
    .route({ method: "GET", path: "/ad/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(ads)),
    ),
  adSearch: os
    .route({ method: "POST", path: "/ad/search" })
    .input(searchSchema)
    .output(z.array(z.any()))
    .handler(({ input }) => {
      return db
        .select()
        .from(ads)
        .where(ilike(ads.title, `%${input.searchQuery}%`))
        .limit(input.limit)
    }),
  adCreate: os
    .route({ method: "POST", path: "/ad/create" })
    .input(createAdSchema)
    .output(z.array(z.any()))
    .handler(({ input }) => {
      return db
        .insert(ads)
        .values({ ...input, id: cuid() })
        .returning()
    }),
  adUpdate: os
    .route({ method: "POST", path: "/ad/update" })
    .input(editAdSchema)
    .output(z.array(z.any()))
    .handler(({ input }) => {
      return db
        .update(ads)
        .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(ads.id, input.id))
        .returning()
    }),
  adDelete: os
    .route({ method: "POST", path: "/ad/delete" })
    .input(idInputSchema)
    .output(z.array(z.any()))
    .handler(({ input }) => {
      return db.delete(ads).where(eq(ads.id, input.id)).returning()
    }),
}
