# Auth System Design

**Date:** 2026-06-13 **Source:** Port OAuth-only auth from nisomnia to hub,
adapted for Hono + oRPC

## Overview

Add Google OAuth authentication with cookie-based sessions, role-based access
control (RBAC), and admin/user route protection. Auth logic lives in a
framework-agnostic `packages/auth` package for reuse across future apps.

## Architecture

```
packages/auth/
  src/
    session.ts       — generateSessionToken, hashSessionToken, createSession,
                       validateSession, invalidateSession, invalidateUserSessions
    oauth.ts          — createGoogleOAuthClient, generateState, getAuthorizationUrl,
                       validateAuthorizationCode
    guards.ts         — requireAuth, requireAdmin, requireAuthor, requireAuthorOrAdmin
    types.ts          — AuthConfig, SessionValidationResult, AuthError
    index.ts          — barrel export
  package.json
  tsconfig.json

apps/api/src/
  auth/
    middleware.ts     — Hono middleware: reads "session" cookie, calls packages/auth
                        validateSession, sets c.set("user", user)
  routers/
    auth.ts           — oRPC procedures: googleLogin, googleCallback, logout
    user.ts           — existing, refactored to use guards from packages/auth
    admin.ts          — new admin-only routes (stats, search, count)
```

## Package: packages/auth

### session.ts

Framework-agnostic. All functions accept a config `{ db, tables }` parameter.

```
generateSessionToken() → string
  Generate 20 random bytes, encode as base32 lowercase no-padding.

hashSessionToken(token: string) → string
  SHA256 hash the token, encode as lowercase hex.

createSession(config, userId: string) → { sessionId, token, expiresAt }
  Hash the token, insert into sessions table with 30-day expiry.

validateSession(config, token: string) → SessionValidationResult
  Hash token, query sessions JOIN users by session id.
  If expired: delete session, return null.
  If within 15 days of expiry: auto-extend to 30 days.
  Return { session, user }.

invalidateSession(config, sessionId: string) → void
  Delete session by id.

invalidateUserSessions(config, userId: string) → void
  Delete all sessions for user.
```

Dependencies: `@oslojs/crypto/sha2`, `@oslojs/encoding`

### oauth.ts

```
createGoogleOAuthClient(config: { clientId, clientSecret, redirectUrl }) → Arctic Google client
generateState() → { state, codeVerifier }
getAuthorizationUrl(client, state, codeVerifier) → URL
validateAuthorizationCode(client, code, codeVerifier) → OAuth2Tokens
```

Dependencies: `arctic`

### guards.ts

Pure predicate functions. Framework-agnostic — just check user object, throw
AuthError on failure.

```
class AuthError extends Error {
  status: 401 | 403
  code: "UNAUTHORIZED" | "FORBIDDEN"
}

requireAuth(user: User | null | undefined) → User
  Throw 401 if null/undefined.

requireAdmin(user: User) → User
  Throw 403 if role !== "admin".

requireAuthor(user: User) → User
  Throw 403 if role !== "author".

requireAuthorOrAdmin(user: User) → User
  Throw 403 if role not "author" or "admin".
```

### types.ts

```
AuthConfig {
  db: DrizzleDB
  tables: {
    users: PgTable
    accounts: PgTable
    sessions: PgTable
  }
}

SessionValidationResult =
  | { session: SelectSession; user: SelectUser }
  | { session: null; user: null }
```

## App: apps/api

### middleware.ts (Hono-specific)

Hono middleware applied before oRPC handler. Reads session cookie via Hono
cookie API, calls `packages/auth/validateSession`, sets `c.set("user", user)`.

The `c.get("user")` value is available in all oRPC handlers.

### routers/auth.ts (oRPC)

```
POST /auth/login/google          — generate state + verifier, set cookies, redirect to Google
GET  /auth/login/google/callback — validate state, exchange code for tokens, create/find
                                    user + account, create session, set session cookie,
                                    redirect to frontend
POST /auth/logout                — invalidate session, clear cookie
```

Callback flow:

1. Extract `code` and `state` from query params
2. Read `google_oauth_state` and `google_code_verifier` cookies
3. Validate state match
4. Call `packages/auth/validateAuthorizationCode`
5. Decode ID token claims (sub, name, picture, email)
6. Look up existing account by provider + providerAccountId
7. If existing user: create session, set cookie, redirect
8. If new user: generate cuid, insert user + account, create session, set cookie

### routers/user.ts (refactored)

Apply guards from `packages/auth`:

- `userDashboard` → `requireAuth` (any logged-in user)
- `userById` → `requireAuth`
- `userByUsername` → public (no change)
- `userByEmail` → public (no change)
- `userByRole` → `requireAdmin`
- `userCount` → public (no change)
- `userSearch` → public (no change)
- `userUpdate` → `requireAuth` (user updates own profile)
  - Remove `currentUserId` input field, use `c.get("user").id` instead
- `userUpdateByAdmin` → `requireAdmin` (no self-identity check needed)
- `userDelete` → `requireAuth` (user deletes own account)
  - Remove `currentUserId`, use `c.get("user").id`
- `userDeleteByAdmin` → `requireAdmin`

### routers/admin.ts (new)

```
POST /admin/user-stats           — requireAdmin: total users, by role breakdown
POST /admin/user-count           — requireAdmin: total user count
```

### index.ts changes

Add Hono cookie middleware and the auth middleware before the oRPC handler:

```ts
import { getCookie } from "hono/cookie"
// mount middleware at /api/public/* before oRPC handler
app.use("/api/public/*", authMiddleware)
```

## Env vars (packages/env/src/schema.ts)

```
GOOGLE_CLIENT_ID:     string (required)
GOOGLE_CLIENT_SECRET: string (required)
GOOGLE_REDIRECT_URL:  string (required, e.g. http://localhost:4000/api/public/auth/login/google/callback)
```

## Route permissions summary

| Route                 | Permission |
| --------------------- | ---------- |
| /auth/\*              | public     |
| /user/dashboard       | auth       |
| /user/by-id/{id}      | auth       |
| /user/by-username/\*  | public     |
| /user/by-email/\*     | public     |
| /user/by-role         | admin      |
| /user/count           | public     |
| /user/search          | public     |
| /user/update          | auth       |
| /user/update-by-admin | admin      |
| /user/delete          | auth       |
| /user/delete-by-admin | admin      |
| /admin/user-stats     | admin      |
| /admin/user-count     | admin      |
