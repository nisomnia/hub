import type { AuthUser } from "./types.js"

export interface AuthError extends Error {
  status: number
  code: string
}

export function createAuthError(
  message: string,
  status: number,
  code: "UNAUTHORIZED" | "FORBIDDEN",
): AuthError {
  const error = new Error(message) as AuthError
  error.name = "AuthError"
  error.status = status
  error.code = code
  return error
}

export function isAuthError(error: unknown): error is AuthError {
  return (
    error instanceof Error &&
    error.name === "AuthError" &&
    "status" in error &&
    "code" in error
  )
}

export function requireAuth(user: AuthUser | null | undefined): AuthUser {
  if (!user) {
    throw createAuthError("Authentication required", 401, "UNAUTHORIZED")
  }
  return user
}

export function requireAdmin(user: AuthUser | null | undefined): AuthUser {
  const authUser = requireAuth(user)
  if (authUser.role !== "admin") {
    throw createAuthError("Admin access required", 403, "FORBIDDEN")
  }
  return authUser
}

export function requireAuthor(user: AuthUser | null | undefined): AuthUser {
  const authUser = requireAuth(user)
  if (authUser.role !== "author") {
    throw createAuthError("Author access required", 403, "FORBIDDEN")
  }
  return authUser
}

export function requireAuthorOrAdmin(
  user: AuthUser | null | undefined,
): AuthUser {
  const authUser = requireAuth(user)
  if (authUser.role !== "author" && authUser.role !== "admin") {
    throw createAuthError("Author or admin access required", 403, "FORBIDDEN")
  }
  return authUser
}
