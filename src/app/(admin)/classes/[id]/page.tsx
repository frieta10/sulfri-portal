"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ClassForm } from "@/components/admin/class-form"
import { type ClassFormData } from "@/lib/validations/class"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import { ArrowLeft, Copy, Trash2, Users, ExternalLink, Calendar, Clock } from "lucide-react"

type ClassSession = {
  id: string
  sessionDate: string
  startTime: string
  endTime: string
  displayOrder: number
}

type ClassDetail = {
  id: string
  title: string
  clientName: string
  clientType: string
  topicCategory: string
  mode: string
  location: string | null
  dateType: "STRAIGHT" | "SEGREGATED"
  numberOfDays: number
  startDatetime: string
  endDatetime: string
  notes: string | null
  status: string
  joinCode: string
  joinEnabled: boolean
  showOnPublicProfile: boolean
  sessions: ClassSession[]
  _count: {
    registrations: number
  }
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [classData, setClassData] = useState<ClassDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchClass()
  }, [id])

  const fetchClass = async () => {
    try {
      const response = await fetch(`/api/classes/${id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch class")
      }

      const data = await response.json()
      setClassData(data)
    } catch (error) {
      console.error("Error fetching class:", error)
      toast.error("Failed to load class")
      router.push("/classes")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: ClassFormData) => {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update class")
      }

      const updatedClass = await response.json()
      setClassData(updatedClass)
      setEditMode(false)
      toast.success("Class updated successfully!")
      router.refresh()
    } catch (error: any) {
      console.error("Error updating class:", error)
      toast.error(error.message || "Failed to update class")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this class? This will also delete all registrations.")) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/classes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete class")
      }

      toast.success("Class deleted successfully!")
      router.push("/classes")
      router.refresh()
    } catch (error: any) {
      console.error("Error deleting class:", error)
      toast.error(error.message || "Failed to delete class")
    } finally {
      setDeleting(false)
    }
  }

  const copyJoinLink = () => {
    const joinUrl = `${window.location.origin}/join/${classData?.joinCode}`
    navigator.clipboard.writeText(joinUrl)
    toast.success("Join link copied to clipboard!")
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "N/A"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTimeDisplay = (dateStr: string) => {
    if (!dateStr) return "N/A"
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateTimeDisplay = (dateStr: string) => {
    if (!dateStr) return "N/A"
    const date = new Date(dateStr)
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading class...</p>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Class not found</p>
        <Link href="/classes">
          <Button className="mt-4">Back to Classes</Button>
        </Link>
      </div>
    )
  }

  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${classData.joinCode}`

  // Prepare default values for edit form
  const getEditDefaultValues = (): Partial<ClassFormData> => {
    const baseValues = {
      title: classData.title,
      clientName: classData.clientName,
      clientType: classData.clientType as any,
      topicCategory: classData.topicCategory,
      mode: classData.mode as any,
      location: classData.location,
      dateType: classData.dateType,
      numberOfDays: classData.numberOfDays,
      startDatetime: new Date(classData.startDatetime).toISOString().slice(0, 16),
      endDatetime: new Date(classData.endDatetime).toISOString().slice(0, 16),
      notes: classData.notes,
      status: classData.status as any,
      joinEnabled: classData.joinEnabled,
      showOnPublicProfile: classData.showOnPublicProfile,
    }

    // For segregated dates, include sessions
    if (classData.dateType === "SEGREGATED" && classData.sessions.length > 0) {
      return {
        ...baseValues,
        sessions: classData.sessions.map(session => ({
          sessionDate: new Date(session.sessionDate).toISOString().split("T")[0],
          startTime: session.startTime,
          endTime: session.endTime,
        })),
      }
    }

    return baseValues
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/classes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classData.title}</h1>
            <p className="text-gray-600 mt-1">
              {classData.clientName} • {classData.clientType}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <>
              <Button onClick={() => setEditMode(true)} variant="outline">
                Edit Class
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
          {editMode && (
            <Button onClick={() => setEditMode(false)} variant="outline">
              Cancel Editing
            </Button>
          )}
        </div>
      </div>

      {!editMode ? (
        <>
          {/* Join Link Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Registration Link</span>
                <Badge
                  className={
                    classData.joinEnabled
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {classData.joinEnabled ? "Active" : "Disabled"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border rounded px-3 py-2 text-sm">
                    {joinUrl}
                  </code>
                  <Button onClick={copyJoinLink} size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Link href={joinUrl} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-600">
                  Share this link with participants to allow them to register for this class.
                  Join Code: <strong>{classData.joinCode}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{classData._count.registrations}</p>
                  <Link href={`/classes/${classData.id}/registrations`}>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  className={
                    classData.status === "UPCOMING"
                      ? "bg-blue-100 text-blue-800"
                      : classData.status === "ONGOING"
                      ? "bg-green-100 text-green-800"
                      : classData.status === "COMPLETED"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {classData.status}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {classData.mode.replace("_", " ")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Class Details */}
          <Card>
            <CardHeader>
              <CardTitle>Class Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Topic Category</p>
                  <p className="font-medium">{classData.topicCategory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{classData.location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Type</p>
                  <p className="font-medium">
                    {classData.dateType === "STRAIGHT" ? "Straight (Consecutive)" : "Segregated (Specific Dates)"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number of Days</p>
                  <p className="font-medium">{classData.numberOfDays} day(s)</p>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </h3>

                {classData.dateType === "STRAIGHT" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                    <div>
                      <p className="text-sm text-gray-600">Start Date & Time</p>
                      <p className="font-medium">
                        {formatDateTimeDisplay(classData.startDatetime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Date & Time</p>
                      <p className="font-medium">
                        {formatDateTimeDisplay(classData.endDatetime)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-3">Session Dates</p>
                    <div className="space-y-2">
                      {classData.sessions.length > 0 ? (
                        classData.sessions
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((session, index) => (
                            <div
                              key={session.id}
                              className="flex items-center gap-4 p-3 bg-white rounded border"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="font-medium">
                                  {formatDateDisplay(session.sessionDate)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {session.startTime} - {session.endTime}
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500">No sessions configured</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {classData.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{classData.notes}</p>
                </div>
              )}
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={classData.joinEnabled}
                    disabled
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Registration enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={classData.showOnPublicProfile}
                    disabled
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Show on public profile</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <ClassForm
          defaultValues={getEditDefaultValues()}
          onSubmit={handleUpdate}
          submitText="Update Class"
        />
      )}
    </div>
  )
}
