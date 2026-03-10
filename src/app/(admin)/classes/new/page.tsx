"use client"

import { useRouter } from "next/navigation"
import { ClassForm } from "@/components/admin/class-form"
import { type ClassFormData } from "@/lib/validations/class"
import toast from "react-hot-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewClassPage() {
  const router = useRouter()

  const handleSubmit = async (data: ClassFormData) => {
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("API error:", error)
        throw new Error(error.message || error.error || "Failed to create class")
      }

      const newClass = await response.json()

      toast.success("Class created successfully!")
      router.push(`/classes/${newClass.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error creating class:", error)
      toast.error(error.message || "Failed to create class")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/classes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classes
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Class</h1>
          <p className="text-gray-600 mt-1">
            Fill in the details below to create a new training class
          </p>
        </div>
      </div>

      {/* Form */}
      <ClassForm onSubmit={handleSubmit} submitText="Create Class" />
    </div>
  )
}
