import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "ceo@36west.org"
const DEV_TENANT_SLUG = "devsalon"
const DEFAULT_TENANT_ID = "clsalonenvy000000000000000"

async function main() {
  console.log("Seeding database...")

  // 1. Super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: { superAdmin: true, name: "Robert Reyna" },
    create: {
      email: SUPER_ADMIN_EMAIL,
      name: "Robert Reyna",
      role: "OWNER",
      inviteStatus: "ACCEPTED",
      superAdmin: true,
    },
  })
  console.log(`  Super admin: ${superAdmin.email} (${superAdmin.id})`)

  // 2. Dev tenant
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)

  const devTenant = await prisma.tenant.upsert({
    where: { slug: DEV_TENANT_SLUG },
    update: { name: "Dev Salon", ownerEmail: SUPER_ADMIN_EMAIL },
    create: {
      slug: DEV_TENANT_SLUG,
      name: "Dev Salon",
      status: "ACTIVE",
      ownerEmail: SUPER_ADMIN_EMAIL,
      ownerPhone: "+13615551234",
      timezone: "America/Chicago",
      currency: "USD",
      locale: "en-US",
      addressLine1: "5425 S Padre Island Dr",
      city: "Corpus Christi",
      state: "TX",
      postalCode: "78411",
      country: "US",
      trialEndsAt,
    },
  })
  console.log(`  Dev tenant: ${devTenant.slug} (${devTenant.id})`)

  // 3. Membership: super admin as OWNER of dev tenant
  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: { tenantId: devTenant.id, userId: superAdmin.id },
    },
    update: { role: "OWNER" },
    create: {
      tenantId: devTenant.id,
      userId: superAdmin.id,
      role: "OWNER",
    },
  })
  console.log(`  Membership: ${superAdmin.email} is OWNER of ${devTenant.slug}`)

  // 4. TenantBranding row with defaults
  await prisma.tenantBranding.upsert({
    where: { tenantId: devTenant.id },
    update: {},
    create: {
      tenantId: devTenant.id,
      primaryColor: "#606E74",
      accentColor: "#7a8f96",
      showPoweredBy: true,
    },
  })
  console.log(`  Branding: defaults set for ${devTenant.slug}`)

  // 5. TenantSubscription row
  await prisma.tenantSubscription.upsert({
    where: { tenantId: devTenant.id },
    update: {},
    create: {
      tenantId: devTenant.id,
      status: "active",
      trialEndsAt,
    },
  })
  console.log(`  Subscription: active for ${devTenant.slug}`)

  // Also ensure the default Salon Envy tenant exists (for production data)
  const salonEnvy = await prisma.tenant.upsert({
    where: { slug: "salonenvy" },
    update: {},
    create: {
      id: DEFAULT_TENANT_ID,
      slug: "salonenvy",
      name: "Salon Envy USA",
      status: "ACTIVE",
      ownerEmail: SUPER_ADMIN_EMAIL,
      timezone: "America/Chicago",
      currency: "USD",
      locale: "en-US",
      country: "US",
    },
  })
  console.log(`  Salon Envy tenant: ${salonEnvy.slug} (${salonEnvy.id})`)

  // Membership for super admin on Salon Envy
  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: { tenantId: salonEnvy.id, userId: superAdmin.id },
    },
    update: { role: "OWNER" },
    create: {
      tenantId: salonEnvy.id,
      userId: superAdmin.id,
      role: "OWNER",
    },
  })
  console.log(`  Membership: ${superAdmin.email} is OWNER of ${salonEnvy.slug}`)

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
