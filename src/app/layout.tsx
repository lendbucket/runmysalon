import type { Metadata, Viewport } from "next"
import { Inter, Noto_Serif } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif",
})

export const metadata: Metadata = {
  title: "RunMySalon — Salon Management Platform",
  description: "The complete management platform for modern salons. Appointments, staff, payroll, clients, and AI insights — all in one place.",
  manifest: "/manifest.json",
  applicationName: "RunMySalon",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RunMySalon",
  },
  icons: {
    apple: "/images/logo-white.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#06080d",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoSerif.variable}`}
        style={{ backgroundColor: "#0f1d24", margin: 0 }}
      >
        <Providers>
          {children}
        </Providers>
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</Script>
      </body>
    </html>
  )
}
