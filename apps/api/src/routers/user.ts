import { os } from "@orpc/server"
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "../db"
import {
  selectUserSchema,
  updateUserSchema,
  userRole,
  users,
} from "../db/schema/user"
import {
  firstOrNull,
  firstValue,
  idInputSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const editUserSchema = updateUserSchema.extend({ id: z.string() })

export const userRouter = {
  userDashboard: os
    .route({ method: "POST", path: "/user/dashboard" })
    .input(pageSchema)
    .output(z.array(selectUserSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(users)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(users.createdAt))
    }),
  userById: os
    .route({ method: "GET", path: "/user/by-id/{id}" })
    .input(idInputSchema)
    .output(selectUserSchema.nullable())
    .handler(async ({ input }) => {
      return firstOrNull(
        await db.select().from(users).where(eq(users.id, input.id)).limit(1),
      )
    }),
  userByUsername: os
    .route({ method: "GET", path: "/user/by-username/{username}" })
    .input(z.object({ username: z.string() }))
    .output(selectUserSchema.nullable())
    .handler(async ({ input }) => {
      return firstOrNull(
        await db
          .select()
          .from(users)
          .where(eq(users.username, input.username))
          .limit(1),
      )
    }),
  userByEmail: os
    .route({ method: "GET", path: "/user/by-email/{email}" })
    .input(z.object({ email: z.string() }))
    .output(selectUserSchema.nullable())
    .handler(async ({ input }) => {
      return firstOrNull(
        await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1),
      )
    }),
  userByRole: os
    .route({ method: "POST", path: "/user/by-role" })
    .input(pageSchema.extend({ role: userRole }))
    .output(z.array(selectUserSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(users)
        .where(eq(users.role, input.role))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(users.createdAt))
    }),
  userCount: os
    .route({ method: "GET", path: "/user/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(users)),
    ),
  userSearch: os
    .route({ method: "POST", path: "/user/search" })
    .input(searchSchema)
    .output(z.array(selectUserSchema))
    .handler(({ input }) => {
      return db
        .select()
        .from(users)
        .where(
          or(
            ilike(users.name, `%${input.searchQuery}%`),
            ilike(users.username, `%${input.searchQuery}%`),
            ilike(users.email, `%${input.searchQuery}%`),
          ),
        )
        .limit(input.limit)
    }),
  userUpdate: os
    .route({ method: "POST", path: "/user/update" })
    .input(editUserSchema.extend({ currentUserId: z.string() }))
    .output(z.array(selectUserSchema))
    .handler(async ({ input }) => {
      if (input.id !== input.currentUserId) throw new Error("Unauthorized")

      if (input.username) {
        const existing = firstOrNull(
          await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.username, input.username),
                sql`${users.id} != ${input.id}`,
              ),
            )
            .limit(1),
        )

        if (existing) throw new Error("Username already exists")
      }

      return db
        .update(users)
        .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(users.id, input.id))
        .returning()
    }),
  userUpdateByAdmin: os
    .route({ method: "POST", path: "/user/update-by-admin" })
    .input(editUserSchema)
    .output(z.array(selectUserSchema))
    .handler(async ({ input }) => {
      if (input.username) {
        const existing = firstOrNull(
          await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.username, input.username),
                sql`${users.id} != ${input.id}`,
              ),
            )
            .limit(1),
        )

        if (existing) throw new Error("Username already exists")
      }

      return db
        .update(users)
        .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(users.id, input.id))
        .returning()
    }),
  userDelete: os
    .route({ method: "POST", path: "/user/delete" })
    .input(idInputSchema.extend({ currentUserId: z.string() }))
    .output(z.array(selectUserSchema))
    .handler(({ input }) => {
      if (input.id !== input.currentUserId) throw new Error("Unauthorized")

      return db.delete(users).where(eq(users.id, input.id)).returning()
    }),
  userDeleteByAdmin: os
    .route({ method: "POST", path: "/user/delete-by-admin" })
    .input(idInputSchema)
    .output(z.array(selectUserSchema))
    .handler(({ input }) => {
      return db.delete(users).where(eq(users.id, input.id)).returning()
    }),
}
