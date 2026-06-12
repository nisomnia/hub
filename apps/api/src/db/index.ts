import { drizzle } from "drizzle-orm/bun-sql"

import { databaseUrl } from "env/server"

import * as schema from "./schema"

export const db = drizzle(databaseUrl, { schema })
