import { count, desc } from "drizzle-orm"
import { z } from "zod"

import { os, requireAdminMiddleware } from "@/auth/orpc"
import { db } from "@/db"
import { selectUserSchema, users } from "@/db/schema/user"

import { firstValue, pageSchema } from "./helpers"

export const adminRouter = {
  adminUserCount: os
    .route({ method: "GET", path: "/admin/user-count" })
    .use(requireAdminMiddleware)
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(users)),
    ),

  adminUserDashboard: os
    .route({ method: "POST", path: "/admin/user-dashboard" })
    .use(requireAdminMiddleware)
    .input(pageSchema)
    .output(z.array(selectUserSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(users)
        .limit(input.perPage)
        .offset((input.page - 1) * input.perPage)
        .orderBy(desc(users.createdAt)),
    ),
}
