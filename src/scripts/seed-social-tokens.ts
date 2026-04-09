import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const ccLocation = await prisma.location.findFirst({ where: { squareLocationId: process.env.SQUARE_CC_LOCATION_ID } })
  const saLocation = await prisma.location.findFirst({ where: { squareLocationId: process.env.SQUARE_SA_LOCATION_ID } })

  if (ccLocation && process.env.META_CC_PAGE_ID) {
    await prisma.socialToken.upsert({
      where: { locationId: ccLocation.id },
      update: { fbPageId: process.env.META_CC_PAGE_ID!, fbAccessToken: process.env.META_CC_PAGE_ACCESS_TOKEN!, igAccountId: process.env.META_CC_INSTAGRAM_ID || null },
      create: { locationId: ccLocation.id, fbPageId: process.env.META_CC_PAGE_ID!, fbAccessToken: process.env.META_CC_PAGE_ACCESS_TOKEN!, igAccountId: process.env.META_CC_INSTAGRAM_ID || null },
    })
    console.log("CC social token seeded")
  } else {
    console.log("Skipping CC — missing META_CC_PAGE_ID or location not found")
  }

  if (saLocation && process.env.META_SA_PAGE_ID) {
    await prisma.socialToken.upsert({
      where: { locationId: saLocation.id },
      update: { fbPageId: process.env.META_SA_PAGE_ID!, fbAccessToken: process.env.META_SA_PAGE_ACCESS_TOKEN!, igAccountId: process.env.META_SA_INSTAGRAM_ID || null },
      create: { locationId: saLocation.id, fbPageId: process.env.META_SA_PAGE_ID!, fbAccessToken: process.env.META_SA_PAGE_ACCESS_TOKEN!, igAccountId: process.env.META_SA_INSTAGRAM_ID || null },
    })
    console.log("SA social token seeded")
  } else {
    console.log("Skipping SA — missing META_SA_PAGE_ID or location not found")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
