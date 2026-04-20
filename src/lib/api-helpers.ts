import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function getSessionAndTenant() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const tenantId = (session.user as any)?.tenantId as string | undefined
  const userId = (session.user as any)?.id as string
  const role = (session.user as any)?.role as string

  return { session, tenantId, userId, role }
}

export function requireSuperAdmin(role: string) {
  if (role !== 'SUPER_ADMIN' && role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export function tenantWhere(tenantId: string | undefined, extra: Record<string, any> = {}) {
  return tenantId ? { tenantId, ...extra } : extra
}
