"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { classSchema, type ClassFormData } from "@/lib/validations/class"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"

type ClassFormProps = {
  defaultValues?: Partial<ClassFormData>
  onSubmit: (data: ClassFormData) => Promise<void>
  isLoading?: boolean
  submitText?: string
}

export function ClassForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitText = "Create Class",
}: ClassFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: defaultValues || {
      status: "UPCOMING",
      joinEnabled: true,
      showOnPublicProfile: true,
    },
  })

  useUnsavedChanges(isDirty)

  const watchClientType = watch("clientType")
  const watchMode = watch("mode")
  const watchStatus = watch("status")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Class Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g., Advanced Leadership Training"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                {...register("clientName")}
                placeholder="e.g., ABC Corporation"
                disabled={isLoading}
              />
              {errors.clientName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.clientName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="clientType">Client Type *</Label>
              <Select
                value={watchClientType}
                onValueChange={(value) => setValue("clientType", value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="CORPORATE">Corporate</SelectItem>
                  <SelectItem value="GOVERNMENT">Government</SelectItem>
                  <SelectItem value="ACADEMIC">Academic</SelectItem>
                </SelectContent>
              </Select>
              {errors.clientType && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.clientType.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="topicCategory">Topic Category *</Label>
            <Input
              id="topicCategory"
              {...register("topicCategory")}
              placeholder="e.g., Leadership, Management, Technical Skills"
              disabled={isLoading}
            />
            {errors.topicCategory && (
              <p className="text-sm text-red-600 mt-1">
                {errors.topicCategory.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Class Details */}
      <Card>
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mode">Class Mode *</Label>
              <Select
                value={watchMode}
                onValueChange={(value) => setValue("mode", value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="IN_PERSON">In Person</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              {errors.mode && (
                <p className="text-sm text-red-600 mt-1">{errors.mode.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="e.g., Conference Room A / Zoom"
                disabled={isLoading}
              />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.location.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDatetime">Start Date & Time *</Label>
              <Input
                id="startDatetime"
                type="datetime-local"
                {...register("startDatetime")}
                disabled={isLoading}
              />
              {errors.startDatetime && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.startDatetime.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="endDatetime">End Date & Time *</Label>
              <Input
                id="endDatetime"
                type="datetime-local"
                {...register("endDatetime")}
                disabled={isLoading}
              />
              {errors.endDatetime && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.endDatetime.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional information about the class..."
              rows={4}
              disabled={isLoading}
            />
            {errors.notes && (
              <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select
              value={watchStatus}
              onValueChange={(value) => setValue("status", value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="joinEnabled"
                {...register("joinEnabled")}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="joinEnabled" className="cursor-pointer">
                Enable registration via join link
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showOnPublicProfile"
                {...register("showOnPublicProfile")}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="showOnPublicProfile" className="cursor-pointer">
                Show on public profile (when completed)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? "Saving..." : submitText}
        </Button>
      </div>
    </form>
  )
}
