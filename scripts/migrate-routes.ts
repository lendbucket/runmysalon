/**
 * Route Migration Script — Drop-in tenant isolation
 *
 * Replaces `import { prisma } from "@/lib/prisma"` with getTenantPrisma()
 * and injects `const { db: prisma } = await getTenantPrisma()` at the top
 * of each exported handler function.
 *
 * Run: npx tsx scripts/migrate-routes.ts
 */
import * as fs from "fs"
import * as path from "path"

const SKIP = new Set([
  // Auth internals — do not touch
  "src/app/api/auth/[...nextauth]/route.ts",
  "src/app/api/auth/forgot-password/route.ts",
  "src/app/api/auth/reset-password/route.ts",
  // Public — no tenant context
  "src/app/api/signup/route.ts",
  "src/app/api/health/route.ts",
  "src/app/api/v1/health/route.ts",
  // Super admin — legitimately cross-tenant
  "src/app/api/admin/tenants/route.ts",
  "src/app/api/admin/tenants/[id]/route.ts",
  // Webhooks — tenant resolved from payload, not headers
  "src/app/api/webhooks/stripe/route.ts",
  // Voice inbound — webhook-style, tenant resolved from phone number
  "src/app/api/voice/inbound/route.ts",
  // Billing — uses TenantSubscription cross-tenant lookup
  "src/app/api/billing/create-subscription/route.ts",
  "src/app/api/billing/portal/route.ts",
])

function findRoutes(dir: string): string[] {
  const out: string[] = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...findRoutes(full))
    else if (e.name === "route.ts") out.push(full.replace(/\\/g, "/"))
  }
  return out
}

function normalize(p: string): string {
  return p.replace(/.*?src\/app\//, "src/app/")
}

function migrate(filePath: string): string {
  const rel = normalize(filePath)
  if (SKIP.has(rel)) return "SKIP"

  let src = fs.readFileSync(filePath, "utf-8")

  // Already migrated?
  if (src.includes("getTenantPrisma")) return "ALREADY"

  // No prisma import? Nothing to do.
  if (!src.includes("@/lib/prisma") && !src.includes("lib/prisma")) return "NO_PRISMA"

  // Step 1: Replace the prisma import line
  const hadPrisma = src.includes("from \"@/lib/prisma\"") || src.includes("from '@/lib/prisma'")
  if (!hadPrisma) return "NO_PRISMA"

  src = src.replace(
    /import\s*\{[^}]*prisma[^}]*\}\s*from\s*["']@\/lib\/prisma["'];?\s*\n/g,
    ""
  )

  // Step 2: Add getTenantPrisma import after the last import
  const lastImportIdx = src.lastIndexOf("\nimport ")
  if (lastImportIdx === -1) {
    // No imports? Add at top
    src = 'import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"\n' + src
  } else {
    const endOfImportLine = src.indexOf("\n", lastImportIdx + 1)
    src = src.slice(0, endOfImportLine + 1) +
      'import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"\n' +
      src.slice(endOfImportLine + 1)
  }

  // Step 3: Inject `const { db: prisma } = await getTenantPrisma()` at start of each handler
  // Match: export async function NAME(
  // Also match: export const NAME = async (
  src = src.replace(
    /export\s+async\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (match, name, args) => {
      return `export async function ${name}(${args}) {\n  const { db: prisma } = await getTenantPrisma()`
    }
  )

  fs.writeFileSync(filePath, src, "utf-8")
  return "MIGRATED"
}

// Main
const root = path.resolve(__dirname, "..", "src", "app", "api")
const routes = findRoutes(root).sort()
let migrated = 0, skipped = 0, noPrisma = 0, already = 0

for (const r of routes) {
  const rel = normalize(r)
  const result = migrate(r)
  const icon = result === "MIGRATED" ? "✓" : "·"
  if (result === "MIGRATED") migrated++
  else if (result === "SKIP") skipped++
  else if (result === "NO_PRISMA") noPrisma++
  else if (result === "ALREADY") already++
  console.log(`${icon} ${rel} — ${result}`)
}

console.log(`\nDone: ${migrated} migrated, ${skipped} skipped, ${noPrisma} no prisma, ${already} already done`)
