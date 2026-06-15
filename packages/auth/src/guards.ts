import type { AuthUser } from "./types.js"

export class AuthError extends Error {
  status: number
  code: string

  constructor(
    message: string,
    status: number,
    code: "UNAUTHORIZED" | "FORBIDDEN",
  ) {
    super(message)
    this.name = "AuthError"
    this.status = status
    this.code = code
  }
}

export function requireAuth(user: AuthUser | null | undefined): AuthUser {
  if (!user) {
    throw new AuthError("Authentication required", 401, "UNAUTHORIZED")
  }
  return user
}

export function requireAdmin(user: AuthUser | null | undefined): AuthUser {
  const authUser = requireAuth(user)
  if (authUser.role !== "admin") {
    throw new AuthError("Admin access required", 403, "FORBIDDEN")
  }
  return authUser
}

export function requireAuthor(user: AuthUser | null | undefined): AuthUser {
  const authUser = requireAuth(user)
  if (authUser.role !== "author") {
    throw new AuthError("Author access required", 403, "FORBIDDEN")
  }
  return authUser
}

export function requireAuthorOrAdmin(
  user: AuthUser | null | undefined,
): AuthUser {
  const authUser = requireAuth(user)
  if (authUser.role !== "author" && authUser.role !== "admin") {
    throw new AuthError("Author or admin access required", 403, "FORBIDDEN")
  }
  return authUser
}
