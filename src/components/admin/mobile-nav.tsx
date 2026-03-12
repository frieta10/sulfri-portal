"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Menu,
  X,
  LayoutDashboard,
  GraduationCap,
  UserCircle,
  Download,
  Award,
  Tag,
  GitBranch,
  Calendar,
  Users,
  QrCode,
  Settings,
  Lock,
  LogOut,
  Sparkles,
  Kanban,
  Mail,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/profile-settings", label: "Profile Settings", icon: UserCircle },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/skills", label: "Skills", icon: Tag },
  { href: "/expertise", label: "Expertise Tree", icon: GitBranch },
  { href: "/admin/courses", label: "Event Courses", icon: Calendar },
  { href: "/admin/leads", label: "Event Leads", icon: Users },
  { href: "/admin/qr", label: "QR Codes", icon: QrCode },
  { href: "/admin/event-settings", label: "Event Settings", icon: Settings },
  { href: "/admin/pipeline", label: "CRM Pipeline", icon: Kanban },
  { href: "/admin/email-log", label: "Email Log", icon: Mail },
  { href: "/change-password", label: "Change Password", icon: Lock },
]

interface MobileNavProps {
  userEmail?: string
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-400 hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out menu */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-72 bg-slate-950 border-l border-green-500/20 z-50 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Top glow line */}
        <div className="h-px bg-gradient-to-r from-green-500/50 to-transparent" />

        {/* Header */}
        <div className="p-4 border-b border-green-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-white text-sm">
                MENU
              </h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-slate-400 hover:text-green-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        {userEmail && (
          <div className="px-4 py-3 border-b border-green-500/10 bg-green-500/5">
            <p className="text-xs text-slate-500">Logged in as</p>
            <p className="text-sm text-green-400 font-medium truncate">{userEmail}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-180px)]">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  active
                    ? "text-green-400 bg-green-500/10 border-l-2 border-green-400"
                    : "text-slate-400 hover:text-green-400 hover:bg-green-500/5"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    active
                      ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                      : "text-slate-500"
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-500/10 bg-slate-950">
          <Link
            href="/api/auth/signout"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
