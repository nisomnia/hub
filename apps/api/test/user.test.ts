import { describe, expect, it, vi } from "vite-plus/test"

import { callHandler, createMockDb, userFixture } from "./fixtures"

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

import { userRouter } from "@/routers/user"

const {
  userDashboard,
  userById,
  userByUsername,
  userByEmail,
  userByRole,
  userCount,
  userSearch,
  userUpdate,
  userUpdateByAdmin,
  userDelete,
  userDeleteByAdmin,
} = userRouter

describe("userDashboard", () => {
  it("returns paginated users", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userDashboard, { page: 1, perPage: 10 })
    expect(result).toEqual([u])
  })
})

describe("userById", () => {
  it("returns user when found", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userById, { id: "user_001" })
    expect(result).toEqual(u)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(userById, { id: "nonexistent" })
    expect(result).toBeNull()
  })
})

describe("userByUsername", () => {
  it("returns user by username", async () => {
    const u = userFixture({ username: "testuser" })
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userByUsername, { username: "testuser" })
    expect(result).toEqual(u)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(userByUsername, { username: "nope" })
    expect(result).toBeNull()
  })
})

describe("userByEmail", () => {
  it("returns user by email", async () => {
    const u = userFixture({ email: "test@example.com" })
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userByEmail, { email: "test@example.com" })
    expect(result).toEqual(u)
  })
})

describe("userByRole", () => {
  it("returns users by role", async () => {
    const u = userFixture({ role: "admin" })
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userByRole, {
      role: "admin",
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual([u])
  })
})

describe("userCount", () => {
  it("returns total user count", async () => {
    mockCallIndex = 0
    mockReturnValues = [[{ value: 42 }]]
    const result = await callHandler(userCount, {})
    expect(result).toBe(42)
  })
})

describe("userSearch", () => {
  it("returns users matching query", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userSearch, {
      searchQuery: "test",
      limit: 10,
    })
    expect(result).toEqual([u])
  })
})

describe("userUpdate", () => {
  it("throws when currentUserId does not match id", async () => {
    await expect(
      callHandler(userUpdate, {
        id: "user_001",
        currentUserId: "user_002",
        name: "New",
      }),
    ).rejects.toThrow("Unauthorized")
  })

  it("updates user without username", async () => {
    const u = userFixture({ name: "Updated" })
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userUpdate, {
      id: "user_001",
      currentUserId: "user_001",
      name: "Updated",
    })
    expect(result).toEqual([u])
  })

  it("updates user with unique username", async () => {
    const u = userFixture({ username: "newusername" })
    mockCallIndex = 0
    mockReturnValues = [[], [u]]
    const result = await callHandler(userUpdate, {
      id: "user_001",
      currentUserId: "user_001",
      username: "newusername",
    })
    expect(result).toEqual([u])
  })

  it("throws when username already exists", async () => {
    const existing = userFixture({ username: "taken", id: "user_999" })
    mockCallIndex = 0
    mockReturnValues = [[existing]]
    await expect(
      callHandler(userUpdate, {
        id: "user_001",
        currentUserId: "user_001",
        username: "taken",
      }),
    ).rejects.toThrow("Username already exists")
  })
})

describe("userUpdateByAdmin", () => {
  it("updates user with unique username", async () => {
    const u = userFixture({ username: "newusername" })
    mockCallIndex = 0
    mockReturnValues = [[], [u]]
    const result = await callHandler(userUpdateByAdmin, {
      id: "user_001",
      username: "newusername",
    })
    expect(result).toEqual([u])
  })

  it("throws when username already exists", async () => {
    const existing = userFixture({ username: "taken", id: "user_999" })
    mockCallIndex = 0
    mockReturnValues = [[existing]]
    await expect(
      callHandler(userUpdateByAdmin, {
        id: "user_001",
        username: "taken",
      }),
    ).rejects.toThrow("Username already exists")
  })
})

describe("userDelete", () => {
  it("throws when currentUserId does not match id", async () => {
    await expect(
      callHandler(userDelete, { id: "user_001", currentUserId: "user_002" }),
    ).rejects.toThrow("Unauthorized")
  })

  it("deletes own user", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userDelete, {
      id: "user_001",
      currentUserId: "user_001",
    })
    expect(result).toEqual([u])
  })
})

describe("userDeleteByAdmin", () => {
  it("deletes user regardless of currentUserId", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userDeleteByAdmin, { id: "user_001" })
    expect(result).toEqual([u])
  })
})
