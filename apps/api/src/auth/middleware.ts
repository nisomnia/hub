import type { Context, Next } from "hono"

import { getCookie } from "hono/cookie"

import { validateSession } from "auth"
import type { AuthConfig } from "auth"

import type { SelectUser } from "@/db/schema/user"

import { db } from "@/db"
import { sessions, users } from "@/db/schema/user"

declare module "hono" {
  interface ContextVariableMap {
    user: SelectUser | null
  }
}

const authConfig: AuthConfig = {
  db,
  tables: { users, sessions },
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, "session")

  if (token) {
    const result = await validateSession(authConfig, token)
    c.set("user", result.user)
  } else {
    c.set("user", null)
  }

  await next()
}
