import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch enrollment by token (NO auth required - public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const enrollment = await prisma.onboardingEnrollment.findUnique({
    where: { inviteToken: token },
    include: { location: true },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  if (enrollment.expiresAt && new Date() > enrollment.expiresAt) {
    await prisma.onboardingEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "expired" },
    });
    return NextResponse.json({ error: "This enrollment link has expired" }, { status: 410 });
  }

  if (enrollment.status === "completed") {
    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        firstName: enrollment.firstName,
        lastName: enrollment.lastName,
        verificationCode: enrollment.verificationCode,
        locationName: enrollment.location.name,
      },
    });
  }

  // Return safe subset (no SSN, bank details etc.)
  return NextResponse.json({
    enrollment: {
      id: enrollment.id,
      inviteToken: enrollment.inviteToken,
      email: enrollment.email,
      firstName: enrollment.firstName,
      lastName: enrollment.lastName,
      role: enrollment.role,
      status: enrollment.status,
      locationName: enrollment.location.name,
      locationId: enrollment.locationId,
      phone: enrollment.phone,
      dateOfBirth: enrollment.dateOfBirth,
      address: enrollment.address,
      city: enrollment.city,
      state: enrollment.state,
      zip: enrollment.zip,
      licenseNumber: enrollment.licenseNumber,
      licenseState: enrollment.licenseState,
      licenseExpiration: enrollment.licenseExpiration,
      licenseType: enrollment.licenseType,
      emergencyName: enrollment.emergencyName,
      emergencyRelationship: enrollment.emergencyRelationship,
      emergencyPhone: enrollment.emergencyPhone,
      // W-9 partial (don't send SSN back)
      w9LegalName: enrollment.w9LegalName,
      w9BusinessName: enrollment.w9BusinessName,
      w9TaxClassification: enrollment.w9TaxClassification,
      w9Address: enrollment.w9Address,
      w9CertifiedAt: enrollment.w9CertifiedAt,
      // DD partial (don't send full account number back)
      ddBankName: enrollment.ddBankName,
      ddAccountType: enrollment.ddAccountType,
      ddNameOnAccount: enrollment.ddNameOnAccount,
      // Compliance
      ackPolicies: enrollment.ackPolicies,
      ackConfidentiality: enrollment.ackConfidentiality,
      ackAtWill: enrollment.ackAtWill,
      ackSafetyProtocol: enrollment.ackSafetyProtocol,
      ackTechPolicy: enrollment.ackTechPolicy,
      // Agreement
      agreementSignedAt: enrollment.agreementSignedAt,
    },
  });
}

