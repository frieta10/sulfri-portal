import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Downloads",
  description: "Download documents and resources from Sulfri Trainer Portal",
}

export default function DownloadsPublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
