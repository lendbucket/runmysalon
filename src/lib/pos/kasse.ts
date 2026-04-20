import type { POSProvider, POSAppointment, POSClient, POSMetrics, POSService, POSTeamMember } from "./index"

export class KassePOSProvider implements POSProvider {
  private tenantId: string
  private baseUrl: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.runmysalon.com'
  }

  private async request(path: string, options?: RequestInit) {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      ...options,
      headers: {
        'X-Tenant-Id': this.tenantId,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) throw new Error(`Kasse API error: ${res.status}`)
    return res.json()
  }

  async getAppointments(locationId: string, startAt: string, endAt: string): Promise<POSAppointment[]> {
    try {
      const data = await this.request(`/appointments?locationId=${locationId}&startAt=${startAt}&endAt=${endAt}`)
      return data.appointments || []
    } catch {
      return []
    }
  }

  async getClients(query?: string): Promise<POSClient[]> {
    try {
      const data = await this.request(`/clients${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      return data.clients || []
    } catch {
      return []
    }
  }

  async getMetrics(locationId: string, startAt: string, endAt: string): Promise<POSMetrics> {
    try {
      const data = await this.request(`/metrics?locationId=${locationId}&startAt=${startAt}&endAt=${endAt}`)
      return data.metrics || { revenue: 0, checkouts: 0, avgTicket: 0, tips: 0, tax: 0, topStylists: [] }
    } catch {
      return { revenue: 0, checkouts: 0, avgTicket: 0, tips: 0, tax: 0, topStylists: [] }
    }
  }

  async createAppointment(data: Partial<POSAppointment>): Promise<POSAppointment> {
    return this.request('/appointments', { method: 'POST', body: JSON.stringify(data) })
  }

  async cancelAppointment(id: string): Promise<void> {
    await this.request(`/appointments/${id}/cancel`, { method: 'POST' })
  }

  async getServices(locationId: string): Promise<POSService[]> {
    try {
      const data = await this.request(`/services?locationId=${locationId}`)
      return data.services || []
    } catch {
      return []
    }
  }

  async getTeamMembers(locationId: string): Promise<POSTeamMember[]> {
    try {
      const data = await this.request(`/team-members?locationId=${locationId}`)
      return data.teamMembers || []
    } catch {
      return []
    }
  }
}
