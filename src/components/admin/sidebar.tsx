"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
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
  ChevronLeft,
  ChevronRight,
  Quote,
  Building2,
  BarChart3,
  Kanban,
  Mail,
  FileText,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/profile-settings", label: "Profile", icon: UserCircle },
  { href: "/downloads", label: "Downloads", icon: Download },
]

const credentialNavItems: NavItem[] = [
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/skills", label: "Skills", icon: Tag },
  { href: "/expertise", label: "Expertise Tree", icon: GitBranch },
]

const eventNavItems: NavItem[] = [
  { href: "/admin/courses", label: "Event Courses", icon: Calendar },
  { href: "/admin/leads", label: "Event Leads", icon: Users },
  { href: "/admin/qr", label: "QR Codes", icon: QrCode },
  { href: "/admin/event-settings", label: "Event Settings", icon: Settings },
]

const crmNavItems: NavItem[] = [
  { href: "/admin/pipeline", label: "Pipeline", icon: Kanban },
]

const showcaseNavItems: NavItem[] = [
  { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { href: "/admin/case-studies", label: "Case Studies", icon: Building2 },
  { href: "/admin/showcase-stats", label: "Showcase Stats", icon: BarChart3 },
  { href: "/admin/proposals", label: "Proposals", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
]

const systemNavItems: NavItem[] = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/email-log", label: "Email Log", icon: Mail },
  { href: "/change-password", label: "Security", icon: Lock },
]

interface SidebarProps {
  userEmail?: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-6">
      {!collapsed && (
        <h3 className="px-4 mb-2 text-xs font-bold uppercase tracking-wider text-green-500/60">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                collapsed ? "justify-center" : "",
                active
                  ? "text-green-400 bg-green-500/10 border-r-2 border-green-400"
                  : "text-slate-400 hover:text-green-400 hover:bg-green-500/5"
              )}
            >
              {/* Glow effect for active item */}
              {active && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent pointer-events-none" />
              )}
              
              <Icon
                className={cn(
                  "w-5 h-5 transition-all duration-200 flex-shrink-0",
                  active
                    ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                    : "text-slate-500 group-hover:text-green-400 group-hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]"
                )}
              />
              
              {!collapsed && (
                <span className="truncate">
                  {item.label}
                </span>
              )}
              
              {/* Active indicator dot */}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-slate-950 border-r border-green-500/20 z-40 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
      
      {/* Logo Area */}
      <div className="p-4 border-b border-green-500/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] flex-shrink-0 overflow-hidden">
            <img 
              src="/msh-logo.svg" 
              alt="MSH" 
              className="w-10 h-10 object-contain"
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">
                MSH<span className="text-green-400">.ADMIN</span>
              </h1>
              <p className="text-[10px] text-green-500/60 uppercase tracking-widest">
                Trainer Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent">
        <NavSection title="Main" items={mainNavItems} />
        <NavSection title="Credentials" items={credentialNavItems} />
        <NavSection title="Event Management" items={eventNavItems} />
        <NavSection title="CRM" items={crmNavItems} />
        <NavSection title="Showcase" items={showcaseNavItems} />
        <NavSection title="System" items={systemNavItems} />
      </div>

      {/* Bottom Section */}
      <div className="border-t border-green-500/10 p-4 space-y-3">
        {/* User Info */}
        {!collapsed && userEmail && (
          <div className="px-4 py-2 rounded-lg bg-slate-900/50 border border-green-500/10">
            <p className="text-xs text-slate-500 mb-1">Logged in as</p>
            <p className="text-sm text-green-400 font-medium truncate">{userEmail}</p>
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-400 hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/5 border border-transparent hover:border-green-500/20"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {/* Logout */}
        <Link
          href="/api/auth/signout"
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/20",
            collapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </Link>
      </div>

      {/* Bottom glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
    </aside>
  )
}
