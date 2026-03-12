import { prisma } from "@/lib/prisma"
import { NeonCard, NeonCardHeader, NeonBadge } from "@/components/ui/neon-card"
import {
  GraduationCap,
  Calendar,
  Users,
  CheckCircle,
  Award,
  Tag,
  GitBranch,
  Sparkles,
  TrendingUp,
  BarChart3,
  Eye,
  Download,
  FileText,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  // Default values
  let totalClasses = 0
  let upcomingClasses = 0
  let totalRegistrations = 0
  let completedClasses = 0
  let recentClasses: any[] = []

  // CR-03 Stats
  let totalCourses = 0
  let publishedCourses = 0
  let totalLeads = 0
  let newLeads = 0

  // CR-04 Analytics Stats
  let totalPageViews = 0
  let uniqueVisitors = 0
  let pdfDownloads = 0
  let proposalRequests = 0
  let conversionRate = 0

  // Core stats - these should always work
  try {
    const [total, upcoming, registrations, completed] = await Promise.all([
      prisma.class.count().catch(() => 0),
      prisma.class.count({ where: { status: "UPCOMING" } }).catch(() => 0),
      prisma.registration.count().catch(() => 0),
      prisma.class.count({ where: { status: "COMPLETED" } }).catch(() => 0),
    ])

    totalClasses = total
    upcomingClasses = upcoming
    totalRegistrations = registrations
    completedClasses = completed
  } catch (e) {
    console.error("Error fetching core stats:", e)
  }

  // CR-03 stats
  try {
    const [courses, published, leads, newLeadCount] = await Promise.all([
      prisma.eventCourse.count().catch(() => 0),
      prisma.eventCourse.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
      prisma.eventLead.count().catch(() => 0),
      prisma.eventLead.count({ where: { status: "NEW" } }).catch(() => 0),
    ])

    totalCourses = courses
    publishedCourses = published
    totalLeads = leads
    newLeads = newLeadCount
  } catch (e) {
    console.error("Error fetching CR-03 stats:", e)
  }

  // CR-04 stats (with error handling)
  try {
    const pageViews = await prisma.analyticsEvent
      .count({
        where: {
          eventType: "page_view",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      })
      .catch(() => 0)

    const visitors = await prisma.analyticsEvent
      .groupBy({
        by: ["ipHash"],
        where: {
          ipHash: { not: null },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: { ipHash: true },
      })
      .then((result) => result.length)
      .catch(() => 0)

    const downloads = await prisma.pdfDownloadLog
      .count({
        where: { downloadedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      })
      .catch(() => 0)

    const proposals = await prisma.proposalRequest
      .count({
        where: { submittedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      })
      .catch(() => 0)

    totalPageViews = pageViews
    uniqueVisitors = visitors
    pdfDownloads = downloads
    proposalRequests = proposals
    conversionRate = totalLeads > 0 ? Math.round((newLeads / totalLeads) * 100) : 0
  } catch (e) {
    console.error("Error fetching CR-04 analytics:", e)
  }

  // Recent classes
  try {
    recentClasses = await prisma.class.findMany({
      take: 5,
      orderBy: { startDatetime: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        startDatetime: true,
        _count: { select: { registrations: true } },
      },
    })
  } catch (e) {
    console.error("Error fetching recent classes:", e)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your training portal.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">View Analytics</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Classes */}
        <NeonCard>
          <NeonCardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-400">Total Classes</span>
            <GraduationCap className="w-4 h-4 text-green-400" />
          </NeonCardHeader>
          <div className="text-2xl font-bold text-white">{totalClasses}</div>
          <p className="text-xs text-slate-500 mt-1">
            {upcomingClasses} upcoming
          </p>
        </NeonCard>

        {/* Registrations */}
        <NeonCard>
          <NeonCardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-400">Registrations</span>
            <Users className="w-4 h-4 text-green-400" />
          </NeonCardHeader>
          <div className="text-2xl font-bold text-white">{totalRegistrations}</div>
          <p className="text-xs text-slate-500 mt-1">
            {totalClasses > 0 ? Math.round(totalRegistrations / totalClasses) : 0} avg per class
          </p>
        </NeonCard>

        {/* Completed */}
        <NeonCard>
          <NeonCardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-400">Completed</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </NeonCardHeader>
          <div className="text-2xl font-bold text-white">{completedClasses}</div>
          <p className="text-xs text-slate-500 mt-1">
            {totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0}% completion rate
          </p>
        </NeonCard>

        {/* Event Leads */}
        <NeonCard>
          <NeonCardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-400">Event Leads</span>
            <Sparkles className="w-4 h-4 text-green-400" />
          </NeonCardHeader>
          <div className="text-2xl font-bold text-white">{totalLeads}</div>
          <p className="text-xs text-slate-500 mt-1">
            {newLeads} new leads
          </p>
        </NeonCard>
      </div>

      {/* Analytics Overview (CR-04) */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Analytics Overview (30 days)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <NeonCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10" />
            <NeonCardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-400">Page Views</span>
              <Eye className="w-4 h-4 text-green-400" />
            </NeonCardHeader>
            <div className="text-2xl font-bold text-white">{totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Total views</p>
          </NeonCard>

          <NeonCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10" />
            <NeonCardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-400">Unique Visitors</span>
              <Users className="w-4 h-4 text-green-400" />
            </NeonCardHeader>
            <div className="text-2xl font-bold text-white">{uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Unique IPs</p>
          </NeonCard>

          <NeonCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10" />
            <NeonCardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-400">PDF Downloads</span>
              <Download className="w-4 h-4 text-green-400" />
            </NeonCardHeader>
            <div className="text-2xl font-bold text-white">{pdfDownloads}</div>
            <p className="text-xs text-slate-500 mt-1">Profile downloads</p>
          </NeonCard>

          <NeonCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10" />
            <NeonCardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-400">Proposals</span>
              <FileText className="w-4 h-4 text-green-400" />
            </NeonCardHeader>
            <div className="text-2xl font-bold text-white">{proposalRequests}</div>
            <p className="text-xs text-slate-500 mt-1">New requests</p>
          </NeonCard>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/classes/new", icon: GraduationCap, label: "New Class", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
            { href: "/admin/courses/new", icon: Calendar, label: "New Course", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            { href: "/profile-settings", icon: Award, label: "Profile", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { href: "/admin/settings", icon: Sparkles, label: "Settings", color: "bg-green-500/10 text-green-400 border-green-500/20" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`p-4 rounded-lg border ${action.color} hover:opacity-80 transition-opacity`}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classes */}
        <NeonCard>
          <NeonCardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <span className="text-lg font-semibold text-white">Recent Classes</span>
            </div>
            <Link
              href="/classes"
              className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </NeonCardHeader>
          <div className="space-y-3">
            {recentClasses.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No classes yet</p>
            ) : (
              recentClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-green-500/10"
                >
                  <div>
                    <p className="font-medium text-white text-sm">{cls.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(cls.startDatetime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {cls._count.registrations} registered
                    </span>
                    <NeonBadge
                      variant={
                        cls.status === "COMPLETED"
                          ? "success"
                          : cls.status === "ONGOING"
                          ? "warning"
                          : "default"
                      }
                    >
                      {cls.status}
                    </NeonBadge>
                  </div>
                </div>
              ))
            )}
          </div>
        </NeonCard>

        {/* Management Links */}
        <NeonCard>
          <NeonCardHeader>
            <span className="text-lg font-semibold text-white">Management</span>
          </NeonCardHeader>
          <div className="space-y-2">
            {[
              { href: "/admin/badges", icon: Award, label: "Badges", desc: "Manage certifications" },
              { href: "/admin/skills", icon: Tag, label: "Skills", desc: "Skill catalog" },
              { href: "/expertise", icon: GitBranch, label: "Expertise Tree", desc: "Training expertise" },
              { href: "/admin/pipeline", icon: Users, label: "Lead Pipeline", desc: "CRM & leads" },
              { href: "/admin/testimonials", icon: Sparkles, label: "Testimonials", desc: "Client reviews" },
              { href: "/admin/case-studies", icon: CheckCircle, label: "Case Studies", desc: "Success stories" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-green-500/10 hover:border-green-500/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <item.icon className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-green-400 transition-colors" />
              </Link>
            ))}
          </div>
        </NeonCard>
      </div>
    </div>
  )
}
