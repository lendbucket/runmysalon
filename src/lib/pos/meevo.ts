import type { POSProvider, POSAppointment, POSClient, POSMetrics, POSService, POSTeamMember } from "./index"

export class MeevoPOSProvider implements POSProvider {
  private apiKey: string
  private siteId: string

  constructor(apiKey: string, siteId: string) {
    this.apiKey = apiKey
    this.siteId = siteId
  }

  private async request(path: string, options?: RequestInit) {
    const res = await fetch(`https://api.meevo.com/v1/sites/${this.siteId}${path}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) throw new Error(`Meevo API error: ${res.status}`)
    return res.json()
  }

  async getAppointments(locationId: string, startAt: string, endAt: string): Promise<POSAppointment[]> {
    console.log('[Meevo] getAppointments not yet implemented for', locationId, startAt, endAt)
    return []
  }

  async getClients(query?: string): Promise<POSClient[]> {
    console.log('[Meevo] getClients not yet implemented', query)
    return []
  }

  async getMetrics(locationId: string, startAt: string, endAt: string): Promise<POSMetrics> {
    console.log('[Meevo] getMetrics not yet implemented for', locationId, startAt, endAt)
    return { revenue: 0, checkouts: 0, avgTicket: 0, tips: 0, tax: 0, topStylists: [] }
  }

  async createAppointment(data: Partial<POSAppointment>): Promise<POSAppointment> {
    console.log('[Meevo] createAppointment not yet implemented')
    return { id: '', startAt: data.startAt || '', endAt: '', status: 'pending', services: [], locationId: data.locationId || '' }
  }

  async cancelAppointment(id: string): Promise<void> {
    console.log('[Meevo] cancelAppointment not yet implemented for', id)
  }

  async getServices(locationId: string): Promise<POSService[]> {
    console.log('[Meevo] getServices not yet implemented for', locationId)
    return []
  }

  async getTeamMembers(locationId: string): Promise<POSTeamMember[]> {
    console.log('[Meevo] getTeamMembers not yet implemented for', locationId)
    return []
  }
}
