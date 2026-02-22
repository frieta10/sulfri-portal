"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Search, Users } from "lucide-react"
import toast from "react-hot-toast"

type Registration = {
  id: string
  fullName: string
  email: string
  phone: string | null
  organization: string | null
  consentFlag: boolean
  registeredAt: string
}

type ClassInfo = {
  id: string
  title: string
  joinCode: string
}

export default function RegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchRegistrations()
  }, [id])

  const fetchRegistrations = async (searchQuery?: string) => {
    try {
      setLoading(true)
      const params_url = new URLSearchParams()

      if (searchQuery) {
        params_url.append("search", searchQuery)
      }

      const response = await fetch(
        `/api/classes/${id}/registrations?${params_url.toString()}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch registrations")
      }

      const data = await response.json()
      setRegistrations(data.registrations)
      setClassInfo(data.class)
      setTotal(data.total)
    } catch (error) {
      console.error("Error fetching registrations:", error)
      toast.error("Failed to load registrations")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchRegistrations(search)
  }

  const handleExport = () => {
    // Trigger CSV download
    window.open(`/api/classes/${id}/export`, "_blank")
    toast.success("Exporting registrations to CSV...")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/classes/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Class
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registrations</h1>
            <p className="text-gray-600 mt-1">
              {classInfo?.title || "Loading..."} - {total} registration{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={handleExport} disabled={total === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="w-4 h-4" />
            </Button>
            {search && (
              <Button
                onClick={() => {
                  setSearch("")
                  fetchRegistrations()
                }}
                variant="ghost"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Registrations ({registrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading registrations...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {search
                  ? "No registrations match your search."
                  : "No registrations yet. Share the join link to get started!"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                      #
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                      Full Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                      Phone
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                      Organization
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                      Registered At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, index) => (
                    <tr
                      key={reg.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-medium">{reg.fullName}</td>
                      <td className="py-3 px-4 text-sm">
                        <a
                          href={`mailto:${reg.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {reg.email}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {reg.phone || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {reg.organization || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(reg.registeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
