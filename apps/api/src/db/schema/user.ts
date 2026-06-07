import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"

import { articleAuthors, articleEditors } from "./article"

export const USER_ROLE = ["user", "member", "author", "admin"] as const

export const userRole = z.enum(USER_ROLE)

export const userRoleEnum = pgEnum("user_role", USER_ROLE)

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  username: text("username").notNull().unique(),
  image: text("image"),
  phoneNumber: text("phone_number"),
  about: text("about"),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertUserSchema = createInsertSchema(users)
export const updateUserSchema = createUpdateSchema(users)

export const accounts = pgTable("accounts", {
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id")
    .notNull()
    .unique()
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertAccountSchema = createInsertSchema(accounts)
export const updateAccountSchema = createUpdateSchema(accounts)

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
})

export const insertSessionSchema = createInsertSchema(sessions)
export const updateSessionSchema = createUpdateSchema(sessions)

export const usersRelations = relations(users, ({ many }) => ({
  articleAuthors: many(articleAuthors),
  articleEditors: many(articleEditors),
}))

export type InsertUser = typeof users.$inferInsert
export type SelectUser = typeof users.$inferSelect
export type SelectSession = typeof sessions.$inferSelect

export type InsertAccount = typeof accounts.$inferInsert
export type SelectAccount = typeof accounts.$inferSelect

export type InsertSession = typeof sessions.$inferInsert

export type UserRole = z.infer<typeof userRole>
