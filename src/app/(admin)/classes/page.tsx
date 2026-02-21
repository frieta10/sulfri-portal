"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"

type Class = {
  id: string
  title: string
  clientName: string
  clientType: string
  status: string
  mode: string
  startDatetime: string
  joinCode: string
  joinEnabled: boolean
  _count: {
    registrations: number
  }
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchClasses()
  }, [statusFilter])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      if (search) {
        params.append("search", search)
      }

      const response = await fetch(`/api/classes?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch classes")
      }

      const data = await response.json()
      setClasses(data.classes)
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast.error("Failed to load classes")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchClasses()
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800"
      case "ONGOING":
        return "bg-green-100 text-green-800"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">
            Manage your training classes and registrations
          </p>
        </div>
        <Link href="/classes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by title or client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline" aria-label="Search">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes ({classes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No classes found.</p>
              <Link href="/classes/new">
                <Button className="mt-4">Create Your First Class</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Title
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Mode
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Registrations
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Join Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        {classItem.title}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{classItem.clientName}</div>
                          <div className="text-sm text-gray-500">
                            {classItem.clientType}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{classItem.mode.replace("_", " ")}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            classItem.status
                          )}`}
                        >
                          {classItem.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/classes/${classItem.id}/registrations`}
                          className="text-blue-600 hover:underline"
                        >
                          {classItem._count.registrations}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(classItem.startDatetime).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {classItem.joinCode}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/classes/${classItem.id}`}
                          aria-label={`View ${classItem.title}`}
                        >
                          <Button variant="outline" size="sm" aria-label="View details">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
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
