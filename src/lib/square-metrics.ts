import { SquareClient, SquareEnvironment } from "square"

function getSquare() {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
  })
}

export const TEAM_MEMBER_LOCATIONS: Record<string, "Corpus Christi" | "San Antonio"> = {
  "TMbc13IBzS8Z43AO": "Corpus Christi", // Clarissa Reyna - Manager
  "TMaExUyYaWYlvSqh": "Corpus Christi", // Alexis Rodriguez
  "TMCzd3unwciKEVX7": "Corpus Christi", // Kaylie Espinoza
  "TMn7kInT8g7Vrgxi": "Corpus Christi", // Ashlynn Ochoa
  "TMMdDDwU8WXpCZ9m": "Corpus Christi", // Jessy Blamey
  "TM_xI40vPph2_Cos": "Corpus Christi", // Mia Gonzales
  "TMMJKxeQuMlMW1Dw": "San Antonio",    // Melissa Cruz - Manager
  "TM5CjcvcHRXZQ4hP": "San Antonio",    // Madelynn Martinez
  "TMcc0QbHuUZfgcIB": "San Antonio",    // Jaylee Jaeger
  "TMfFCmgJ5RV-WCBq": "San Antonio",    // Aubree Saldana
  "TMk1YstlrnPrKw8p": "San Antonio",    // Kiyara Smith
}

export const TEAM_MEMBER_NAMES: Record<string, string> = {
  "TMbc13IBzS8Z43AO": "Clarissa Reyna",
  "TMaExUyYaWYlvSqh": "Alexis Rodriguez",
  "TMCzd3unwciKEVX7": "Kaylie Espinoza",
  "TMn7kInT8g7Vrgxi": "Ashlynn Ochoa",
  "TMMdDDwU8WXpCZ9m": "Jessy Blamey",
  "TM_xI40vPph2_Cos": "Mia Gonzales",
  "TMMJKxeQuMlMW1Dw": "Melissa Cruz",
  "TM5CjcvcHRXZQ4hP": "Madelynn Martinez",
  "TMcc0QbHuUZfgcIB": "Jaylee Jaeger",
  "TMfFCmgJ5RV-WCBq": "Aubree Saldana",
  "TMk1YstlrnPrKw8p": "Kiyara Smith",
}

export interface StylistMetrics {
  teamMemberId: string
  name: string
  homeLocation: string
  revenue: number
  serviceCount: number
  avgTicket: number
}

export interface LocationMetrics {
  location: string
  revenue: number
  serviceCount: number
  avgTicket: number
  stylistBreakdown: StylistMetrics[]
  periodStart: string
  periodEnd: string
}

function getDateRange(periodType: "week" | "month" | "year") {
  const now = new Date()
  let startDate: Date
  if (periodType === "week") {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - now.getDay())
    startDate.setHours(0, 0, 0, 0)
  } else if (periodType === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    startDate = new Date(now.getFullYear(), 0, 1)
  }
  return { startAt: startDate.toISOString(), endAt: now.toISOString() }
}

