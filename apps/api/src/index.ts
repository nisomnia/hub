import type { ContentfulStatusCode } from "hono/utils/http-status"

import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { ORPCError, onError } from "@orpc/server"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { Hono } from "hono"
import { cors } from "hono/cors"

import { isAuthError } from "auth"
import { serverPort } from "env/ports"
import { honoEnv } from "env/server"

import { authMiddleware } from "./auth/middleware"
import { router } from "./routers"
import { mountAuthRoutes } from "./routers/auth"

const app = new Hono()

const isProduction = honoEnv.NODE_ENV === "production"

app.use(
  cors({
    origin: isProduction ? "https://nisomnia.com" : (origin) => origin,
    credentials: true,
  }),
)

app.onError((err, c) => {
  if (isAuthError(err)) {
    return c.json(
      { error: err.message, code: err.code },
      err.status as ContentfulStatusCode,
    )
  }

  console.error(err)
  return c.json({ error: "Internal server error" }, 500 as ContentfulStatusCode)
})

mountAuthRoutes(app)

app.use("/public/*", authMiddleware)

const handler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      if (isAuthError(error)) {
        throw new ORPCError(error.code, {
          status: error.status,
          message: error.message,
        })
      }

      console.error(error)
    }),
  ],
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "Hub API",
          version: "1.0.0",
        },
      },
      docsPath: "/docs",
      specPath: "/spec.json",
    }),
  ],
})

const BODY_PARSER_METHODS = new Set([
  "arrayBuffer",
  "blob",
  "formData",
  "json",
  "text",
] as const)

type BodyParserMethod =
  typeof BODY_PARSER_METHODS extends Set<infer T> ? T : never

app.use("/public/*", async (c, next) => {
  const request = new Proxy(c.req.raw, {
    get(target, prop) {
      if (BODY_PARSER_METHODS.has(prop as BodyParserMethod)) {
        return () => c.req[prop as BodyParserMethod]()
      }
      return Reflect.get(target, prop, target)
    },
  })

  const { matched, response } = await handler.handle(request, {
    prefix: "/public",
    context: { user: c.get("user") },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  await next()
})

app.get("/", (c) => {
  return c.text("Hello World!")
})

export default {
  port: serverPort,
  fetch: app.fetch,
}
