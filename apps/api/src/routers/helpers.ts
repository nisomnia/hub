import { z } from "zod"

export const idInputSchema = z.object({ id: z.string() })

export const pageSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).default(10),
})

export const searchSchema = z.object({
  searchQuery: z.string(),
  limit: z.number().int().min(1).default(10),
})

export const infiniteSchema = z.object({
  limit: z.number().int().min(1).default(50),
  cursor: z.coerce.date().nullable().optional(),
})

export function offsetFromPage(input: z.infer<typeof pageSchema>): number {
  return (input.page - 1) * input.perPage
}

export function firstOrNull<T>(data: T[]): T | null {
  return data[0] ?? null
}

export function firstValue(data: { value: number }[]): number {
  return data[0]?.value ?? 0
}