// PATCH: Save step data (NO auth required - public)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const enrollment = await prisma.onboardingEnrollment.findUnique({
    where: { inviteToken: token },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  if (enrollment.status === "completed") {
    return NextResponse.json({ error: "Enrollment already completed" }, { status: 400 });
  }

  if (enrollment.expiresAt && new Date() > enrollment.expiresAt) {
    return NextResponse.json({ error: "This enrollment link has expired" }, { status: 410 });
  }

  try {
    const body = await req.json();
    const { step, data } = body as { step: string; data: Record<string, unknown> };

    // Build update object based on step
    const updateData: Record<string, unknown> = { status: "in_progress" };

    switch (step) {
      case "personal":
        updateData.phone = data.phone;
        updateData.dateOfBirth = data.dateOfBirth;
        updateData.address = data.address;
        updateData.city = data.city;
        updateData.state = data.state;
        updateData.zip = data.zip;
        break;

      case "license":
        updateData.licenseNumber = data.licenseNumber;
        updateData.licenseState = data.licenseState;
        updateData.licenseExpiration = data.licenseExpiration;
        updateData.licenseType = data.licenseType;
        break;

      case "w9":
        updateData.w9LegalName = data.w9LegalName;
        updateData.w9BusinessName = data.w9BusinessName;
        updateData.w9TaxClassification = data.w9TaxClassification;
        updateData.w9Ssn = data.w9Ssn;
        updateData.w9Ein = data.w9Ein;
        updateData.w9Address = data.w9Address;
        updateData.w9CertifiedAt = new Date();
        break;

      case "direct_deposit":
        updateData.ddBankName = data.ddBankName;
        updateData.ddRoutingNumber = data.ddRoutingNumber;
        updateData.ddAccountNumber = data.ddAccountNumber;
        updateData.ddAccountType = data.ddAccountType;
        updateData.ddNameOnAccount = data.ddNameOnAccount;
        break;

      case "emergency":
        updateData.emergencyName = data.emergencyName;
        updateData.emergencyRelationship = data.emergencyRelationship;
        updateData.emergencyPhone = data.emergencyPhone;
        break;

      case "agreement":
        updateData.signatureData = data.signatureData;
        updateData.signedLegalName = data.signedLegalName;
        updateData.signedSsnLast4 = data.signedSsnLast4;
        updateData.signedDate = data.signedDate;
        updateData.ackPolicies = data.ackPolicies;
        updateData.ackConfidentiality = data.ackConfidentiality;
        updateData.ackAtWill = data.ackAtWill;
        updateData.ackSafetyProtocol = data.ackSafetyProtocol;
        updateData.ackTechPolicy = data.ackTechPolicy;
        updateData.agreementSignedAt = new Date();
        break;

      case "complete": {
        // Generate verification code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        updateData.status = "completed";
        updateData.completedAt = new Date();
        updateData.verificationCode = code;

        // Create user in prisma
        const fullEnrollment = await prisma.onboardingEnrollment.findUnique({
          where: { inviteToken: token },
          include: { location: true },
        });

        if (fullEnrollment) {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: fullEnrollment.email },
          });

          if (!existingUser) {
            const user = await prisma.user.create({
              data: {
                email: fullEnrollment.email,
                name: `${fullEnrollment.firstName} ${fullEnrollment.lastName}`,
                role: fullEnrollment.role,
                locationId: fullEnrollment.locationId,
                inviteStatus: "ACCEPTED",
              },
            });

            await prisma.staffMember.create({
              data: {
                userId: user.id,
                locationId: fullEnrollment.locationId,
                fullName: `${fullEnrollment.firstName} ${fullEnrollment.lastName}`,
                email: fullEnrollment.email,
                phone: fullEnrollment.phone || null,
                position: fullEnrollment.role === "MANAGER" ? "manager" : "stylist",
                inviteStatus: "accepted",
              },
            });
          }

          // Send notification email to owner
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);

            const ownerEmail = process.env.OWNER_EMAIL || "ceo@36west.org";

            await resend.emails.send({
              from: process.env.EMAIL_FROM || "Salon Envy Portal <noreply@salonenvyusa.com>",
              to: ownerEmail,
              subject: `Onboarding Complete: ${fullEnrollment.firstName} ${fullEnrollment.lastName}`,
              html: `
                <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #0f1d24; color: #ffffff; padding: 40px; border-radius: 12px;">
                  <h2 style="color: #CDC9C0; margin: 0 0 16px;">Onboarding Complete</h2>
                  <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
                    <strong style="color: #fff;">${fullEnrollment.firstName} ${fullEnrollment.lastName}</strong> has completed their enrollment for
                    <strong style="color: #fff;">${fullEnrollment.location.name}</strong>.
                  </p>
                  <p style="color: #94A3B8; font-size: 14px;">
                    Role: ${fullEnrollment.role}<br/>
                    Email: ${fullEnrollment.email}<br/>
                    Verification Code: <strong style="color: #CDC9C0;">${code}</strong>
                  </p>
                </div>
              `,
            });
          } catch (emailErr) {
            console.error("Failed to send owner notification:", emailErr);
          }
        }

        break;
      }

      default:
        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    const updated = await prisma.onboardingEnrollment.update({
      where: { id: enrollment.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      status: updated.status,
      verificationCode: updated.verificationCode,
    });
  } catch (error: unknown) {
    console.error("Enrollment update error:", error);
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 });
  }
}