export async function getMetricsByPeriod(
  periodType: "week" | "month" | "year",
  location?: "Corpus Christi" | "San Antonio"
): Promise<LocationMetrics[]> {
  const square = getSquare()
  const { startAt, endAt } = getDateRange(periodType)

  // Initialize stylist metrics
  const stylistMetrics: Record<string, StylistMetrics> = {}
  for (const [id, loc] of Object.entries(TEAM_MEMBER_LOCATIONS)) {
    stylistMetrics[id] = {
      teamMemberId: id,
      name: TEAM_MEMBER_NAMES[id] || "Unknown",
      homeLocation: loc,
      revenue: 0,
      serviceCount: 0,
      avgTicket: 0,
    }
  }

  try {
    // STEP 1: Get all bookings in the period via pagination
    const bookingTeamMap: Record<string, string> = {} // bookingId -> teamMemberId

    const bookingsPage = await square.bookings.list({
      startAtMin: startAt,
      startAtMax: endAt,
      limit: 100,
    })

    // Process first page
    for (const booking of bookingsPage.data) {
      if (booking.status !== "ACCEPTED" && booking.status !== "PENDING") continue
      const teamMemberId = booking.appointmentSegments?.[0]?.teamMemberId
      if (!teamMemberId || !TEAM_MEMBER_LOCATIONS[teamMemberId]) continue
      if (booking.id) {
        bookingTeamMap[booking.id] = teamMemberId
        stylistMetrics[teamMemberId].serviceCount += 1
      }
    }

    // Paginate through remaining pages
    let page = bookingsPage
    while (page.hasNextPage()) {
      page = await page.getNextPage()
      for (const booking of page.data) {
        if (booking.status !== "ACCEPTED" && booking.status !== "PENDING") continue
        const teamMemberId = booking.appointmentSegments?.[0]?.teamMemberId
        if (!teamMemberId || !TEAM_MEMBER_LOCATIONS[teamMemberId]) continue
        if (booking.id) {
          bookingTeamMap[booking.id] = teamMemberId
          stylistMetrics[teamMemberId].serviceCount += 1
        }
      }
    }

    // STEP 2: Get completed orders to match revenue
    const ordersRes = await square.orders.search({
      locationIds: ["LTJSA6QR1HGW6", "LXJYXDXWR0XZF"],
      query: {
        filter: {
          dateTimeFilter: {
            createdAt: {
              startAt,
              endAt,
            },
          },
          stateFilter: {
            states: ["COMPLETED"],
          },
        },
      },
      limit: 500,
    })

    const orders = ordersRes.orders || []
    for (const order of orders) {
      // Try to match order to a booking via metadata
      let teamMemberId: string | undefined

      if (order.metadata) {
        const meta = order.metadata as Record<string, string>
        if (meta.bookingId && bookingTeamMap[meta.bookingId]) {
          teamMemberId = bookingTeamMap[meta.bookingId]
        }
      }

      // Check direct team member on order
      if (!teamMemberId) {
        teamMemberId = (order as unknown as Record<string, unknown>).teamMemberId as string | undefined
      }

      if (!teamMemberId || !stylistMetrics[teamMemberId]) continue

      const amount = Number(order.totalMoney?.amount || 0) / 100
      stylistMetrics[teamMemberId].revenue += amount
    }

    // Calculate avg tickets
    for (const m of Object.values(stylistMetrics)) {
      if (m.serviceCount > 0 && m.revenue > 0) {
        m.avgTicket = Math.round((m.revenue / m.serviceCount) * 100) / 100
      }
    }

    // Aggregate by location
    const ccMetrics: LocationMetrics = {
      location: "Corpus Christi",
      revenue: 0, serviceCount: 0, avgTicket: 0,
      stylistBreakdown: [],
      periodStart: startAt, periodEnd: endAt,
    }
    const saMetrics: LocationMetrics = {
      location: "San Antonio",
      revenue: 0, serviceCount: 0, avgTicket: 0,
      stylistBreakdown: [],
      periodStart: startAt, periodEnd: endAt,
    }

    for (const m of Object.values(stylistMetrics)) {
      const target = m.homeLocation === "Corpus Christi" ? ccMetrics : saMetrics
      target.revenue += m.revenue
      target.serviceCount += m.serviceCount
      target.stylistBreakdown.push(m)
    }

    if (ccMetrics.serviceCount > 0) ccMetrics.avgTicket = Math.round((ccMetrics.revenue / ccMetrics.serviceCount) * 100) / 100
    if (saMetrics.serviceCount > 0) saMetrics.avgTicket = Math.round((saMetrics.revenue / saMetrics.serviceCount) * 100) / 100

    ccMetrics.stylistBreakdown.sort((a, b) => b.revenue - a.revenue || b.serviceCount - a.serviceCount)
    saMetrics.stylistBreakdown.sort((a, b) => b.revenue - a.revenue || b.serviceCount - a.serviceCount)

    if (location === "Corpus Christi") return [ccMetrics]
    if (location === "San Antonio") return [saMetrics]
    return [ccMetrics, saMetrics]

  } catch (error) {
    console.error("Square metrics error:", error)
    return []
  }
}
