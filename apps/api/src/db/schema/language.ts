import { pgEnum } from "drizzle-orm/pg-core"

import { LANGUAGE_TYPE } from "@/lib/validation/language"

export const languageEnum = pgEnum("language", LANGUAGE_TYPE)
