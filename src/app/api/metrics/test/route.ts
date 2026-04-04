import { NextResponse } from "next/server"
import { SquareClient, SquareEnvironment } from "square"

export async function GET() {
  try {
    const square = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: SquareEnvironment.Production,
    })

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const bookingsPage = await square.bookings.list({
      startAtMin: weekAgo.toISOString(),
      startAtMax: now.toISOString(),
      limit: 10,
    })

    const bookings = bookingsPage.data?.map(b => ({
      id: b.id,
      status: b.status,
      teamMemberId: b.appointmentSegments?.[0]?.teamMemberId,
      startAt: b.startAt,
      locationId: b.locationId,
    }))

    return NextResponse.json({
      bookingCount: bookings?.length || 0,
      bookings: bookings || [],
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg })
  }
}
