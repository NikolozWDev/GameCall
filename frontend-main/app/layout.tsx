import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GameCall - Voice Calls Made Simple",
  description: "Create or join voice rooms instantly. Perfect for gaming, meetings, and hangouts.",
  generator: "v0.app",
  icons: {
    icon: "/gamecall-logo.png",
    apple: "/gamecall-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#04070E]">
        <AuthProvider>
          <SmoothScroll />
          <Header />
          <main className="relative">{children}</main>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}