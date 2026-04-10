import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SA_LOCATION_ID, TEAM_NAMES } from "@/lib/staff"

const SQ = "https://connect.squareup.com/v2"

async function sq(path: string, options?: RequestInit) {
  const r = await fetch(`${SQ}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN!}`,
      "Content-Type": "application/json",
      "Square-Version": "2025-04-16",
      ...(options?.headers || {}),
    },
  })
  return r.json()
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const startDate = req.nextUrl.searchParams.get("startDate")
  const endDate = req.nextUrl.searchParams.get("endDate")
  if (!startDate || !endDate) return NextResponse.json({ error: "startDate and endDate required" }, { status: 400 })

  try {
    // Fetch all completed orders from SA (all payments go through SA)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allOrders: any[] = []
    let cursor: string | undefined

    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = {
        location_ids: [SA_LOCATION_ID],
        query: {
          filter: {
            date_time_filter: {
              closed_at: { start_at: startDate, end_at: endDate },
            },
            state_filter: { states: ["COMPLETED"] },
          },
          sort: { sort_field: "CLOSED_AT", sort_order: "DESC" },
        },
        limit: 100,
      }
      if (cursor) body.cursor = cursor

      const data = await sq("/orders/search", { method: "POST", body: JSON.stringify(body) })
      if (data.orders) allOrders.push(...data.orders)
      cursor = data.cursor
    } while (cursor)

    // Fetch bookings to map customer_id → team_member_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerToStylist: Record<string, string> = {}
    {
      let bookCursor: string | undefined
      do {
        const params = new URLSearchParams()
        params.set("limit", "100")
        params.set("start_at_min", startDate)
        params.set("start_at_max", endDate)
        if (bookCursor) params.set("cursor", bookCursor)
        const bData = await sq(`/bookings?${params}`)
        for (const b of bData.bookings || []) {
          if (b.customer_id && b.appointment_segments?.[0]?.team_member_id) {
            customerToStylist[b.customer_id] = b.appointment_segments[0].team_member_id
          }
        }
        bookCursor = bData.cursor
      } while (bookCursor)
    }

    // Collect unique customer IDs for name lookup
    const customerIds = new Set<string>()
    for (const o of allOrders) {
      if (o.customer_id) customerIds.add(o.customer_id)
    }

    // Batch fetch customer names
    const customerNames: Record<string, string> = {}
    const idArr = Array.from(customerIds)
    for (let i = 0; i < idArr.length; i += 10) {
      const batch = idArr.slice(i, i + 10)
      await Promise.all(
        batch.map(async (cid) => {
          try {
            const cd = await sq(`/customers/${cid}`)
            if (cd.customer) {
              customerNames[cid] = `${cd.customer.given_name || ""} ${cd.customer.family_name || ""}`.trim() || "Client"
            }
          } catch { /* skip */ }
        })
      )
    }

    // Build transactions
    let totalRevenue = 0
    let totalTips = 0
    let totalTax = 0
    let totalCollected = 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactions = allOrders.map((o: any) => {
      const subtotal = Number(o.total_money?.amount || 0) / 100 - Number(o.total_tax_money?.amount || 0) / 100 - Number(o.total_tip_money?.amount || 0) / 100
      const tips = Number(o.total_tip_money?.amount || 0) / 100
      const tax = Number(o.total_tax_money?.amount || 0) / 100
      const total = Number(o.total_money?.amount || 0) / 100

      totalRevenue += subtotal
      totalTips += tips
      totalTax += tax
      totalCollected += total

      // Get payment method from tenders
      let paymentMethod = "Unknown"
      if (o.tenders && o.tenders.length > 0) {
        const t = o.tenders[0]
        if (t.type === "CASH") {
          paymentMethod = "Cash"
        } else if (t.type === "CARD" || t.type === "SQUARE_GIFT_CARD") {
          const cd = t.card_details
          if (cd) {
            const brand = cd.card?.card_brand || ""
            const last4 = cd.card?.last_4 || ""
            paymentMethod = last4 ? `${brand} •••• ${last4}` : brand || "Card"
          } else {
            paymentMethod = "Card"
          }
        } else if (t.type === "WALLET") {
          paymentMethod = "Apple Pay"
        } else if (t.type === "OTHER") {
          paymentMethod = "Other"
        }
      }

      // Services from line items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const services = (o.line_items || []).map((li: any) => li.name || "Service")

      // Stylist from booking lookup
      const teamMemberId = o.customer_id ? customerToStylist[o.customer_id] : undefined
      const stylistName = teamMemberId ? (TEAM_NAMES[teamMemberId] || "Unknown") : "Walk-in"

      return {
        id: o.id,
        closedAt: o.closed_at,
        customerName: o.customer_id ? (customerNames[o.customer_id] || "Client") : "Walk-in",
        stylistName,
        services,
        paymentMethod,
        subtotal: Math.round(subtotal * 100) / 100,
        tips: Math.round(tips * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
      }
    })

    const count = transactions.length
    return NextResponse.json({
      summary: {
        revenue: Math.round(totalRevenue * 100) / 100,
        tips: Math.round(totalTips * 100) / 100,
        tax: Math.round(totalTax * 100) / 100,
        total: Math.round(totalCollected * 100) / 100,
        count,
        avgTicket: count > 0 ? Math.round((totalCollected / count) * 100) / 100 : 0,
      },
      transactions,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to fetch transactions" }, { status: 500 })
  }
}
