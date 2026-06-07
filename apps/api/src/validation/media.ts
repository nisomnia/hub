import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { MEDIA_CATEGORY, MEDIA_TYPE, medias } from "../db/schema/media"

export const mediaCategory = z.enum(MEDIA_CATEGORY)
export const mediaType = z.enum(MEDIA_TYPE)

const MAX_FILE_SIZE = 500000

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

const mediaImageUpload = {
  image: z
    .any()
    .refine((files) => files?.length === 0, "Image is required.")
    .refine(
      (files) => files?.[0]?.size >= MAX_FILE_SIZE,
      `Max file size is 5MB.`,
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type as string),
      ".jpg, .jpeg, .png and .webp files are accepted.",
    ),
}

export const createMediaSchema = createInsertSchema(medias)
  .omit({
    id: true,
    authorId: true,
    createdAt: true,
    updatedAt: true,
    type: true,
  })
  .extend({
    description: z
      .string({
        message: "Description must be a string",
      })
      .optional(),
  })

export const uploadImageMediaSchema = z.object({
  ...mediaImageUpload,
})

export const updateMediaSchema = createInsertSchema(medias)
  .omit({
    createdAt: true,
    updatedAt: true,
    name: true,
    url: true,
    fileType: true,
    category: true,
    type: true,
    authorId: true,
  })
  .extend({
    id: z.string({
      message: "ID must be a string",
    }),
    description: z
      .string({
        message: "Description must be a string",
      })
      .optional(),
  })

export type CreateMediaSchema = z.infer<typeof createMediaSchema>
export type UpdateMediaSchema = z.infer<typeof updateMediaSchema>
export type MediaCategory = z.infer<typeof mediaCategory>
export type MediaType = z.infer<typeof mediaType>
