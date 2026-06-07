import { z } from "zod"

const MAX_FILE_SIZE = 500000

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]
export const MEDIA_CATEGORY = [
  "all",
  "article",
  "feed",
  "topic",
  "genre",
  "review",
  "tutorial",
  "movie",
  "tv",
  "game",
  "production_company",
] as const

export const MEDIA_TYPE = [
  "image",
  "audio",
  "video",
  "document",
  "other",
] as const

export const mediaCategory = z.enum(MEDIA_CATEGORY)
export const mediaType = z.enum(MEDIA_TYPE)

export const mediaInput = {
  name: z.string({
    invalid_type_error: "Name must be a string",
    required_error: "Name Required",
  }),
  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .optional(),
  url: z.string({
    invalid_type_error: "Url must be a string",
    required_error: "Url Required",
  }),
  category: z
    .enum(MEDIA_CATEGORY, {
      invalid_type_error:
        "only article, topic, review ,tutorial, movie, tv, game, genre, production_company, are accepted",
    })
    .optional(),
  fileType: z.string({
    invalid_type_error: "FileType must be a string",
    required_error: "FileType Required",
  }),
}

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

export const createMediaSchema = z.object({
  ...mediaInput,
})

export const uploadImageMediaSchema = z.object({
  ...mediaImageUpload,
})

export const updateMediaSchema = z.object({
  id: z.string({
    invalid_type_error: "ID must be a string",
    required_error: "ID Required",
  }),
  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .optional(),
})

export type CreateMediaSchema = z.infer<typeof createMediaSchema>
export type UpdateMediaSchema = z.infer<typeof updateMediaSchema>
export type MediaCategory = z.infer<typeof mediaCategory>
export type MediaType = z.infer<typeof mediaType>
