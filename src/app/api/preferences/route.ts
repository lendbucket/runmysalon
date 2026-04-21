import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/api-auth"
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET() {
  const { db: prisma } = await getTenantPrisma()
  const { session, response } = await requireSession()
  if (response) return response
  const userId = (session!.user as { id: string }).id

  const setting = await prisma.systemSetting.findUnique({
    where: { key: `prefs:${userId}` },
  })

  return NextResponse.json({ preferences: setting ? JSON.parse(setting.value) : null })
}

export async function PATCH(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const { session, response } = await requireSession()
  if (response) return response
  const userId = (session!.user as { id: string }).id

  const body = await req.json()

  await prisma.systemSetting.upsert({
    where: { key: `prefs:${userId}` },
    update: { value: JSON.stringify(body) },
    create: { key: `prefs:${userId}`, value: JSON.stringify(body) },
  })

  return NextResponse.json({ success: true })
}
