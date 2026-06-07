import { z } from "zod"

const schema = z.object({
  SERVER_PORT: z.coerce.number().default(4000),
})

const { SERVER_PORT } = schema.parse({
  SERVER_PORT: process.env["SERVER_PORT"],
})

export const serverPort = SERVER_PORT
