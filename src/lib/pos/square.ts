import { SquareClient, SquareEnvironment } from "square"
import type { POSProvider, POSAppointment, POSClient, POSMetrics, POSService, POSTeamMember } from "./index"

export class SquarePOSProvider implements POSProvider {
  private client: SquareClient

  constructor(accessToken: string) {
    this.client = new SquareClient({
      token: accessToken,
      environment: SquareEnvironment.Production,
    })
  }

  async getAppointments(locationId: string, startAt: string, endAt: string): Promise<POSAppointment[]> {
    try {
      const result = await this.client.bookings.list({
        locationId,
        startAtMin: startAt,
        startAtMax: endAt,
        limit: 200,
      })
      return (result.data || []).map(b => ({
        id: b.id || '',
        startAt: b.startAt || '',
        endAt: b.appointmentSegments?.[0]?.durationMinutes
          ? new Date(new Date(b.startAt || '').getTime() + (b.appointmentSegments[0].durationMinutes * 60000)).toISOString()
          : '',
        status: b.status || 'PENDING',
        clientId: b.customerId || undefined,
        teamMemberId: b.appointmentSegments?.[0]?.teamMemberId || undefined,
        services: (b.appointmentSegments || []).map(seg => ({
          name: seg.serviceVariationId || 'Service',
          price: 0,
          durationMinutes: seg.durationMinutes || 0,
        })),
        locationId: b.locationId || locationId,
        notes: b.locationType || undefined,
      }))
    } catch (error) {
      console.error('[Square POS] getAppointments error:', error)
      return []
    }
  }

  async getClients(query?: string): Promise<POSClient[]> {
    try {
      if (query) {
        const result = await this.client.customers.search({
          query: {
            filter: {
              emailAddress: { fuzzy: query },
            },
          },
          limit: BigInt(50),
        })
        return (result.customers || []).map(c => ({
          id: c.id || '',
          name: `${c.givenName || ''} ${c.familyName || ''}`.trim(),
          firstName: c.givenName || undefined,
          lastName: c.familyName || undefined,
          phone: c.phoneNumber || undefined,
          email: c.emailAddress || undefined,
        }))
      }
      const result = await this.client.customers.list({ limit: 100 })
      return (result.data || []).map(c => ({
        id: c.id || '',
        name: `${c.givenName || ''} ${c.familyName || ''}`.trim(),
        firstName: c.givenName || undefined,
        lastName: c.familyName || undefined,
        phone: c.phoneNumber || undefined,
        email: c.emailAddress || undefined,
      }))
    } catch (error) {
      console.error('[Square POS] getClients error:', error)
      return []
    }
  }

  async getMetrics(locationId: string, startAt: string, endAt: string): Promise<POSMetrics> {
    try {
      const result = await this.client.orders.search({
        locationIds: [locationId],
        query: {
          filter: {
            dateTimeFilter: { closedAt: { startAt, endAt } },
            stateFilter: { states: ['COMPLETED'] },
          },
        },
        limit: 500,
      })
      const orders = result.orders || []
      let revenue = 0, tips = 0, tax = 0
      const stylistMap = new Map<string, { name: string; revenue: number; checkouts: number }>()

      for (const o of orders) {
        const total = Number(o.totalMoney?.amount || 0) / 100
        const tipAmt = Number(o.totalTipMoney?.amount || 0) / 100
        const taxAmt = Number(o.totalTaxMoney?.amount || 0) / 100
        const net = total - tipAmt - taxAmt
        if (net <= 0) continue
        revenue += net
        tips += tipAmt
        tax += taxAmt
      }
      const checkouts = orders.filter(o => {
        const net = (Number(o.totalMoney?.amount || 0) - Number(o.totalTipMoney?.amount || 0) - Number(o.totalTaxMoney?.amount || 0)) / 100
        return net > 0
      }).length

      return {
        revenue,
        checkouts,
        avgTicket: checkouts > 0 ? revenue / checkouts : 0,
        tips,
        tax,
        topStylists: Array.from(stylistMap.values()).sort((a, b) => b.revenue - a.revenue),
      }
    } catch (error) {
      console.error('[Square POS] getMetrics error:', error)
      return { revenue: 0, checkouts: 0, avgTicket: 0, tips: 0, tax: 0, topStylists: [] }
    }
  }

  async createAppointment(data: Partial<POSAppointment>): Promise<POSAppointment> {
    const result = await this.client.bookings.create({
      booking: {
        locationId: data.locationId,
        customerId: data.clientId,
        startAt: data.startAt,
        appointmentSegments: data.services?.map(s => ({
          teamMemberId: data.teamMemberId || '',
          serviceVariationId: s.name,
          durationMinutes: s.durationMinutes,
        })) || [],
      },
    })
    return {
      id: result.booking?.id || '',
      startAt: result.booking?.startAt || '',
      endAt: '',
      status: result.booking?.status || 'PENDING',
      locationId: result.booking?.locationId || '',
      services: [],
    }
  }

  async cancelAppointment(id: string): Promise<void> {
    await this.client.bookings.cancel({ bookingId: id })
  }

  async getServices(_locationId: string): Promise<POSService[]> {
    try {
      const result = await this.client.catalog.list({ types: 'ITEM' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result.data || [])
        .filter((item: any) => item.type === 'ITEM' && item.itemData?.productType === 'APPOINTMENTS_SERVICE')
        .map((item: any) => ({
          id: item.id || '',
          name: item.itemData?.name || '',
          price: Number(item.itemData?.variations?.[0]?.itemVariationData?.priceMoney?.amount || 0) / 100,
          durationMinutes: Number(item.itemData?.variations?.[0]?.itemVariationData?.serviceDuration || 0) / 60000,
          categoryName: item.itemData?.categoryId || undefined,
        }))
    } catch (error) {
      console.error('[Square POS] getServices error:', error)
      return []
    }
  }

  async getTeamMembers(locationId: string): Promise<POSTeamMember[]> {
    try {
      const result = await this.client.teamMembers.search({
        query: {
          filter: {
            locationIds: [locationId],
            status: 'ACTIVE',
          },
        },
      })
      return (result.teamMembers || []).map(tm => ({
        id: tm.id || '',
        name: `${tm.givenName || ''} ${tm.familyName || ''}`.trim(),
        email: tm.emailAddress || undefined,
        phone: tm.phoneNumber || undefined,
        isActive: tm.status === 'ACTIVE',
      }))
    } catch (error) {
      console.error('[Square POS] getTeamMembers error:', error)
      return []
    }
  }
}
