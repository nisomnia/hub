import type { ContentfulStatusCode } from "hono/utils/http-status"

import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { ORPCError, onError } from "@orpc/server"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { Hono } from "hono"

import { AuthError } from "auth"
import { serverPort } from "env/ports"

import { authMiddleware } from "./auth/middleware"
import { router } from "./routers"
import { mountAuthRoutes } from "./routers/auth"

const app = new Hono()

app.onError((err, c) => {
  if (err instanceof AuthError) {
    return c.json(
      { error: err.message, code: err.code },
      err.status as ContentfulStatusCode,
    )
  }

  console.error(err)
  return c.json({ error: "Internal server error" }, 500 as ContentfulStatusCode)
})

mountAuthRoutes(app)

app.use("/api/public/*", authMiddleware)

const handler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      if (error instanceof AuthError) {
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

app.use("/api/public/*", async (c, next) => {
  const request = new Proxy(c.req.raw, {
    get(target, prop) {
      if (BODY_PARSER_METHODS.has(prop as BodyParserMethod)) {
        return () => c.req[prop as BodyParserMethod]()
      }
      return Reflect.get(target, prop, target)
    },
  })

  const { matched, response } = await handler.handle(request, {
    prefix: "/api/public",
    context: { user: c.get("user") },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  await next()
})

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

export default {
  port: serverPort,
  fetch: app.fetch,
}
