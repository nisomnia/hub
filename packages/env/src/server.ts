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
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of (parsed as { success: false; error: z.ZodError }).error
    .issues) {
    const key = issue.path.join(".")
    if (!fieldErrors[key]) fieldErrors[key] = []
    fieldErrors[key].push(issue.message)
  }
  const missing = Object.entries(fieldErrors)
    .map(([key, errors]) => `  ${key}: ${errors.join(", ")}`)
    .join("\n")
  throw new Error(`[env] Missing or invalid environment variables:\n${missing}`)
}

export const honoEnv = parsed.data

export const appEnv = parsed.data.APP_ENV
export const databaseUrl = parsed.data.DATABASE_URL
export const apiUrl = parsed.data.PUBLIC_API_URL
export const serverPort = parsed.data.SERVER_PORT
