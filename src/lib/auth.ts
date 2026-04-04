import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

import type { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  secret:
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "fallback-secret-for-dev",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "smtp.resend.com",
        port: Number(process.env.EMAIL_SERVER_PORT) || 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER || "resend",
          pass: process.env.EMAIL_SERVER_PASSWORD || process.env.RESEND_API_KEY || "",
        },
      },
      from: process.env.EMAIL_FROM || "Salon Envy Portal <noreply@salonenvyusa.com>",
      async sendVerificationRequest({ identifier: email, url }) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Salon Envy Portal <noreply@salonenvyusa.com>",
          to: email,
          subject: "Sign in to Salon Envy\u00ae Portal",
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background-color: #0f1d24; color: #ffffff; padding: 40px;">
              <div style="background-color:#1a2a32;border-radius:16px;padding:32px;border:1px solid rgba(205,201,192,0.12);">
                <div style="text-align: center; margin-bottom: 28px;">
                  <img src="https://portal.salonenvyusa.com/images/logo-white.png" alt="Salon Envy" width="160" style="display:inline-block;" />
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 8px;">Your sign-in link</h2>
                <p style="color: #94A3B8; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
                  Click the button below to sign in to the Salon Envy\u00ae Management Portal. This link expires in 24 hours.
                </p>
                <a href="${url}" style="display:block;background-color:#CDC9C0;color:#0f1d24;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;margin-bottom:24px;">
                  Sign In to Portal
                </a>
                <p style="color: #555; font-size: 12px; text-align: center; margin: 0;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        });
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (user.inviteStatus === "INVITED") return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      const email = user?.email;
      if (!email) return false;

      if (account?.provider === "google") {
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          const role = email === "ceo@36west.org" ? "OWNER" : "STYLIST";
          const inviteStatus = email === "ceo@36west.org" ? "ACCEPTED" : "INVITED";
          dbUser = await prisma.user.create({
            data: {
              email,
              name: user.name ?? undefined,
              role,
              inviteStatus,
            },
          });
        }
        if (dbUser.inviteStatus === "INVITED") {
          return "/login?error=PendingApproval";
        }
        return true;
      }

      if (account?.provider === "email") {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) return "/login?error=NotFound";
        if (dbUser.inviteStatus === "INVITED") return "/login?error=PendingApproval";
        return true;
      }

      return false;
    },
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email) as string | undefined;
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          include: { location: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.locationId = dbUser.locationId;
          token.locationName = dbUser.location?.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        (session.user as any).locationId = token.locationId;
        (session.user as any).locationName = token.locationName;
      }
      return session;
    },
  },
};
