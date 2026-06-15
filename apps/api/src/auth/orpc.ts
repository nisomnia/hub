import { os as osBase } from "@orpc/server"

import { requireAdmin, requireAuth, requireAuthorOrAdmin } from "auth"

import type { SelectUser } from "@/db/schema/user"

export const os = osBase.$context<{ user: SelectUser | null }>()

export const requireAuthMiddleware = os.middleware(({ context, next }) => {
  requireAuth(context.user)
  return next()
})

export const requireAdminMiddleware = os.middleware(({ context, next }) => {
  requireAdmin(context.user)
  return next()
})

export const requireAuthorOrAdminMiddleware = os.middleware(
  ({ context, next }) => {
    requireAuthorOrAdmin(context.user)
    return next()
  },
)
