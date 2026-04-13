import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { prisma } = await import("@/lib/prisma");
    const staff = await prisma.staffMember.findMany({
      include: { location: true },
      orderBy: [{ location: { name: "asc" } }, { fullName: "asc" }],
    });

    return NextResponse.json({ staff });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[staff route] error:", msg);
    return NextResponse.json({ error: msg, staff: [] }, { status: 500 });
  }
}
