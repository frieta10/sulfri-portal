import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Sulfri Portal
              </Link>
              <nav className="hidden md:flex space-x-4" aria-label="Main navigation">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/classes"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Classes
                </Link>
                <Link
                  href="/profile-settings"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile Settings
                </Link>
                <Link
                  href="/downloads"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Downloads
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline text-sm text-gray-700">{session.user.email}</span>
              <Link
                href="/change-password"
                className="hidden md:inline text-sm text-gray-600 hover:text-gray-900"
              >
                Change Password
              </Link>
              <Link
                href="/api/auth/signout"
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </Link>
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
