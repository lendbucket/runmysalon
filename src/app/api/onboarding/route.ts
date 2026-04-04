import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, role, location } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: string;
      location?: string;
    };

    if (!firstName || !lastName || !email || !role || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const locationRecord = await prisma.location.findFirst({
      where: { name: location },
    });

    if (!locationRecord) {
      return NextResponse.json({ error: "Location not found" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        role: role === "MANAGER" ? "MANAGER" : "STYLIST",
        locationId: locationRecord.id,
        inviteStatus: "INVITED",
      },
    });

    await prisma.staffMember.create({
      data: {
        userId: user.id,
        locationId: locationRecord.id,
        fullName: `${firstName} ${lastName}`,
        email,
        phone: phone || null,
        position: role === "MANAGER" ? "manager" : "stylist",
        inviteStatus: "invited",
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: unknown) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
