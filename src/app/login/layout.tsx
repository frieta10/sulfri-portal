import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Sign in to the Sulfri Trainer Portal admin panel",
  robots: { index: false, follow: false },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
