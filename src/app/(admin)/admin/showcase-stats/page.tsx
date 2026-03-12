"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Save, BarChart3, GraduationCap, Clock, Users, Building2 } from "lucide-react"
import toast from "react-hot-toast"

interface ShowcaseStat {
  id: string
  statKey: string
  statValue: number
  label: string
  updatedAt: string
}

const statConfig: Record<string, { icon: React.ElementType; title: string; description: string; placeholder: string }> = {
  classes_completed: {
    icon: GraduationCap,
    title: "Classes Completed",
    description: "Total number of training sessions delivered",
    placeholder: "e.g., 150",
  },
  hours_delivered: {
    icon: Clock,
    title: "Hours Delivered",
    description: "Total training hours conducted",
    placeholder: "e.g., 2500",
  },
  participants_trained: {
    icon: Users,
    title: "Participants Trained",
    description: "Total number of individuals trained",
    placeholder: "e.g., 5000",
  },
  unique_clients: {
    icon: Building2,
    title: "Unique Clients",
    description: "Number of different organizations served",
    placeholder: "e.g., 45",
  },
}

// Order for displaying stats
const statOrder = ["classes_completed", "hours_delivered", "participants_trained", "unique_clients"]

export default function ShowcaseStatsPage() {
  const [stats, setStats] = useState<ShowcaseStat[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form data for each stat
  const [formData, setFormData] = useState<Record<string, { statValue: number; label: string }>>({})

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/showcase-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        
        // Initialize form data from fetched stats
        const initialFormData: Record<string, { statValue: number; label: string }> = {}
        data.forEach((stat: ShowcaseStat) => {
          initialFormData[stat.statKey] = {
            statValue: stat.statValue,
            label: stat.label,
          }
        })
        setFormData(initialFormData)
      } else {
        toast.error("Failed to load showcase stats")
      }
    } catch (error) {
      console.error("Error fetching showcase stats:", error)
      toast.error("Failed to load showcase stats")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Build stats array for bulk update
      const statsToUpdate = statOrder.map((statKey) => ({
        statKey,
        statValue: formData[statKey]?.statValue ?? 0,
        label: formData[statKey]?.label || statConfig[statKey].title,
      }))

      const response = await fetch("/api/admin/showcase-stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: statsToUpdate }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update stats")
      }

      toast.success("Showcase statistics saved successfully!")
      fetchStats()
    } catch (error: any) {
      toast.error(error.message || "Failed to update stats")
    } finally {
      setSaving(false)
    }
  }

  const handleStatChange = (statKey: string, field: "statValue" | "label", value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [statKey]: {
        ...prev[statKey],
        [field]: field === "statValue" ? (typeof value === "string" ? parseInt(value) || 0 : value) : value,
      },
    }))
  }

  // Get current value for display
  const getCurrentValue = (statKey: string) => {
    const stat = stats.find((s) => s.statKey === statKey)
    return stat?.statValue ?? 0
  }

  // Get last updated
  const getLastUpdated = (statKey: string) => {
    const stat = stats.find((s) => s.statKey === statKey)
    if (!stat?.updatedAt) return "Never"
    return new Date(stat.updatedAt).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Showcase Statistics</h1>
        <p className="text-slate-400 mt-1">
          Edit the key statistics displayed on your public profile
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stats Overview Card */}
        <Card className="bg-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <BarChart3 className="w-5 h-5" />
              Current Statistics
            </CardTitle>
            <CardDescription className="text-slate-500">
              These numbers are displayed on your public profile to showcase your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statOrder.map((statKey) => {
                const config = statConfig[statKey]
                const Icon = config.icon
                const currentValue = getCurrentValue(statKey)

                return (
                  <div
                    key={statKey}
                    className="bg-slate-950/50 rounded-lg p-4 border border-green-500/10 text-center"
                  >
                    <Icon className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{currentValue.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">{config.title}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Edit Stats */}
        <Card className="bg-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400">Edit Values</CardTitle>
            <CardDescription className="text-slate-500">
              Update the statistics and their display labels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {statOrder.map((statKey) => {
                const config = statConfig[statKey]
                const Icon = config.icon
                const formValues = formData[statKey] || { statValue: 0, label: config.title }

                return (
                  <div
                    key={statKey}
                    className="bg-slate-950/30 rounded-lg p-4 border border-green-500/10 space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{config.title}</h3>
                        <p className="text-xs text-slate-500">Last updated: {getLastUpdated(statKey)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${statKey}-value`} className="text-slate-300">
                        Value
                      </Label>
                      <Input
                        id={`${statKey}-value`}
                        type="number"
                        min={0}
                        value={formValues.statValue}
                        onChange={(e) => handleStatChange(statKey, "statValue", e.target.value)}
                        placeholder={config.placeholder}
                        className="bg-slate-900 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${statKey}-label`} className="text-slate-300">
                        Display Label
                      </Label>
                      <Input
                        id={`${statKey}-label`}
                        value={formValues.label}
                        onChange={(e) => handleStatChange(statKey, "label", e.target.value)}
                        placeholder={config.title}
                        className="bg-slate-900 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
                      />
                      <p className="text-xs text-slate-500">{config.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-500 text-slate-950 font-semibold"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Statistics"}
          </Button>
        </div>
      </form>
    </div>
  )
}
