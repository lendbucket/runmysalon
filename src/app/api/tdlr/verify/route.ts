import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Public TDLR license lookup (GET) — no auth needed
export async function GET(req: NextRequest) {
  const license = req.nextUrl.searchParams.get("license");
  if (!license) {
    return NextResponse.json(
      { error: "Missing license parameter" },
      { status: 400 },
    );
  }

  try {
    const url = `https://data.texas.gov/resource/7358-krk7.json?license_number=${encodeURIComponent(license)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json(
        { found: false, error: "TDLR API error" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as Array<Record<string, string>>;

    if (!data || data.length === 0) {
      return NextResponse.json({ found: false });
    }

    const record = data[0];
    const status = record.license_status || record.status || "";
    const isActive =
      status.toLowerCase() === "active" ||
      status.toLowerCase() === "current";
    const expirationDate =
      record.license_expiration_date || record.expiration_date || null;
    const isExpired = expirationDate
      ? new Date(expirationDate) < new Date()
      : false;

    let statusColor: "green" | "red" | "yellow" = "yellow";
    if (isActive && !isExpired) statusColor = "green";
    else if (isExpired || status.toLowerCase() === "expired") statusColor = "red";

    return NextResponse.json({
      found: true,
      licenseNumber: record.license_number || license,
      holderName: record.name || record.license_holder_name || record.full_name || "",
      licenseType: record.license_type || record.license_sub_type || "",
      status,
      isActive: isActive && !isExpired,
      expirationDate,
      statusColor,
    });
  } catch {
    return NextResponse.json(
      { found: false, error: "Failed to query TDLR" },
      { status: 500 },
    );
  }
}

// Auth-protected TDLR update (POST)
export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const body = await req.json();
    const { staffMemberId, licenseNumber, licenseStatus, expirationDate } =
      body as {
        staffMemberId: string;
        licenseNumber: string;
        licenseStatus: string;
        expirationDate?: string;
      };

    if (!staffMemberId || !licenseNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify TDLR to get holder name
    let holderName = "";
    try {
      const url = `https://data.texas.gov/resource/7358-krk7.json?license_number=${encodeURIComponent(licenseNumber)}`;
      const tdlrRes = await fetch(url);
      if (tdlrRes.ok) {
        const data = (await tdlrRes.json()) as Array<Record<string, string>>;
        if (data.length > 0) {
          holderName =
            data[0].name ||
            data[0].license_holder_name ||
            data[0].full_name ||
            "";
        }
      }
    } catch {
      // non-critical, continue
    }

    const updated = await prisma.staffMember.update({
      where: { id: staffMemberId },
      data: {
        tdlrLicenseNumber: licenseNumber,
        tdlrStatus: licenseStatus,
        tdlrExpirationDate: expirationDate
          ? new Date(expirationDate)
          : null,
        tdlrVerifiedAt: new Date(),
        tdlrHolderName: holderName || null,
      },
    });

    void session; // used for auth gate

    return NextResponse.json({ success: true, staffMember: updated });
  } catch (err) {
    console.error("TDLR POST error:", err);
    return NextResponse.json(
      { error: "Failed to update TDLR status" },
      { status: 500 },
    );
  }
}
