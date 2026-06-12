import { resolve } from "node:path"
import { defineConfig } from "vite-plus"

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
  },
})
