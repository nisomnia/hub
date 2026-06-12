import { describe, expect, it, vi } from "vite-plus/test"

import {
  callHandler,
  createMockDb,
  genreFixture,
  movieFixture,
  movieGenreFixture,
  movieOverviewFixture,
  movieProductionCompanyFixture,
  overviewFixture,
  productionCompanyFixture,
} from "./fixtures"

let mockCallIndex = 0
let mockReturnValues: unknown[] = []

vi.mock("@/db", () => ({
  db: createMockDb(() => {
    const idx = mockCallIndex
    mockCallIndex++
    return (
      mockReturnValues[idx] ?? mockReturnValues[mockReturnValues.length - 1]
    )
  }),
}))

import { movieRouter } from "@/routers/movie"

const {
  movieById,
  movieBySlug,
  movieByTmdbId,
  movieLatest,
  movieLatestInfinite,
  movieByGenreId,
  movieByGenreIdInfinite,
  movieByProductionCompanyId,
  movieByProductionCompanyIdInfinite,
  movieRelatedInfinite,
  movieDashboard,
  movieSitemap,
  movieCount,
  movieCountDashboard,
  movieSearch,
  movieSearchDashboard,
  movieCreate,
  movieUpdate,
  movieUpdateWithoutChangeUpdatedDate,
  movieDelete,
} = movieRouter

describe("movieById", () => {
  it("returns movie detail when found", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [
      [m],
      [{ id: "ov_001", title: "Overview", language: "en", content: "Content" }],
      [{ id: "genre_001", title: "Action", slug: "action" }],
      [{ id: "pc_001", name: "Studio", logo: null }],
    ]
    const result = await callHandler(movieById, { id: "movie_001" })
    expect(result).toEqual({
      ...m,
      overview: "Content",
      overviews: [
        { id: "ov_001", title: "Overview", language: "en", content: "Content" },
      ],
      genres: [{ id: "genre_001", title: "Action", slug: "action" }],
      productionCompanies: [{ id: "pc_001", name: "Studio", logo: null }],
    })
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(movieById, { id: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("movieBySlug", () => {
  it("returns movie detail when found", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [
      [m],
      [{ id: "ov_001", title: "Overview", language: "en", content: "Content" }],
      [{ id: "genre_001", title: "Action", slug: "action" }],
      [{ id: "pc_001", name: "Studio", logo: null }],
    ]
    const result = await callHandler(movieBySlug, { slug: "test-movie" })
    expect(result).toEqual({
      ...m,
      overview: "Content",
      overviews: [
        { id: "ov_001", title: "Overview", language: "en", content: "Content" },
      ],
      genres: [{ id: "genre_001", title: "Action", slug: "action" }],
      productionCompanies: [{ id: "pc_001", name: "Studio", logo: null }],
    })
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(movieBySlug, { slug: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("movieByTmdbId", () => {
  it("returns movie when found", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(movieByTmdbId, { tmdbId: "12345" })
    expect(result).toEqual(m)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(movieByTmdbId, { tmdbId: "99999" })
    expect(result).toBeNull()
  })
})

describe("movieLatest", () => {
  it("returns paginated published movies ordered by updatedAt desc", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(movieLatest, { page: 1, perPage: 10 })
    expect(result).toEqual([m])
  })
})

describe("movieLatestInfinite", () => {
  it("returns movies without cursor and no overflow", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(movieLatestInfinite, { limit: 10 })
    expect(result.movies).toEqual([m])
    expect(result.nextCursor).toBeNull()
  })

  it("returns movies without cursor and overflow", async () => {
    const m1 = movieFixture()
    const m2 = movieFixture({ id: "movie_002" })
    mockCallIndex = 0
    mockReturnValues = [[m1, m2]]
    const result = await callHandler(movieLatestInfinite, { limit: 1 })
    expect(result.movies).toEqual([m1])
    expect(result.nextCursor).toEqual(m2.updatedAt)
  })

  it("returns movies with cursor and no overflow", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(movieLatestInfinite, {
      limit: 10,
      cursor: new Date("2026-06-01T00:00:00.000Z"),
    })
    expect(result.movies).toEqual([m])
    expect(result.nextCursor).toBeNull()
  })

  it("returns movies with cursor and overflow", async () => {
    const m1 = movieFixture()
    const m2 = movieFixture({ id: "movie_002" })
    mockCallIndex = 0
    mockReturnValues = [[m1, m2]]
    const result = await callHandler(movieLatestInfinite, {
      limit: 1,
      cursor: new Date("2026-06-01T00:00:00.000Z"),
    })
    expect(result.movies).toEqual([m1])
    expect(result.nextCursor).toEqual(m2.updatedAt)
  })
})

describe("movieByGenreId", () => {
  it("returns paginated movies for genre", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m }]]
    const result = await callHandler(movieByGenreId, {
      genreId: "genre_001",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([{ movie: m }])
  })
})

describe("movieByGenreIdInfinite", () => {
  it("returns movies without cursor and no overflow", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m }]]
    const result = await callHandler(movieByGenreIdInfinite, {
      genreId: "genre_001",
      limit: 10,
    })
    expect(result.movies).toEqual([m])
    expect(result.nextCursor).toBeNull()
  })

  it("returns movies without cursor and overflow", async () => {
    const m1 = movieFixture()
    const m2 = movieFixture({ id: "movie_002" })
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m1 }, { movie: m2 }]]
    const result = await callHandler(movieByGenreIdInfinite, {
      genreId: "genre_001",
      limit: 1,
    })
    expect(result.movies).toEqual([m1])
    expect(result.nextCursor).toEqual(m2.updatedAt)
  })

  it("returns movies with cursor and no overflow", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m }]]
    const result = await callHandler(movieByGenreIdInfinite, {
      genreId: "genre_001",
      limit: 10,
      cursor: new Date("2026-06-01T00:00:00.000Z"),
    })
    expect(result.movies).toEqual([m])
    expect(result.nextCursor).toBeNull()
  })

  it("returns movies with cursor and overflow", async () => {
    const m1 = movieFixture()
    const m2 = movieFixture({ id: "movie_002" })
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m1 }, { movie: m2 }]]
    const result = await callHandler(movieByGenreIdInfinite, {
      genreId: "genre_001",
      limit: 1,
      cursor: new Date("2026-06-01T00:00:00.000Z"),
    })
    expect(result.movies).toEqual([m1])
    expect(result.nextCursor).toEqual(m2.updatedAt)
  })
})

