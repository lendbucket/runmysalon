/**
 * Tenant Isolation Test
 *
 * Creates two test tenants, seeds data in each, then verifies that
 * tenantDb() properly isolates queries between them.
 *
 * Run: npx tsx scripts/test-tenant-isolation.ts
 */

import assert from "assert"

async function main() {
  const { PrismaClient } = await import("@prisma/client")
  const prisma = new PrismaClient()

  // Dynamic import to test the actual tenantDb implementation
  const { tenantDb } = await import("../src/lib/tenant/prisma")

  const TENANT_A_SLUG = "iso-test-a-" + Date.now()
  const TENANT_B_SLUG = "iso-test-b-" + Date.now()

  let tenantA: any
  let tenantB: any

  try {
    console.log("1. Creating test tenants...")
    tenantA = await prisma.tenant.create({
      data: { slug: TENANT_A_SLUG, name: "Isolation Test A", ownerEmail: "test-a@test.com", status: "ACTIVE" },
    })
    tenantB = await prisma.tenant.create({
      data: { slug: TENANT_B_SLUG, name: "Isolation Test B", ownerEmail: "test-b@test.com", status: "ACTIVE" },
    })
    console.log(`   Tenant A: ${tenantA.id} (${TENANT_A_SLUG})`)
    console.log(`   Tenant B: ${tenantB.id} (${TENANT_B_SLUG})`)

    console.log("\n2. Creating test clients...")
    const clientA = await prisma.client.create({
      data: {
        tenantId: tenantA.id,
        squareCustomerId: `test-sq-a-${Date.now()}`,
        firstName: "Alice",
        lastName: "TestA",
        email: "alice@testa.com",
      },
    })
    const clientB = await prisma.client.create({
      data: {
        tenantId: tenantB.id,
        squareCustomerId: `test-sq-b-${Date.now()}`,
        firstName: "Bob",
        lastName: "TestB",
        email: "bob@testb.com",
      },
    })
    console.log(`   Client A: ${clientA.id} (Alice)`)
    console.log(`   Client B: ${clientB.id} (Bob)`)

    const dbA = tenantDb(tenantA.id)
    const dbB = tenantDb(tenantB.id)

    console.log("\n3. Test: findMany from Tenant A should only see Client A...")
    const aClients = await dbA.client.findMany({})
    assert.strictEqual(aClients.length, 1, `Expected 1 client from tenant A, got ${aClients.length}`)
    assert.strictEqual(aClients[0].firstName, "Alice")
    console.log("   PASS — Tenant A sees only Alice")

    console.log("\n4. Test: findMany from Tenant B should only see Client B...")
    const bClients = await dbB.client.findMany({})
    assert.strictEqual(bClients.length, 1, `Expected 1 client from tenant B, got ${bClients.length}`)
    assert.strictEqual(bClients[0].firstName, "Bob")
    console.log("   PASS — Tenant B sees only Bob")

    console.log("\n5. Test: findUnique from Tenant A for Client B's ID should return null...")
    const crossLookup = await dbA.client.findUnique({ where: { id: clientB.id } })
    assert.strictEqual(crossLookup, null, "Expected null for cross-tenant findUnique")
    console.log("   PASS — Cross-tenant findUnique returns null")

    console.log("\n6. Test: count from Tenant A should be 1...")
    const aCount = await dbA.client.count({})
    assert.strictEqual(aCount, 1, `Expected count=1, got ${aCount}`)
    console.log("   PASS — Tenant A count is 1")

    console.log("\n7. Test: deleteMany from Tenant A should only delete Client A...")
    const deleted = await dbA.client.deleteMany({})
    assert.strictEqual(deleted.count, 1, `Expected 1 deleted, got ${deleted.count}`)

    // Verify Client B still exists
    const bAfterDelete = await dbB.client.findMany({})
    assert.strictEqual(bAfterDelete.length, 1, `Expected Client B to survive, got ${bAfterDelete.length}`)
    assert.strictEqual(bAfterDelete[0].firstName, "Bob")
    console.log("   PASS — deleteMany only deleted Tenant A's client, Tenant B intact")

    console.log("\n✅ ALL ISOLATION TESTS PASSED")
  } catch (err) {
    console.error("\n❌ ISOLATION TEST FAILED:", err)
    process.exitCode = 1
  } finally {
    // Cleanup
    console.log("\nCleaning up test data...")
    if (tenantA) await prisma.client.deleteMany({ where: { tenantId: tenantA.id } })
    if (tenantB) await prisma.client.deleteMany({ where: { tenantId: tenantB.id } })
    if (tenantA) await prisma.tenant.delete({ where: { id: tenantA.id } }).catch(() => {})
    if (tenantB) await prisma.tenant.delete({ where: { id: tenantB.id } }).catch(() => {})
    await prisma.$disconnect()
    console.log("Done.")
  }
}

main()
