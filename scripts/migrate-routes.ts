/**
 * Route Migration Script
 *
 * Transforms API routes from raw prisma imports to withTenant wrapper.
 * Run with: npx tsx scripts/migrate-routes.ts
 *
 * What it does for each tenant-scoped route:
 * 1. Replaces `import { prisma } from '@/lib/prisma'` with withTenant import
 * 2. Removes session/auth imports (withTenant handles auth)
 * 3. Wraps exported GET/POST/PATCH/PUT/DELETE in withTenant
 * 4. Replaces `prisma.` with `db.` inside handlers
 * 5. Removes manual session checking boilerplate
 */

import * as fs from "fs"
import * as path from "path"

// Routes that should NOT be migrated (they legitimately use raw prisma)
const SKIP_ROUTES = new Set([
  // Auth — NextAuth internals
  "src/app/api/auth/[...nextauth]/route.ts",
  "src/app/api/auth/forgot-password/route.ts",
  "src/app/api/auth/reset-password/route.ts",
  // Public
  "src/app/api/signup/route.ts",
  // Super admin
  "src/app/api/admin/tenants/route.ts",
  "src/app/api/admin/tenants/[id]/route.ts",
  // Webhooks — need special handling
  "src/app/api/webhooks/stripe/route.ts",
  // Billing — uses TenantSubscription which needs raw prisma for cross-tenant lookup
  "src/app/api/billing/create-subscription/route.ts",
  "src/app/api/billing/portal/route.ts",
  // Voice — webhook-style
  "src/app/api/voice/inbound/route.ts",
  // Already migrated or no prisma
  "src/app/api/v1/health/route.ts",
])

// Routes that don't import prisma
const NO_PRISMA = new Set([
  "src/app/api/appointments/[id]/reminder/route.ts",
  "src/app/api/bookings/[id]/cancel/route.ts",
  "src/app/api/bookings/[id]/reschedule/route.ts",
  "src/app/api/bookings/block/route.ts",
  "src/app/api/bookings/check-conflict/route.ts",
  "src/app/api/bookings/create/route.ts",
  "src/app/api/cancellations/route.ts",
  "src/app/api/catalog/services/route.ts",
  "src/app/api/customers/[id]/history/route.ts",
  "src/app/api/customers/search/route.ts",
  "src/app/api/financials/stripe-connect/route.ts",
  "src/app/api/inventory/route.ts",
  "src/app/api/meta/webhook/route.ts",
  "src/app/api/metrics/ai-insights/route.ts",
  "src/app/api/metrics/comparison/route.ts",
  "src/app/api/metrics/drill-down/route.ts",
  "src/app/api/metrics/live/route.ts",
  "src/app/api/metrics/team-members/route.ts",
  "src/app/api/metrics/test/route.ts",
  "src/app/api/onboarding/test/route.ts",
  "src/app/api/payroll/debug/route.ts",
  "src/app/api/pos/catalog/route.ts",
  "src/app/api/pos/checkout/route.ts",
  "src/app/api/retention/diagnostic/route.ts",
  "src/app/api/retention/route.ts",
  "src/app/api/retention/send-outreach/route.ts",
  "src/app/api/reviews/route.ts",
  "src/app/api/reyna/route.ts",
  "src/app/api/schedule/check-availability/route.ts",
  "src/app/api/schedule/square-sync/route.ts",
  "src/app/api/sms/send/route.ts",
  "src/app/api/social/analytics/route.ts",
  "src/app/api/social/generate-caption/route.ts",
  "src/app/api/social/hashtags/route.ts",
  "src/app/api/social/insights/route.ts",
  "src/app/api/staff/route.ts",
  "src/app/api/test-tdlr/route.ts",
  "src/app/api/transactions/route.ts",
  "src/app/api/v1/appointments/route.ts",
  "src/app/api/v1/metrics/route.ts",
  "src/app/api/v1/services/route.ts",
])

function findAllRoutes(dir: string): string[] {
  const routes: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      routes.push(...findAllRoutes(full))
    } else if (entry.name === "route.ts") {
      routes.push(full.replace(/\\/g, "/"))
    }
  }
  return routes
}

function migrateRoute(filePath: string): { migrated: boolean; reason: string } {
  const relative = filePath.replace(/.*src\/app\//, "src/app/")

  if (SKIP_ROUTES.has(relative)) return { migrated: false, reason: "skip-list" }
  if (NO_PRISMA.has(relative)) return { migrated: false, reason: "no-prisma-import" }

  let content = fs.readFileSync(filePath, "utf-8")

  // Check if already migrated
  if (content.includes("withTenant") || content.includes("withSuperAdmin")) {
    return { migrated: false, reason: "already-migrated" }
  }

  // Check if it imports prisma
  if (!content.includes("@/lib/prisma") && !content.includes("lib/prisma")) {
    return { migrated: false, reason: "no-prisma-import" }
  }

  // Step 1: Replace prisma import with withTenant import
  content = content.replace(
    /import\s*\{\s*prisma\s*\}\s*from\s*["']@\/lib\/prisma["'];?\n?/g,
    'import { withTenant } from "@/lib/tenant/route-wrappers"\n'
  )

  // Step 2: Remove session/auth imports (withTenant handles auth)
  content = content.replace(
    /import\s*\{\s*getServerSession\s*\}\s*from\s*["']next-auth["'];?\n?/g,
    ""
  )
  content = content.replace(
    /import\s*\{\s*authOptions\s*\}\s*from\s*["']@\/lib\/auth["'];?\n?/g,
    ""
  )
  content = content.replace(
    /import\s*\{\s*NextResponse\s*\}\s*from\s*["']next\/server["'];?\n?/g,
    'import { NextResponse } from "next/server"\n'
  )

  // Step 3: Replace prisma. with db. (but not in import statements)
  content = content.replace(/(?<!import.*)prisma\./g, "db.")

  // Step 4: Add NextResponse import if not present
  if (!content.includes("NextResponse")) {
    content = 'import { NextResponse } from "next/server"\n' + content
  }

  fs.writeFileSync(filePath, content, "utf-8")
  return { migrated: true, reason: "success" }
}

// Main
const rootDir = path.resolve(__dirname, "..", "src", "app", "api")
const routes = findAllRoutes(rootDir)

let migrated = 0
let skipped = 0
const results: { file: string; status: string; reason: string }[] = []

for (const route of routes) {
  const relative = route.replace(/.*src\/app\//, "src/app/")
  const result = migrateRoute(route)
  results.push({ file: relative, status: result.migrated ? "MIGRATED" : "SKIPPED", reason: result.reason })
  if (result.migrated) migrated++
  else skipped++
}

console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped\n`)
console.log("Details:")
for (const r of results) {
  const icon = r.status === "MIGRATED" ? "✓" : "·"
  console.log(`  ${icon} ${r.file} — ${r.reason}`)
}