describe("movieByProductionCompanyId", () => {
  it("returns paginated movies for production company", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m }]]
    const result = await callHandler(movieByProductionCompanyId, {
      productionCompanyId: "pc_001",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([{ movie: m }])
  })
})

describe("movieByProductionCompanyIdInfinite", () => {
  it("returns movies without cursor and no overflow", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m }]]
    const result = await callHandler(movieByProductionCompanyIdInfinite, {
      productionCompanyId: "pc_001",
      limit: 10,
    })
    expect(result.movies).toEqual([m])
    expect(result.nextCursor).toBeNull()
  })

  it("returns movies without cursor and overflow", async () => {
    const m1 = movieFixture()
    const m2 = movieFixture({ id: "movie_002" })
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m1 }, { movie: m2 }]]
    const result = await callHandler(movieByProductionCompanyIdInfinite, {
      productionCompanyId: "pc_001",
      limit: 1,
    })
    expect(result.movies).toEqual([m1])
    expect(result.nextCursor).toEqual(m2.updatedAt)
  })

  it("returns movies with cursor and no overflow", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m }]]
    const result = await callHandler(movieByProductionCompanyIdInfinite, {
      productionCompanyId: "pc_001",
      limit: 10,
      cursor: new Date("2026-06-01T00:00:00.000Z"),
    })
    expect(result.movies).toEqual([m])
    expect(result.nextCursor).toBeNull()
  })

  it("returns movies with cursor and overflow", async () => {
    const m1 = movieFixture()
    const m2 = movieFixture({ id: "movie_002" })
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m1 }, { movie: m2 }]]
    const result = await callHandler(movieByProductionCompanyIdInfinite, {
      productionCompanyId: "pc_001",
      limit: 1,
      cursor: new Date("2026-06-01T00:00:00.000Z"),
    })
    expect(result.movies).toEqual([m1])
    expect(result.nextCursor).toEqual(m2.updatedAt)
  })
})

