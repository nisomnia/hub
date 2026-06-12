import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { onError } from "@orpc/server"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { Hono } from "hono"

import { serverPort } from "env/ports"

import { router } from "./routers"

const app = new Hono()

const handler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
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
    context: {},
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
