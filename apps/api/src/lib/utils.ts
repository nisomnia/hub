import { customAlphabet } from "nanoid"

export const cuid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  40,
)

export function trimText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "..."
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/_/g, "-")
    .replace(/--+/g, "-")
    .replace(/-$/g, "")
}

import { eq } from "drizzle-orm"

import { db } from "@/db/index"
import { articles } from "@/db/schema/article"
import { feeds } from "@/db/schema/feed"
import { genres } from "@/db/schema/genre"
import { movies } from "@/db/schema/movie"
import { productionCompanies } from "@/db/schema/production-company"
import { topics } from "@/db/schema/topic"

export async function generateUniqueArticleSlug(text: string): Promise<string> {
  const base = slugify(text)
  let slug = base
  let suffix = 1

  while (
    (await db.select().from(articles).where(eq(articles.slug, slug)).limit(1))
      .length > 0
  ) {
    suffix++
    slug = `${base}-${suffix}`
  }

  return slug
}

export async function generateUniqueGenreSlug(text: string): Promise<string> {
  const base = slugify(text)
  let slug = base
  let suffix = 1

  while (
    (await db.select().from(genres).where(eq(genres.slug, slug)).limit(1))
      .length > 0
  ) {
    suffix++
    slug = `${base}-${suffix}`
  }

  return slug
}

export async function generateUniqueFeedSlug(text: string): Promise<string> {
  const base = slugify(text)
  let slug = base
  let suffix = 1

  while (
    (await db.select().from(feeds).where(eq(feeds.slug, slug)).limit(1))
      .length > 0
  ) {
    suffix++
    slug = `${base}-${suffix}`
  }

  return slug
}

export async function generateUniqueMovieSlug(text: string): Promise<string> {
  const base = slugify(text)
  let slug = base
  let suffix = 1

  while (
    (await db.select().from(movies).where(eq(movies.slug, slug)).limit(1))
      .length > 0
  ) {
    suffix++
    slug = `${base}-${suffix}`
  }

  return slug
}

export async function generateUniqueProductionCompanySlug(
  text: string,
): Promise<string> {
  const base = slugify(text)
  let slug = base
  let suffix = 1

  while (
    (
      await db
        .select()
        .from(productionCompanies)
        .where(eq(productionCompanies.slug, slug))
        .limit(1)
    ).length > 0
  ) {
    suffix++
    slug = `${base}-${suffix}`
  }

  return slug
}

export async function generateUniqueTopicSlug(text: string): Promise<string> {
  const base = slugify(text)
  let slug = base
  let suffix = 1

  while (
    (await db.select().from(topics).where(eq(topics.slug, slug)).limit(1))
      .length > 0
  ) {
    suffix++
    slug = `${base}-${suffix}`
  }

  return slug
}
