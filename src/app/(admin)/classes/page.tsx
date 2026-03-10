"use client"

import { useEffect, useState, useRef } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Search, ExternalLink, Upload, Download, FileSpreadsheet, X, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

type Class = {
  id: string
  title: string
  clientName: string
  clientType: string
  clientLogoUrl: string | null
  status: string
  mode: string
  dateType: "STRAIGHT" | "SEGREGATED"
  numberOfDays: number
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
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const downloadTemplate = () => {
    window.open("/api/classes/bulk", "_blank")
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/classes/bulk", {
        method: "POST",
        body: formData,
      })

      const results = await response.json()

      if (!response.ok) {
        throw new Error(results.error || "Import failed")
      }

      setImportResults(results)
      
      if (results.success > 0) {
        toast.success(`Successfully imported ${results.success} classes!`)
        fetchClasses()
      }
      
      if (results.failed > 0) {
        toast.error(`${results.failed} classes failed to import`)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import classes")
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
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

  // Get client initials for avatar
  const getClientInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  // Get color based on client type
  const getClientColor = (type: string) => {
    switch (type) {
      case "GOVERNMENT":
        return "bg-blue-500"
      case "GLC":
        return "bg-emerald-500"
      case "CORPORATE":
        return "bg-rose-500"
      case "ACADEMIC":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Link href="/classes/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Class
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Classes</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple classes at once. 
              Dates can be in the past for completed classes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Download Template */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div className="flex-1">
                  <h4 className="font-medium">CSV Template</h4>
                  <p className="text-sm text-slate-500">
                    Download the template file with the correct column format
                  </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-400">CSV files only</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select CSV File
                  </>
                )}
              </Button>
            </div>

            {/* Results */}
            {importResults && (
              <div className={`p-4 rounded-lg ${importResults.failed > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
                <h4 className="font-medium mb-2">
                  Import Results: {importResults.success} success, {importResults.failed} failed
                </h4>
                
                {importResults.errors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {importResults.errors.slice(0, 10).map((error: string, idx: number) => (
                        <li key={idx}>• {error}</li>
                      ))}
                      {importResults.errors.length > 10 && (
                        <li>... and {importResults.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CSV Format Help */}
            <div className="text-sm text-slate-500">
              <p className="font-medium mb-1">Required columns:</p>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                title, clientName, clientType, topicCategory, mode
              </code>
              <p className="font-medium mt-2 mb-1">Optional columns:</p>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                clientLogoUrl, location, startDate, endDate, notes, status
              </code>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                      Schedule
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
                        <div className="flex items-center gap-3">
                          {/* Client Logo/Avatar */}
                          {classItem.clientLogoUrl ? (
                            <img
                              src={classItem.clientLogoUrl}
                              alt={classItem.clientName}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${getClientColor(classItem.clientType)}`}>
                              {getClientInitials(classItem.clientName)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{classItem.clientName}</div>
                            <div className="text-sm text-gray-500">
                              {classItem.clientType}
                            </div>
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
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">
                            {classItem.dateType === "STRAIGHT" ? "Straight" : "Segregated"} • {classItem.numberOfDays} day{classItem.numberOfDays > 1 ? "s" : ""}
                          </span>
                          <span>
                            {new Date(classItem.startDatetime).toLocaleDateString()}
                            {classItem.numberOfDays > 1 && (
                              <>
                                {" - "}
                                {new Date(classItem.startDatetime).toLocaleDateString()}
                              </>
                            )}
                          </span>
                        </div>
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
