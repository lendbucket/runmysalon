import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { cache } from 'react'

export interface TenantContext {
  id: string
  name: string
  slug: string
  brandName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  accentColor: string
  posProvider: string
  posConnected: boolean
  posAccessToken: string | null
  squareAccessToken: string | null
  squareMerchantId: string | null
  glossGeniusApiKey: string | null
  meevoApiKey: string | null
  meevoSiteId: string | null
  posLocationIds: any
  commissionRate: number
  salesTaxRate: number
  timezone: string
  currency: string
  subscriptionStatus: string
  planType: string
  isActive: boolean
  isSuspended: boolean
  onboardingComplete: boolean
  trialEndsAt: Date | null
}

export const getTenantFromHost = cache(async (host: string): Promise<TenantContext | null> => {
  const hostname = host.split(':')[0]

  // Check subdomain of runmysalon.com
  const runmysalonMatch = hostname.match(/^(.+)\.runmysalon\.com$/)
  if (runmysalonMatch) {
    const slug = runmysalonMatch[1]
    if (slug === 'portal' || slug === 'www' || slug === 'app') return null

    const tenant = await prisma.tenant.findUnique({ where: { slug } })
    if (tenant) return tenant as unknown as TenantContext
  }

  // Check custom domain
  const tenant = await prisma.tenant.findFirst({ where: { customDomain: hostname } })
  if (tenant) return tenant as unknown as TenantContext

  // Main portal or localhost — no tenant
  if (hostname === 'portal.runmysalon.com' || hostname === 'localhost') {
    return null
  }

  return null
})

export async function getCurrentTenant(): Promise<TenantContext | null> {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')
  if (!tenantId) return null

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  return tenant as unknown as TenantContext | null
}

export function getTenantIdFromSession(session: any): string | null {
  return session?.user?.tenantId || null
}
