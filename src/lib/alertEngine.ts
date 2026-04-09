import { prisma } from "./prisma"

async function alertExists(title: string, locationId: string | null): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const count = await prisma.adminAlert.count({
    where: { title, locationId: locationId || undefined, createdAt: { gte: since } },
  })
  return count > 0
}

export async function generateSystemAlerts(): Promise<void> {
  try {
    // 1. Low inventory
    const lowItems = await prisma.inventoryItem.findMany({
      where: { quantityOnHand: { lte: prisma.inventoryItem.fields.reorderThreshold ? undefined : 0 } },
      include: { location: { select: { name: true } } },
    }).catch(() => [])

    // Use raw query approach instead
    const allItems = await prisma.inventoryItem.findMany({
      include: { location: { select: { name: true } } },
    })
    for (const item of allItems) {
      if (item.quantityOnHand <= item.reorderThreshold) {
        const title = `Low Inventory: ${item.productName}`
        if (await alertExists(title, item.locationId)) continue
        await prisma.adminAlert.create({
          data: {
            type: "system", severity: "warning", title,
            body: `${item.productName} (${item.brand}) at ${item.location.name} is at ${item.quantityOnHand} units — reorder point is ${item.reorderThreshold}. Consider placing a purchase order.`,
            locationId: item.locationId,
          },
        })
      }
    }

    // 2. Pending purchase orders > 48h
    const oldPOs = await prisma.purchaseOrder.findMany({
      where: { status: "draft", createdAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
      include: { location: { select: { name: true } } },
    })
    for (const po of oldPOs) {
      const days = Math.ceil((Date.now() - new Date(po.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      const title = `Purchase Order Pending Approval`
      if (await alertExists(title, po.locationId)) continue
      await prisma.adminAlert.create({
        data: {
          type: "system", severity: "warning", title,
          body: `Purchase order #${po.id.slice(-8)} at ${po.location.name} has been waiting for approval for ${days} days.`,
          locationId: po.locationId,
        },
      })
    }

    // 3. Unsubmitted schedules due within 3 days
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const draftSchedules = await prisma.schedule.findMany({
      where: { status: "draft", weekStart: { lte: soon, gte: new Date() } },
      include: { location: { select: { name: true } } },
    })
    for (const sched of draftSchedules) {
      const title = `Schedule Not Submitted`
      if (await alertExists(title, sched.locationId)) continue
      await prisma.adminAlert.create({
        data: {
          type: "system", severity: "warning", title,
          body: `The schedule for week of ${new Date(sched.weekStart).toLocaleDateString()} at ${sched.location.name} has not been submitted for approval yet.`,
          locationId: sched.locationId,
        },
      })
    }

    // 4. TDLR licenses expiring within 60 days
    const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    const expiringStaff = await prisma.staffMember.findMany({
      where: { isActive: true, tdlrExpirationDate: { not: null, lte: in60 } },
      include: { location: { select: { name: true } } },
    })
    for (const staff of expiringStaff) {
      if (!staff.tdlrExpirationDate) continue
      const daysLeft = Math.ceil((staff.tdlrExpirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      const title = `${staff.fullName} License Expiring Soon`
      if (await alertExists(title, staff.locationId)) continue
      await prisma.adminAlert.create({
        data: {
          type: "system", severity: daysLeft <= 30 ? "critical" : "warning", title,
          body: `${staff.fullName}'s TDLR license expires on ${staff.tdlrExpirationDate.toLocaleDateString()}. Remind them to complete CE hours and renew.`,
          locationId: staff.locationId,
        },
      })
    }

    // 5. Incomplete onboarding > 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const staleOnboarding = await prisma.onboardingEnrollment.findMany({
      where: { status: { not: "completed" }, createdAt: { lt: weekAgo } },
      include: { location: { select: { name: true } } },
    })
    for (const enroll of staleOnboarding) {
      const days = Math.ceil((Date.now() - new Date(enroll.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      const title = `Onboarding Incomplete`
      if (await alertExists(title, enroll.locationId)) continue
      await prisma.adminAlert.create({
        data: {
          type: "system", severity: "info", title,
          body: `${enroll.firstName} ${enroll.lastName}'s onboarding has been sitting incomplete for ${days} days. Follow up to get them enrolled.`,
          locationId: enroll.locationId,
        },
      })
    }
  } catch (err) {
    console.error("Alert engine error:", err)
  }
}
