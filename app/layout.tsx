import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "BrandCore - AI-Powered Brandable Domain Generator",
  description:
    "Discover unique, brandable domain names with 95-100% availability. Fast and advanced AI-powered crawling with real-time results from modern English dictionaries.",
  keywords: [
    "domain generator",
    "brandable domains",
    "AI domain finder",
    "domain availability",
    "brand names",
    "domain search",
  ],
  authors: [{ name: "BrandCore" }],
  generator: "v0.app",
  openGraph: {
    title: "BrandCore - AI-Powered Brandable Domain Generator",
    description: "Discover unique, brandable domain names with 95-100% availability",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
