import { call } from "@orpc/server"

export function createMockDb<T>(getValue: () => T): unknown {
  const proxy: unknown = new Proxy(() => proxy, {
    get(_target: unknown, prop: string) {
      if (prop === "then")
        return (resolve: (value: unknown) => void) => resolve(getValue())
      if (prop === "transaction")
        return (fn: (...args: unknown[]) => unknown) => fn(proxy)
      return proxy
    },
    apply(_target: unknown, _thisArg: unknown, _args: unknown[]) {
      return proxy
    },
  })
  return proxy
}

export function callHandler(
  procedure: Parameters<typeof call>[0],
  input: Record<string, unknown>,
) {
  return call(procedure, input)
}

export function adFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "ad_001",
    title: "Test Ad",
    content: "Ad content here",
    position: "home_below_header",
    type: "plain_ad",
    active: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function genreFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "genre_001",
    tmdbId: "28",
    title: "Action",
    slug: "action",
    description: "Action genre",
    metaTitle: "Action",
    metaDescription: "Action movies",
    featuredImage: null,
    status: "published",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function productionCompanyFixture(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "pc_001",
    tmdbId: "1",
    name: "Test Studio",
    slug: "test-studio",
    logo: null,
    originCountry: "US",
    description: "A test production company",
    metaTitle: "Test Studio",
    metaDescription: "Test Studio description",
    status: "published",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function userFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_001",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    image: null,
    phoneNumber: null,
    about: null,
    role: "user",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function articleCommentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "comment_001",
    content: "Test comment",
    replyToId: null,
    articleId: "article_001",
    authorId: "user_001",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function mediaFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "media_001",
    name: "test-image.jpg",
    url: "https://example.com/test.jpg",
    fileType: "jpg",
    category: "article",
    type: "image",
    description: "Test media",
    authorId: "user_001",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function topicFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "topic_001",
    language: "id",
    title: "Test Topic",
    slug: "test-topic",
    description: "Test topic description",
    status: "published",
    visibility: "public",
    metaTitle: "Test Topic",
    metaDescription: "Test topic meta",
    topicTranslationId: "tt_001",
    featuredImage: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function topicTranslationFixture(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "tt_001",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function articleFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "article_001",
    language: "id",
    title: "Test Article",
    slug: "test-article",
    content: "Article content here",
    excerpt: "Short excerpt",
    metaTitle: "Test Article Meta",
    metaDescription: "Test article description",
    status: "published",
    visibility: "public",
    articleTranslationId: "at_001",
    featuredImage: "https://example.com/img.jpg",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function articleTranslationFixture(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "at_001",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function articleTopicFixture(overrides: Record<string, unknown> = {}) {
  return {
    articleId: "article_001",
    topicId: "topic_001",
    ...overrides,
  }
}

export function articleAuthorFixture(overrides: Record<string, unknown> = {}) {
  return {
    articleId: "article_001",
    userId: "user_001",
    ...overrides,
  }
}

export function articleEditorFixture(overrides: Record<string, unknown> = {}) {
  return {
    articleId: "article_001",
    userId: "user_001",
    ...overrides,
  }
}

export function feedFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "feed_001",
    title: "Test Feed",
    slug: "test-feed",
    language: "id",
    featuredImage: null,
    link: "https://example.com/feed",
    type: "website",
    owner: "Test Owner",
    status: "published",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function feedTopicFixture(overrides: Record<string, unknown> = {}) {
  return {
    feedId: "feed_001",
    topicId: "topic_001",
    ...overrides,
  }
}

export function movieFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "movie_001",
    imdbId: "tt1234567",
    tmdbId: "12345",
    title: "Test Movie",
    originalTitle: "Test Movie Original",
    tagline: "Best movie ever",
    slug: "test-movie",
    airingStatus: "released",
    originCountry: "US",
    originalLanguage: "en",
    spokenLanguages: "en,id",
    releaseDate: "2026-01-01",
    revenue: 1000000,
    runtime: 120,
    budget: 500000,
    homepage: "https://example.com",
    backdrop: null,
    poster: null,
    metaTitle: "Test Movie Meta",
    metaDescription: "Test movie description",
    status: "published",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

export function movieGenreFixture(overrides: Record<string, unknown> = {}) {
  return {
    movieId: "movie_001",
    genreId: "genre_001",
    ...overrides,
  }
}

export function movieOverviewFixture(overrides: Record<string, unknown> = {}) {
  return {
    movieId: "movie_001",
    overviewId: "overview_001",
    ...overrides,
  }
}

export function movieProductionCompanyFixture(
  overrides: Record<string, unknown> = {},
) {
  return {
    movieId: "movie_001",
    productionCompanyId: "pc_001",
    ...overrides,
  }
}

export function overviewFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "overview_001",
    title: "Test Overview",
    content: "Overview content",
    type: "movie",
    language: "id",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}
