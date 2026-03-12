import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Sidebar } from "@/components/admin/sidebar"
import { MobileNav } from "@/components/admin/mobile-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar userEmail={session.user.email} />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-950 border-b border-green-500/20 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)] overflow-hidden">
              <img 
                src="/msh-logo.svg" 
                alt="MSH" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <h1 className="font-bold text-white">
              MSH<span className="text-green-400">.ADMIN</span>
            </h1>
          </div>
          <MobileNav userEmail={session.user.email} />
        </div>
        {/* Mobile glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top decorative line */}
        <div className="h-px bg-gradient-to-r from-green-500/30 via-green-500/10 to-transparent" />
        
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
