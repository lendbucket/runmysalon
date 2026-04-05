import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const userId = (session.user as { id: string }).id;

  const staffMember = await prisma.staffMember.findUnique({
    where: { userId },
    include: { location: true },
  });

  if (!staffMember) {
    return NextResponse.json(
      { error: "Staff member not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ staffMember });
}
