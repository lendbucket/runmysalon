export interface POSAppointment {
  id: string
  startAt: string
  endAt: string
  status: string
  clientId?: string
  clientName?: string
  clientPhone?: string
  teamMemberId?: string
  teamMemberName?: string
  services: { name: string; price: number; durationMinutes: number }[]
  locationId: string
  notes?: string
  totalAmount?: number
}

export interface POSClient {
  id: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  totalVisits?: number
  totalSpend?: number
  lastVisitAt?: string
}

export interface POSTeamMember {
  id: string
  name: string
  email?: string
  phone?: string
  isActive: boolean
}

export interface POSService {
  id: string
  name: string
  price: number
  durationMinutes: number
  categoryName?: string
}

export interface POSMetrics {
  revenue: number
  checkouts: number
  avgTicket: number
  tips: number
  tax: number
  topStylists: { name: string; revenue: number; checkouts: number }[]
}

export interface POSProvider {
  getAppointments(locationId: string, startAt: string, endAt: string): Promise<POSAppointment[]>
  getClients(query?: string): Promise<POSClient[]>
  getMetrics(locationId: string, startAt: string, endAt: string): Promise<POSMetrics>
  createAppointment(data: Partial<POSAppointment>): Promise<POSAppointment>
  cancelAppointment(id: string): Promise<void>
  getServices(locationId: string): Promise<POSService[]>
  getTeamMembers(locationId: string): Promise<POSTeamMember[]>
}
