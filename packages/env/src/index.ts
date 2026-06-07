import { createEnv } from "@t3-oss/env-core"

import { clientSchema, serverSchema, sharedSchema } from "./schema.ts"

export const env = createEnv({
  shared: sharedSchema,
  server: serverSchema,
  clientPrefix: "PUBLIC_",
  client: clientSchema,
  runtimeEnv: {
    APP_ENV: process.env["APP_ENV"] ?? "development",
    DATABASE_URL: process.env["DATABASE_URL"],
    PUBLIC_API_URL: process.env["PUBLIC_API_URL"] ?? "",
  },
  skipValidation:
    !!process.env["CI"] || process.env["npm_lifecycle_event"] === "lint",
})