describe("movieRelatedInfinite", () => {
  it("returns related movies without cursor and no overflow", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m }]]
    const result = await callHandler(movieRelatedInfinite, {
      currentMovieId: "movie_001",
      genreId: "genre_001",
      limit: 10,
    })
    expect(result.movies).toEqual([m])
    expect(result.nextCursor).toBeNull()
  })

  it("returns related movies without cursor and overflow", async () => {
    const m1 = movieFixture()
    const m2 = movieFixture({ id: "movie_002" })
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m1 }, { movie: m2 }]]
    const result = await callHandler(movieRelatedInfinite, {
      currentMovieId: "movie_001",
      genreId: "genre_001",
      limit: 1,
    })
    expect(result.movies).toEqual([m1])
    expect(result.nextCursor).toEqual(m2.updatedAt)
  })

  it("returns related movies with cursor and no overflow", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m }]]
    const result = await callHandler(movieRelatedInfinite, {
      currentMovieId: "movie_001",
      genreId: "genre_001",
      limit: 10,
      cursor: new Date("2026-06-01T00:00:00.000Z"),
    })
    expect(result.movies).toEqual([m])
    expect(result.nextCursor).toBeNull()
  })

  it("returns related movies with cursor and overflow", async () => {
    const m1 = movieFixture()
    const m2 = movieFixture({ id: "movie_002" })
    mockCallIndex = 0
    mockReturnValues = [[{ movie: m1 }, { movie: m2 }]]
    const result = await callHandler(movieRelatedInfinite, {
      currentMovieId: "movie_001",
      genreId: "genre_001",
      limit: 1,
      cursor: new Date("2026-06-01T00:00:00.000Z"),
    })
    expect(result.movies).toEqual([m1])
    expect(result.nextCursor).toEqual(m2.updatedAt)
  })
})

describe("movieDashboard", () => {
  it("returns paginated movies ordered by updatedAt desc", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(movieDashboard, { page: 1, perPage: 10 })
    expect(result).toEqual([m])
  })
})

describe("movieSitemap", () => {
  it("returns paginated slug and updatedAt for published movies", async () => {
    const row = {
      slug: "test-movie",
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    }
    mockCallIndex = 0
    mockReturnValues = [[row]]
    const result = await callHandler(movieSitemap, { page: 1, perPage: 10 })
    expect(result).toEqual([row])
  })
})

describe("movieCount", () => {
  it("returns count of published movies", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 5 }]]
    const result = await callHandler(movieCount, {})
    expect(result).toBe(5)
  })

  it("returns 0 when no published movies", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(movieCount, {})
    expect(result).toBe(0)
  })
})

describe("movieCountDashboard", () => {
  it("returns count of all movies", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 10 }]]
    const result = await callHandler(movieCountDashboard, {})
    expect(result).toBe(10)
  })
})

describe("movieSearch", () => {
  it("returns matching published movies", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(movieSearch, {
      searchQuery: "Test",
      limit: 10,
    })
    expect(result).toEqual([m])
  })
})

describe("movieSearchDashboard", () => {
  it("returns matching movies regardless of status", async () => {
    const m = movieFixture({ status: "draft" })
    mockCallIndex = 0
    mockReturnValues = [[m]]
    const result = await callHandler(movieSearchDashboard, {
      searchQuery: "Test",
      limit: 10,
    })
    expect(result).toEqual([m])
  })
})

describe("movieCreate", () => {
  it("creates a movie without overview, genres, or companies", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[], [m]]
    const result = await callHandler(movieCreate, {
      title: "Test Movie",
      tmdbId: "12345",
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
      status: "published",
      metaTitle: "Test Movie Meta",
      metaDescription: "Test movie description",
    })
    expect(result).toEqual([m])
  })
})

describe("movieUpdate", () => {
  it("updates a movie without changing relations", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[m], undefined, undefined, undefined]
    const result = await callHandler(movieUpdate, {
      id: "movie_001",
      title: "Updated Movie",
      originalLanguage: "en",
    })
    expect(result).toEqual([m])
  })
})

describe("movieUpdateWithoutChangeUpdatedDate", () => {
  it("updates a movie without changing updatedAt", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [[m], undefined, undefined, undefined]
    const result = await callHandler(movieUpdateWithoutChangeUpdatedDate, {
      id: "movie_001",
      title: "Updated Movie",
      originalLanguage: "en",
    })
    expect(result).toEqual([m])
  })
})

describe("movieDelete", () => {
  it("deletes related records and the movie", async () => {
    const m = movieFixture()
    mockCallIndex = 0
    mockReturnValues = [undefined, undefined, undefined, [m]]
    const result = await callHandler(movieDelete, { id: "movie_001" })
    expect(result).toEqual([m])
  })
})
