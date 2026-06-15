import { z } from "zod"

export const sharedSchema = {
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
}

export const serverSchema = {
  DATABASE_URL: z.string().min(1),
}

export const clientSchema = {
  PUBLIC_API_URL: z.string().min(1),
}

export const honoServerSchema = {
  ...sharedSchema,
  ...serverSchema,
  PUBLIC_API_URL: z.string().min(1).optional(),
  SERVER_PORT: z.coerce.number().default(4000),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URL: z.string().min(1).optional(),
}
