import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
import { NextRequest, NextResponse } from "next/server"
// Google review URLs per location
const GOOGLE_REVIEW_URLS: Record<string, string> = {
  CC: "https://search.google.com/local/writereview?placeid=ChIJH_SrmdP1aIYRNxsROAU2fJg",
  SA: "https://search.google.com/local/writereview?placeid=ChIJZx49Ymj1XIYR14gIsIGiKPQ",
}

export async function POST(req: NextRequest) {
  const { db: prisma } = await getTenantPrisma()
  const body = await req.json()
  const { requestId, rating, feedback } = body

  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 })
  }

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 })
  }

  const request = await prisma.reviewRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    return NextResponse.json({ error: "Review request not found" }, { status: 404 })
  }

  const now = new Date()

  if (rating === 5) {
    const reviewUrl = GOOGLE_REVIEW_URLS[request.locationId] || GOOGLE_REVIEW_URLS.CC

    await prisma.reviewRequest.update({
      where: { id: requestId },
      data: {
        rating,
        feedback: feedback || null,
        responseAt: now,
        googleReviewSent: true,
      },
    })

    return NextResponse.json({
      success: true,
      redirect: reviewUrl,
      message: "Thank you! Please share your experience on Google.",
    })
  }

  // Rating < 5: save feedback internally
  await prisma.reviewRequest.update({
    where: { id: requestId },
    data: {
      rating,
      feedback: feedback || null,
      responseAt: now,
    },
  })

  return NextResponse.json({
    success: true,
    message: "Thank you for your feedback",
  })
}
