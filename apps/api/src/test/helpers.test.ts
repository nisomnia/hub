import { describe, expect, it } from "vite-plus/test"

import {
  firstOrNull,
  firstValue,
  idInputSchema,
  infiniteSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "@/routers/helpers"

describe("offsetFromPage", () => {
  it("returns 0 for page 1 with perPage 10", () => {
    expect(offsetFromPage({ page: 1, perPage: 10 })).toBe(0)
  })

  it("returns 10 for page 2 with perPage 10", () => {
    expect(offsetFromPage({ page: 2, perPage: 10 })).toBe(10)
  })

  it("returns 100 for page 3 with perPage 50", () => {
    expect(offsetFromPage({ page: 3, perPage: 50 })).toBe(100)
  })

  it("returns 0 for page 1 with any perPage", () => {
    expect(offsetFromPage({ page: 1, perPage: 100 })).toBe(0)
  })
})

describe("firstOrNull", () => {
  it("returns first element of non-empty array", () => {
    expect(firstOrNull([1, 2, 3])).toBe(1)
  })

  it("returns null for empty array", () => {
    expect(firstOrNull([])).toBeNull()
  })

  it("returns first element of single-element array", () => {
    expect(firstOrNull(["only"])).toBe("only")
  })
})

describe("firstValue", () => {
  it("returns value of first element", () => {
    expect(firstValue([{ value: 42 }, { value: 99 }])).toBe(42)
  })

  it("returns 0 for empty array", () => {
    expect(firstValue([])).toBe(0)
  })

  it("returns 0 when value is 0", () => {
    expect(firstValue([{ value: 0 }])).toBe(0)
  })
})

describe("idInputSchema", () => {
  it("parses valid string id", () => {
    expect(idInputSchema.parse({ id: "abc" })).toEqual({ id: "abc" })
  })

  it("rejects missing id", () => {
    expect(() => idInputSchema.parse({})).toThrow()
  })

  it("rejects non-string id", () => {
    expect(() => idInputSchema.parse({ id: 123 })).toThrow()
  })
})

describe("pageSchema", () => {
  it("applies defaults for empty input", () => {
    expect(pageSchema.parse({})).toEqual({ page: 1, perPage: 10 })
  })

  it("parses explicit page and perPage", () => {
    expect(pageSchema.parse({ page: 3, perPage: 25 })).toEqual({
      page: 3,
      perPage: 25,
    })
  })

  it("rejects page below 1", () => {
    expect(() => pageSchema.parse({ page: 0 })).toThrow()
  })

  it("rejects perPage below 1", () => {
    expect(() => pageSchema.parse({ perPage: 0 })).toThrow()
  })
})

describe("searchSchema", () => {
  it("parses with defaults", () => {
    expect(searchSchema.parse({ searchQuery: "test" })).toEqual({
      searchQuery: "test",
      limit: 10,
    })
  })

  it("parses explicit limit", () => {
    expect(searchSchema.parse({ searchQuery: "test", limit: 5 })).toEqual({
      searchQuery: "test",
      limit: 5,
    })
  })

  it("rejects without searchQuery", () => {
    expect(() => searchSchema.parse({})).toThrow()
  })
})

describe("infiniteSchema", () => {
  it("parses with defaults", () => {
    const parsed = infiniteSchema.parse({ limit: 10 })
    expect(parsed.cursor).toBeUndefined()
    expect(parsed.limit).toBe(10)
  })

  it("coerces string date cursor", () => {
    const result = infiniteSchema.parse({
      limit: 20,
      cursor: "2026-01-01T00:00:00.000Z",
    })
    expect(result.cursor).toBeInstanceOf(Date)
  })

  it("allows null cursor", () => {
    expect(infiniteSchema.parse({ limit: 30, cursor: null })).toEqual({
      limit: 30,
      cursor: null,
    })
  })

  it("rejects limit below 1", () => {
    expect(() => infiniteSchema.parse({ limit: 0 })).toThrow()
  })
})
