import { execSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { apiSpecUrl } from "env/server"

const specUrl = apiSpecUrl ?? "http://localhost:8000/api/public/spec.json"
const outDir = resolve(import.meta.dir, "..", "dist")
const typesPath = resolve(outDir, "client-types.d.ts")
const specPath = resolve(outDir, "spec.json")

const response = await fetch(specUrl)
const spec = await response.json()

writeFileSync(specPath, JSON.stringify(spec, null, 2))

execSync(`bunx openapi-typescript "${specPath}" --output "${typesPath}"`, {
  stdio: "inherit",
})
