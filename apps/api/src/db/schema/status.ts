import { pgEnum } from "drizzle-orm/pg-core"

import { STATUS_TYPE } from "@/lib/validation/status"

export const statusEnum = pgEnum("status", STATUS_TYPE)
