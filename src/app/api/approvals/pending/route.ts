import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/tenant/get-tenant-prisma"
export async function GET() {
  const { db: prisma } = await getTenantPrisma()
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      inviteStatus: "INVITED",
      role: { in: ["MANAGER", "STYLIST"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
