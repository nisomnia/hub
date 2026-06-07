import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { productionCompanies } from "../db/schema/production-company"
import { STATUS_TYPE } from "../db/schema/status"

export const createProductionCompanySchema = createInsertSchema(
  productionCompanies,
)
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    tmdbId: z.string({
      message: "TMDB ID is required",
    }),
    name: z
      .string({
        message: "Name is required",
      })
      .min(1),
    logo: z
      .string({
        message: "Logo must be a string",
      })
      .optional(),
    originCountry: z
      .string({
        message: "Origin Country must be a string",
      })
      .optional(),
    description: z
      .string({
        message: "Description must be a string",
      })
      .optional(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
    metaTitle: z
      .string({
        message: "Meta Title must be a string",
      })
      .optional(),
    metaDescription: z
      .string({
        message: "Meta Description must be a string",
      })
      .optional(),
  })

export const updateProductionCompanySchema = createInsertSchema(
  productionCompanies,
)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string({
      message: "Id is required",
    }),
    slug: z
      .string({
        message: "Slug is required",
      })
      .regex(new RegExp(/^[a-zA-Z0-9_-]*$/), {
        message: "Slug should be character a-z, A-Z, number, - and _",
      }),
    tmdbId: z.string({
      message: "TMDB ID is required",
    }),
    name: z
      .string({
        message: "Name is required",
      })
      .min(1),
    logo: z
      .string({
        message: "Logo must be a string",
      })
      .optional(),
    originCountry: z
      .string({
        message: "Origin Country must be a string",
      })
      .optional(),
    description: z
      .string({
        message: "Description must be a string",
      })
      .optional(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
    metaTitle: z
      .string({
        message: "Meta Title must be a string",
      })
      .optional(),
    metaDescription: z
      .string({
        message: "Meta Description must be a string",
      })
      .optional(),
  })

export type CreateProductionCompany = z.infer<
  typeof createProductionCompanySchema
>
export type UpdateProductionCompany = z.infer<
  typeof updateProductionCompanySchema
>
