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
import { ArrowLeft, Copy, Trash2, Users, ExternalLink } from "lucide-react"

type ClassDetail = {
  id: string
  title: string
  clientName: string
  clientType: string
  topicCategory: string
  mode: string
  location: string | null
  startDatetime: string
  endDatetime: string
  notes: string | null
  status: string
  joinCode: string
  joinEnabled: boolean
  showOnPublicProfile: boolean
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
                  <p className="text-sm text-gray-600">Start Date & Time</p>
                  <p className="font-medium">
                    {new Date(classData.startDatetime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date & Time</p>
                  <p className="font-medium">
                    {new Date(classData.endDatetime).toLocaleString()}
                  </p>
                </div>
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
          defaultValues={{
            title: classData.title,
            clientName: classData.clientName,
            clientType: classData.clientType as any,
            topicCategory: classData.topicCategory,
            mode: classData.mode as any,
            location: classData.location,
            startDatetime: new Date(classData.startDatetime).toISOString().slice(0, 16),
            endDatetime: new Date(classData.endDatetime).toISOString().slice(0, 16),
            notes: classData.notes,
            status: classData.status as any,
            joinEnabled: classData.joinEnabled,
            showOnPublicProfile: classData.showOnPublicProfile,
          }}
          onSubmit={handleUpdate}
          submitText="Update Class"
        />
      )}
    </div>
  )
}
