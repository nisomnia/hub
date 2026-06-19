import type { Context, Hono } from "hono"

import {
  decodeIdToken,
  generateCodeVerifier,
  generateState,
  Google,
  type OAuth2Tokens,
} from "arctic"
import { and, eq } from "drizzle-orm"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

import { createSession, invalidateSession, validateSession } from "auth"
import type { AuthConfig } from "auth"
import { honoEnv } from "env/server"

import { db } from "@/db"
import { accounts, sessions, users } from "@/db/schema/user"
import { cuid } from "@/lib/utils"

const authConfig: AuthConfig = {
  db,
  tables: { users, sessions },
}

export function mountAuthRoutes(app: Hono) {
  app.get("/public/auth/login/google", (c: Context) => {
    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    const google = new Google(
      honoEnv.GOOGLE_CLIENT_ID,
      honoEnv.GOOGLE_CLIENT_SECRET,
      honoEnv.GOOGLE_REDIRECT_URL,
    )

    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
    ])

    setCookie(c, "google_oauth_state", state, {
      httpOnly: true,
      secure: honoEnv.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 10,
    })

    setCookie(c, "google_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: honoEnv.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 10,
    })

    return c.redirect(url.toString())
  })

  app.get("/public/auth/login/google/callback", async (c: Context) => {
    const code = c.req.query("code")
    const state = c.req.query("state")

    const storedState = getCookie(c, "google_oauth_state") ?? null
    const codeVerifier = getCookie(c, "google_code_verifier") ?? null

    if (
      code == null ||
      state == null ||
      storedState == null ||
      codeVerifier == null
    ) {
      return c.text("Please restart the process.", 400)
    }

    if (state !== storedState) {
      return c.text("Please restart the process.", 400)
    }

    const google = new Google(
      honoEnv.GOOGLE_CLIENT_ID,
      honoEnv.GOOGLE_CLIENT_SECRET,
      honoEnv.GOOGLE_REDIRECT_URL,
    )

    let tokens: OAuth2Tokens

    try {
      tokens = await google.validateAuthorizationCode(code, codeVerifier)
    } catch {
      return c.text("Please restart the process.", 400)
    }

    const claims = decodeIdToken(tokens.idToken()) as {
      sub?: string
      name?: string
      picture?: string
      email?: string
    }

    const googleId = claims.sub
    const name = claims.name
    const picture = claims.picture
    const email = claims.email

    if (!googleId || !email) {
      return c.text("Invalid user data from Google", 400)
    }

    const existingAccount = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, "google"),
          eq(accounts.providerAccountId, googleId),
        ),
      )
      .limit(1)

    let userId: string

    if (existingAccount.length > 0) {
      userId = existingAccount[0]!.userId
    } else {
      userId = cuid()

      await db.insert(users).values({
        id: userId,
        email,
        name: name ?? null,
        username: email,
        image: picture ?? null,
      })

      await db.insert(accounts).values({
        provider: "google",
        providerAccountId: googleId,
        userId,
      })
    }

    const { token, expiresAt } = await createSession(authConfig, userId)

    setCookie(c, "session", token, {
      httpOnly: true,
      secure: honoEnv.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      expires: expiresAt,
    })

    deleteCookie(c, "google_oauth_state")
    deleteCookie(c, "google_code_verifier")

    return c.redirect(`${honoEnv.PUBLIC_API_URL ?? ""}/`)
  })

  app.post("/public/auth/logout", async (c: Context) => {
    const token = getCookie(c, "session")

    if (token) {
      const result = await validateSession(authConfig, token)

      if (result.session) {
        await invalidateSession(authConfig, result.session.id)
      }
    }

    deleteCookie(c, "session")

    return c.redirect(`${honoEnv.PUBLIC_API_URL ?? ""}/`)
  })
}
