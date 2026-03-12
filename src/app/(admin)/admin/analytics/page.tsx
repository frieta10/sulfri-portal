"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  BarChart3,
  Users,
  Eye,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  MessageCircle,
  Award,
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react"
import { NeonCard, NeonCardHeader, NeonBadge, NeonButton } from "@/components/ui/neon-card"
import toast from "react-hot-toast"

interface AnalyticsData {
  generatedAt: string
  metrics: {
    totalPageViews: number
    uniqueVisitors: number
    pdfDownloads: {
      total: number
      summary: number
      full: number
    }
    proposalRequests: number
    eventRegistrations: number
    conversionRate: number
    whatsappClicks: number
    badgeWalletViews: number
  }
  charts: {
    downloadsTrend: Array<{ date: string; summary: number; full: number; total: number }>
    topTopics: Array<{ topic: string; count: number }>
    leadSources: Array<{ source: string; count: number; color: string }>
    dailyPageViews: Array<{ date: string; views: number }>
  }
  recentActivity: Array<{
    id: string
    type: string
    data: any
    timestamp: string
  }>
  range: string
}

interface DownloadLog {
  id: string
  pdfType: string
  referrerPage: string | null
  userAgent: string | null
  ipHash: string | null
  downloadedAt: string
}

type DateRange = "7d" | "30d" | "90d" | "all"

const rangeLabels: Record<DateRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  all: "All Time",
}

const metricCards = [
  { key: "totalPageViews", label: "Page Views", icon: Eye, color: "text-blue-400", bgGlow: "shadow-blue-500/20" },
  { key: "uniqueVisitors", label: "Unique Visitors", icon: Users, color: "text-purple-400", bgGlow: "shadow-purple-500/20" },
  { key: "conversionRate", label: "Conversion Rate", icon: TrendingUp, color: "text-green-400", bgGlow: "shadow-green-500/20", suffix: "%" },
  { key: "pdfDownloads", label: "PDF Downloads", icon: Download, color: "text-amber-400", bgGlow: "shadow-amber-500/20" },
  { key: "proposalRequests", label: "Proposals", icon: FileText, color: "text-pink-400", bgGlow: "shadow-pink-500/20" },
  { key: "eventRegistrations", label: "Event Leads", icon: Calendar, color: "text-cyan-400", bgGlow: "shadow-cyan-500/20" },
  { key: "whatsappClicks", label: "WhatsApp Clicks", icon: MessageCircle, color: "text-emerald-400", bgGlow: "shadow-emerald-500/20" },
  { key: "badgeWalletViews", label: "Badge Views", icon: Award, color: "text-yellow-400", bgGlow: "shadow-yellow-500/20" },
]

