"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/classes", label: "Classes" },
  { href: "/profile-settings", label: "Profile Settings" },
  { href: "/downloads", label: "Downloads" },
  { href: "/admin/badges", label: "Badges" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/change-password", label: "Change Password" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-700 hover:text-gray-900"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <nav className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-3 rounded-md text-sm font-medium border-b border-gray-100 last:border-0"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
