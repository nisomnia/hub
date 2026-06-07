import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { USER_ROLE, users } from "../db/schema/user"

export const userRole = z.enum(USER_ROLE)

export const updateUserSchema = createInsertSchema(users)
  .omit({
    email: true,
    image: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string({
      message: "User ID is required",
    }),
    username: z
      .string({
        message: "Username is required",
      })
      .trim()
      .regex(new RegExp(/^[a-z0-9]{3,16}$/), {
        message:
          "Username should be 3-20 characters without spaces, symbol or any special characters.",
      })
      .min(3),
    name: z
      .string({
        message: "Name is required",
      })
      .min(1),
    phoneNumber: z
      .string({ message: "Phone Number must be a string" })
      .nullish(),
    about: z.string({ message: "About must be a string" }).nullish(),
  })

export const updateUserByAdminSchema = createInsertSchema(users)
  .omit({
    email: true,
    image: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string({
      message: "User ID is required",
    }),
    username: z
      .string({
        message: "Username is required",
      })
      .trim()
      .regex(new RegExp(/^[a-z0-9]{3,16}$/), {
        message:
          "Username should be 3-20 characters without spaces, symbol or any special characters.",
      })
      .min(3),
    name: z
      .string({
        message: "Name is required",
      })
      .min(1),
    phoneNumber: z
      .string({ message: "Phone Number must be a string" })
      .nullish(),
    about: z.string({ message: "About must be a string" }).nullish(),
    role: z.enum(USER_ROLE, {
      message: "only user, member, author, and admin are accepted",
    }),
  })

export type UpdateUserSchema = z.infer<typeof updateUserSchema>
export type UserRole = z.infer<typeof userRole>
