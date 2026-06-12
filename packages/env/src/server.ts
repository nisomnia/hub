import { z } from "zod"

import { honoServerSchema } from "./schema"

const skipValidation =
  !!process.env["CI"] || process.env["npm_lifecycle_event"] === "lint"

const schema = z.object(honoServerSchema)

type EnvData = z.infer<typeof schema>

const parsed = skipValidation
  ? { success: true as const, data: process.env as unknown as EnvData }
  : schema.safeParse(process.env)

if (!parsed.success) {
  const formatted = (
    parsed as { success: false; error: z.ZodError }
  ).error.flatten().fieldErrors
  const missing = Object.entries(formatted)
    .map(([key, errors]) => `  ${key}: ${(errors as string[])?.join(", ")}`)
    .join("\n")
  throw new Error(`[env] Missing or invalid environment variables:\n${missing}`)
}

export const honoEnv = parsed.data

export const appEnv = parsed.data.APP_ENV
export const databaseUrl = parsed.data.DATABASE_URL
export const apiUrl = parsed.data.PUBLIC_API_URL
export const serverPort = parsed.data.SERVER_PORT
