import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/providers/toast-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Sulfri Trainer Portal",
    template: "%s | Sulfri Trainer Portal",
  },
  description: "Professional trainer profile, class registration, and resource downloads",
  keywords: ["trainer", "training", "classes", "registration", "professional development"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Sulfri Trainer Portal",
    title: "Sulfri Trainer Portal",
    description: "Professional trainer profile, class registration, and resource downloads",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
