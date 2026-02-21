import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Register for Class",
  description: "Register for a training class on Sulfri Trainer Portal",
}

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
