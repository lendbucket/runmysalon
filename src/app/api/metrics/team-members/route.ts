import { NextResponse } from "next/server"
import { SquareClient, SquareEnvironment } from "square"

export async function GET() {
  try {
    const square = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: SquareEnvironment.Production,
    })

    const response = await square.teamMembers.search({
      query: {
        filter: {
          status: "ACTIVE",
        },
      },
    })

    const members = response.teamMembers?.map(m => ({
      id: m.id,
      givenName: m.givenName,
      familyName: m.familyName,
      email: m.emailAddress,
      status: m.status,
      isOwner: m.isOwner,
    }))

    return NextResponse.json({ members, count: members?.length })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg })
  }
}
