import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { databaseUrl } from "env/server"

import * as schema from "./schema"

const queryClient = postgres(databaseUrl)

export const db = drizzle(queryClient, { schema })
