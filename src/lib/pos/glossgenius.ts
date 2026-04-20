import type { POSProvider, POSAppointment, POSClient, POSMetrics, POSService, POSTeamMember } from "./index"

export class GlossGeniusPOSProvider implements POSProvider {
  private apiKey: string
  private baseUrl = "https://api.glossgenius.com/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(path: string, options?: RequestInit) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) throw new Error(`GlossGenius API error: ${res.status}`)
    return res.json()
  }

  async getAppointments(locationId: string, startAt: string, endAt: string): Promise<POSAppointment[]> {
    try {
      const data = await this.request(`/appointments?start=${startAt}&end=${endAt}&location=${locationId}`)
      return (data.appointments || []).map((a: any) => ({
        id: a.id,
        startAt: a.start_time,
        endAt: a.end_time,
        status: a.status,
        clientId: a.client_id,
        clientName: a.client_name,
        teamMemberId: a.provider_id,
        teamMemberName: a.provider_name,
        services: (a.services || []).map((s: any) => ({ name: s.name, price: s.price, durationMinutes: s.duration })),
        locationId,
      }))
    } catch (error) {
      console.log('[GlossGenius] getAppointments not yet implemented:', error)
      return []
    }
  }

  async getClients(query?: string): Promise<POSClient[]> {
    try {
      const data = await this.request(`/clients${query ? `?search=${encodeURIComponent(query)}` : ''}`)
      return (data.clients || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        firstName: c.first_name,
        lastName: c.last_name,
        phone: c.phone,
        email: c.email,
      }))
    } catch (error) {
      console.log('[GlossGenius] getClients not yet implemented:', error)
      return []
    }
  }

  async getMetrics(locationId: string, startAt: string, endAt: string): Promise<POSMetrics> {
    console.log('[GlossGenius] getMetrics not yet implemented for', locationId, startAt, endAt)
    return { revenue: 0, checkouts: 0, avgTicket: 0, tips: 0, tax: 0, topStylists: [] }
  }

  async createAppointment(data: Partial<POSAppointment>): Promise<POSAppointment> {
    const result = await this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        client_id: data.clientId,
        start_time: data.startAt,
        provider_id: data.teamMemberId,
        services: data.services?.map(s => ({ name: s.name, duration: s.durationMinutes })),
      }),
    })
    return { id: result.id, startAt: result.start_time, endAt: result.end_time, status: 'confirmed', services: [], locationId: data.locationId || '' }
  }

  async cancelAppointment(id: string): Promise<void> {
    await this.request(`/appointments/${id}/cancel`, { method: 'POST' })
  }

  async getServices(locationId: string): Promise<POSService[]> {
    console.log('[GlossGenius] getServices not yet implemented for', locationId)
    return []
  }

  async getTeamMembers(locationId: string): Promise<POSTeamMember[]> {
    console.log('[GlossGenius] getTeamMembers not yet implemented for', locationId)
    return []
  }
}
