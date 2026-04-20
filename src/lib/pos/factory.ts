import type { POSProvider } from "./index"
import { SquarePOSProvider } from "./square"
import { GlossGeniusPOSProvider } from "./glossgenius"
import { MeevoPOSProvider } from "./meevo"
import { KassePOSProvider } from "./kasse"

export function createPOSProvider(tenant: {
  id: string
  posProvider: string
  squareAccessToken?: string | null
  posAccessToken?: string | null
  glossGeniusApiKey?: string | null
  meevoApiKey?: string | null
  meevoSiteId?: string | null
}): POSProvider {
  switch (tenant.posProvider) {
    case 'square':
      return new SquarePOSProvider(tenant.squareAccessToken || tenant.posAccessToken || '')
    case 'glossgenius':
      return new GlossGeniusPOSProvider(tenant.glossGeniusApiKey || '')
    case 'meevo':
      return new MeevoPOSProvider(tenant.meevoApiKey || '', tenant.meevoSiteId || '')
    case 'kasse':
    default:
      return new KassePOSProvider(tenant.id)
  }
}
