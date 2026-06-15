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

const adminContext = { user: userFixture({ role: "admin" }) }
const userContext = { user: userFixture() }

describe("userDashboard", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(userDashboard, { page: 1, perPage: 10 }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("returns paginated users", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(
      userDashboard,
      { page: 1, perPage: 10 },
      userContext,
    )
    expect(result).toEqual([u])
  })
})

describe("userById", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(userById, { id: "user_001" }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("returns user when found", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(userById, { id: "user_001" }, userContext)
    expect(result).toEqual(u)
  })

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(
      userById,
      { id: "nonexistent" },
      userContext,
    )
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

  it("returns null when not found", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(userByEmail, { email: "nope@example.com" })
    expect(result).toBeNull()
  })
})

describe("userByRole", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(userByRole, { role: "admin", page: 1, perPage: 10 }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(
        userByRole,
        { role: "admin", page: 1, perPage: 10 },
        userContext,
      ),
    ).rejects.toThrow("Admin access required")
  })

  it("returns users by role", async () => {
    const u = userFixture({ role: "admin" })
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(
      userByRole,
      {
        role: "admin",
        page: 1,
        perPage: 10,
      },
      adminContext,
    )
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

  it("returns empty array when no matches", async () => {
    mockCallIndex = 0
    mockReturnValues = [[]]
    const result = await callHandler(userSearch, {
      searchQuery: "nomatch",
      limit: 10,
    })
    expect(result).toEqual([])
  })
})

describe("userUpdate", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(userUpdate, { id: "user_001", name: "New" }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws when user tries to update another profile", async () => {
    await expect(
      callHandler(
        userUpdate,
        {
          id: "user_001",
          name: "New",
        },
        { user: userFixture({ id: "user_002" }) },
      ),
    ).rejects.toThrow("You can only update your own profile")
  })

  it("updates user without username", async () => {
    const u = userFixture({ name: "Updated" })
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(
      userUpdate,
      {
        id: "user_001",
        name: "Updated",
      },
      userContext,
    )
    expect(result).toEqual([u])
  })

  it("updates user with unique username", async () => {
    const u = userFixture({ username: "newusername" })
    mockCallIndex = 0
    mockReturnValues = [[], [u]]
    const result = await callHandler(
      userUpdate,
      {
        id: "user_001",
        username: "newusername",
      },
      userContext,
    )
    expect(result).toEqual([u])
  })

  it("throws when username already exists", async () => {
    const existing = userFixture({ username: "taken", id: "user_999" })
    mockCallIndex = 0
    mockReturnValues = [[existing]]
    await expect(
      callHandler(
        userUpdate,
        {
          id: "user_001",
          username: "taken",
        },
        userContext,
      ),
    ).rejects.toThrow("Username already exists")
  })
})

describe("userUpdateByAdmin", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(userUpdateByAdmin, { id: "user_001", name: "New" }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(
        userUpdateByAdmin,
        { id: "user_001", name: "New" },
        userContext,
      ),
    ).rejects.toThrow("Admin access required")
  })

  it("updates user with unique username", async () => {
    const u = userFixture({ username: "newusername" })
    mockCallIndex = 0
    mockReturnValues = [[], [u]]
    const result = await callHandler(
      userUpdateByAdmin,
      {
        id: "user_001",
        username: "newusername",
      },
      adminContext,
    )
    expect(result).toEqual([u])
  })

  it("throws when username already exists", async () => {
    const existing = userFixture({ username: "taken", id: "user_999" })
    mockCallIndex = 0
    mockReturnValues = [[existing]]
    await expect(
      callHandler(
        userUpdateByAdmin,
        {
          id: "user_001",
          username: "taken",
        },
        adminContext,
      ),
    ).rejects.toThrow("Username already exists")
  })
})

describe("userDelete", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(userDelete, { id: "user_001" }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws when user tries to delete another account", async () => {
    await expect(
      callHandler(
        userDelete,
        { id: "user_001" },
        { user: userFixture({ id: "user_002" }) },
      ),
    ).rejects.toThrow("You can only delete your own account")
  })

  it("deletes own user", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(
      userDelete,
      { id: "user_001" },
      userContext,
    )
    expect(result).toEqual([u])
  })
})

describe("userDeleteByAdmin", () => {
  it("throws when unauthenticated", async () => {
    await expect(
      callHandler(userDeleteByAdmin, { id: "user_001" }, null),
    ).rejects.toThrow("Authentication required")
  })

  it("throws for non-admin user", async () => {
    await expect(
      callHandler(userDeleteByAdmin, { id: "user_001" }, userContext),
    ).rejects.toThrow("Admin access required")
  })

  it("deletes user regardless of currentUserId", async () => {
    const u = userFixture()
    mockCallIndex = 0
    mockReturnValues = [[u]]
    const result = await callHandler(
      userDeleteByAdmin,
      { id: "user_001" },
      adminContext,
    )
    expect(result).toEqual([u])
  })
})