const getActivityLabel = (type: string): string => {
  const labels: Record<string, string> = {
    page_view: "Page View",
    pdf_download_summary: "PDF Download (Summary)",
    pdf_download_full: "PDF Download (Full)",
    whatsapp_click: "WhatsApp Click",
    proposal_submit: "Proposal Submitted",
    badge_view: "Badge Wallet Viewed",
    skill_view: "Skills Viewed",
    case_study_view: "Case Study Viewed",
    testimonial_view: "Testimonial Viewed",
  }
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>("30d")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  // Download logs state
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([])
  const [downloadPage, setDownloadPage] = useState(1)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [hasMoreDownloads, setHasMoreDownloads] = useState(false)

  useEffect(() => {
    fetchAnalytics()
    fetchDownloadLogs(1)
  }, [range])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics/summary?range=${range}`)
      if (!response.ok) {
        throw new Error("Failed to fetch analytics")
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  const fetchDownloadLogs = async (page: number) => {
    setDownloadLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics/downloads?range=${range}&page=${page}&limit=10`)
      if (!response.ok) {
        throw new Error("Failed to fetch download logs")
      }
      const logsData = await response.json()
      
      if (page === 1) {
        setDownloadLogs(logsData.downloads)
      } else {
        setDownloadLogs((prev) => [...prev, ...logsData.downloads])
      }
      setHasMoreDownloads(logsData.pagination.hasMore)
      setDownloadPage(page)
    } catch (error) {
      console.error("Error fetching download logs:", error)
      toast.error("Failed to load download logs")
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch(`/api/admin/analytics/export?range=${range}`)
      if (!response.ok) {
        throw new Error("Failed to export analytics")
      }
      
      // Download the CSV file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-export-${range}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success("Analytics exported successfully")
    } catch (error) {
      console.error("Error exporting analytics:", error)
      toast.error("Failed to export analytics")
    } finally {
      setExporting(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-MY", {
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-400" />
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Track visitor engagement, conversions, and portal performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DateRange)}
            className="bg-slate-900 border border-green-500/30 text-white text-sm rounded-lg px-4 py-2 focus:border-green-400 focus:ring-1 focus:ring-green-400/50"
          >
            {(Object.keys(rangeLabels) as DateRange[]).map((r) => (
              <option key={r} value={r}>
                {rangeLabels[r]}
              </option>
            ))}
          </select>
          <NeonButton
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export CSV
          </NeonButton>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          let value: number | string = 0
          
          if (data) {
            if (card.key === "pdfDownloads") {
              value = data.metrics.pdfDownloads.total
            } else {
              value = data.metrics[card.key as keyof typeof data.metrics] as number
            }
          }
          
          return (
            <NeonCard
              key={card.key}
              variant="glow"
              className={`relative overflow-hidden group ${card.bgGlow}`}
            >
              <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.bgGlow} rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(typeof value === "number" ? value : 0)}
                  {card.suffix || ""}
                </div>
                <div className="text-xs text-slate-400">{card.label}</div>
              </div>
            </NeonCard>
          )
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downloads Trend */}
        <NeonCard>
          <NeonCardHeader
            title="PDF Downloads Trend"
            description="Summary vs Full profile downloads over time"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts.downloadsTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => formatDate(date)}
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #22c55e",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="summary"
                  name="Summary PDF"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e" }}
                />
                <Line
                  type="monotone"
                  dataKey="full"
                  name="Full PDF"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>

        {/* Top Topics */}
        <NeonCard>
          <NeonCardHeader
            title="Top Training Topics"
            description="Most requested topics from proposal forms"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.charts.topTopics.slice(0, 8) || []}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="topic"
                  stroke="#64748b"
                  fontSize={11}
                  width={120}
                  tickFormatter={(value) =>
                    value.length > 20 ? value.substring(0, 20) + "..." : value
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #22c55e",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="count" name="Requests" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <NeonCard>
          <NeonCardHeader
            title="Lead Sources"
            description="Distribution of leads by source"
          />
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts.leadSources || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="source"
                >
                  {(data?.charts.leadSources || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #22c55e",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>

        {/* Daily Page Views */}
        <NeonCard>
          <NeonCardHeader
            title="Daily Page Views"
            description="Visitor traffic over time"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.dailyPageViews || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => formatDate(date)}
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #22c55e",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="views" name="Page Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>
      </div>

      {/* Bottom Row: Recent Activity & Download Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <NeonCard>
          <NeonCardHeader
            title="Recent Activity"
            description="Latest visitor interactions"
          />
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/20">
            {data?.recentActivity.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No recent activity</p>
            ) : (
              data?.recentActivity.map((activity, index) => (
                <div
                  key={`${activity.id}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-green-500/10 hover:border-green-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    <span className="text-sm text-slate-300">
                      {getActivityLabel(activity.type)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(activity.timestamp).toLocaleTimeString("en-MY", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </NeonCard>

        {/* Download Logs */}
        <NeonCard>
          <NeonCardHeader
            title="Download Logs"
            description="Recent PDF downloads"
          />
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/20">
            {downloadLogs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No downloads yet</p>
            ) : (
              <>
                {downloadLogs.map((log, index) => (
                  <div
                    key={`${log.id}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-green-500/10 hover:border-green-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-sm text-slate-300 capitalize">
                          {log.pdfType} PDF
                        </span>
                        {log.referrerPage && (
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">
                            From: {log.referrerPage}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(log.downloadedAt).toLocaleDateString("en-MY", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
                {hasMoreDownloads && (
                  <button
                    onClick={() => fetchDownloadLogs(downloadPage + 1)}
                    disabled={downloadLoading}
                    className="w-full py-2 text-sm text-green-400 hover:text-green-300 transition-colors flex items-center justify-center gap-2"
                  >
                    {downloadLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Load More
                        <ChevronLeft className="w-4 h-4 rotate-90" />
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </NeonCard>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500">
        Last updated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString("en-MY") : "-"}
      </div>
    </div>
  )
}
