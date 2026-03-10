"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import { Plus, Trash2, Calendar } from "lucide-react"

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
  const [dateType, setDateType] = useState<"STRAIGHT" | "SEGREGATED">(
    defaultValues?.dateType || "STRAIGHT"
  )
  const [numberOfDays, setNumberOfDays] = useState(defaultValues?.numberOfDays || 1)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, isValid },
    setValue,
    watch,
    control,
    reset,
    trigger,
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      status: "UPCOMING",
      joinEnabled: true,
      showOnPublicProfile: true,
      dateType: "STRAIGHT",
      numberOfDays: 1,
      sessions: [],
      // Initialize datetime fields for straight dates
      startDatetime: new Date().toISOString().slice(0, 16),
      endDatetime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      ...defaultValues,
    },
    mode: "onChange",
  })

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "sessions",
  })

  useUnsavedChanges(isDirty)

  const watchClientType = watch("clientType")
  const watchMode = watch("mode")
  const watchStatus = watch("status")
  const watchStartDatetime = watch("startDatetime")
  const watchDateType = watch("dateType")
  const watchNumberOfDays = watch("numberOfDays")

  // Watch for date type changes
  useEffect(() => {
    if (watchDateType) {
      setDateType(watchDateType)
    }
  }, [watchDateType])

  // Watch for number of days changes
  useEffect(() => {
    setNumberOfDays(watchNumberOfDays || 1)
  }, [watchNumberOfDays])

  // Update sessions when date type or number of days changes
  useEffect(() => {
    if (dateType === "SEGREGATED") {
      const currentSessions = fields.length
      const targetSessions = numberOfDays

      if (currentSessions < targetSessions) {
        // Add more sessions
        for (let i = currentSessions; i < targetSessions; i++) {
          append({
            sessionDate: new Date().toISOString().split("T")[0],
            startTime: "09:00",
            endTime: "17:00",
          })
        }
      } else if (currentSessions > targetSessions) {
        // Remove extra sessions
        for (let i = currentSessions - 1; i >= targetSessions; i--) {
          remove(i)
        }
      }
    } else {
      // Clear sessions for straight dates
      if (fields.length > 0) {
        replace([])
      }
    }
  }, [dateType, numberOfDays, append, remove, replace, fields.length])

  // Calculate end date based on start date and number of days for straight dates
  const calculateEndDate = (startDateStr: string, days: number) => {
    if (!startDateStr) return ""
    const startDate = new Date(startDateStr)
    // Add (days - 1) to get the end date (e.g., 3 days: Day 1, Day 2, Day 3)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + days - 1)
    
    // Format as datetime-local
    const year = endDate.getFullYear()
    const month = String(endDate.getMonth() + 1).padStart(2, "0")
    const day = String(endDate.getDate()).padStart(2, "0")
    const hours = String(endDate.getHours()).padStart(2, "0")
    const minutes = String(endDate.getMinutes()).padStart(2, "0")
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Extract time from datetime for segregated sessions
  const extractTime = (datetimeStr: string) => {
    if (!datetimeStr) return { startTime: "09:00", endTime: "17:00" }
    const date = new Date(datetimeStr)
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
  }

  // Handle start date change for straight dates
  const handleStraightStartChange = (value: string) => {
    setValue("startDatetime", value)
    // Update end date based on number of days
    const endDateStr = calculateEndDate(value, numberOfDays)
    if (endDateStr) {
      setValue("endDatetime", endDateStr)
    }
  }

  // Handle number of days change for straight dates
  const handleNumberOfDaysChange = (value: number) => {
    setValue("numberOfDays", value)
    if (watchStartDatetime) {
      const endDateStr = calculateEndDate(watchStartDatetime, value)
      if (endDateStr) {
        setValue("endDatetime", endDateStr)
      }
    }
  }

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleFormSubmit = async (data: ClassFormData) => {
    setSubmitError(null)
    console.log("Form submit triggered with data:", JSON.stringify(data, null, 2))
    try {
      // Ensure sessions is at least an empty array
      const submitData = {
        ...data,
        sessions: data.sessions || [],
      }
      console.log("Submitting form data:", JSON.stringify(submitData, null, 2))
      await onSubmit(submitData)
    } catch (error: any) {
      console.error("Form submission error:", error)
      setSubmitError(error.message || "Failed to save class")
      throw error
    }
  }

  // Debug: log validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Form validation errors:", errors)
    }
  }, [errors])

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error</p>
          <p className="text-sm">{submitError}</p>
        </div>
      )}
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

          {/* Date Scheduling Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Scheduling
            </h3>

            {/* Number of Days */}
            <div className="mb-4">
              <Label htmlFor="numberOfDays">Number of Days *</Label>
              <Input
                id="numberOfDays"
                type="number"
                min={1}
                max={30}
                {...register("numberOfDays", { valueAsNumber: true })}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  handleNumberOfDaysChange(value)
                }}
                disabled={isLoading}
                className="w-32"
              />
              {errors.numberOfDays && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.numberOfDays.message}
                </p>
              )}
            </div>

            {/* Date Type Selection */}
            <div className="mb-4">
              <Label>Date Type *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="STRAIGHT"
                    {...register("dateType")}
                    checked={dateType === "STRAIGHT"}
                    onChange={() => setValue("dateType", "STRAIGHT")}
                    disabled={isLoading}
                    className="h-4 w-4"
                  />
                  <span>Straight (Consecutive Days)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="SEGREGATED"
                    {...register("dateType")}
                    checked={dateType === "SEGREGATED"}
                    onChange={() => setValue("dateType", "SEGREGATED")}
                    disabled={isLoading}
                    className="h-4 w-4"
                  />
                  <span>Segregated (Specific Dates)</span>
                </label>
              </div>
              {errors.dateType && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.dateType.message}
                </p>
              )}
            </div>

            {/* Straight Dates - Start and End Date */}
            {dateType === "STRAIGHT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <Label htmlFor="startDatetime">Start Date & Time *</Label>
                  <Input
                    id="startDatetime"
                    type="datetime-local"
                    {...register("startDatetime")}
                    onChange={(e) => handleStraightStartChange(e.target.value)}
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
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated based on {numberOfDays} day(s)
                  </p>
                  {errors.endDatetime && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.endDatetime.message}
                    </p>
                  )}
                </div>

                {watchStartDatetime && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-green-600 bg-green-50 p-3 rounded">
                      <strong>Class Schedule:</strong> {numberOfDays} day(s) from{" "}
                      {formatDateDisplay(watchStartDatetime)} to{" "}
                      {formatDateDisplay(watch("endDatetime"))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Segregated Dates - Individual Day Inputs */}
            {dateType === "SEGREGATED" && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Session Dates ({fields.length} of {numberOfDays} days)
                  </h4>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded border"
                  >
                    <div>
                      <Label htmlFor={`sessions.${index}.sessionDate`}>
                        Day {index + 1} Date *
                      </Label>
                      <Input
                        id={`sessions.${index}.sessionDate`}
                        type="date"
                        {...register(`sessions.${index}.sessionDate`)}
                        disabled={isLoading}
                      />
                      {errors.sessions?.[index]?.sessionDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.sessions[index]?.sessionDate?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`sessions.${index}.startTime`}>
                        Start Time *
                      </Label>
                      <Input
                        id={`sessions.${index}.startTime`}
                        type="time"
                        {...register(`sessions.${index}.startTime`)}
                        disabled={isLoading}
                      />
                      {errors.sessions?.[index]?.startTime && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.sessions[index]?.startTime?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`sessions.${index}.endTime`}>
                        End Time *
                      </Label>
                      <Input
                        id={`sessions.${index}.endTime`}
                        type="time"
                        {...register(`sessions.${index}.endTime`)}
                        disabled={isLoading}
                      />
                      {errors.sessions?.[index]?.endTime && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.sessions[index]?.endTime?.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {fields.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Please set the number of days above to add session dates
                  </p>
                )}

                {errors.sessions && typeof errors.sessions.message === "string" && (
                  <p className="text-sm text-red-600">
                    {errors.sessions.message}
                  </p>
                )}
              </div>
            )}
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

      {/* Validation Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Please fix the following errors:</p>
          <ul className="text-sm mt-2 list-disc list-inside">
            {errors.title && <li>Title: {errors.title.message}</li>}
            {errors.clientName && <li>Client Name: {errors.clientName.message}</li>}
            {errors.clientType && <li>Client Type: {errors.clientType.message}</li>}
            {errors.topicCategory && <li>Topic Category: {errors.topicCategory.message}</li>}
            {errors.mode && <li>Mode: {errors.mode.message}</li>}
            {errors.numberOfDays && <li>Number of Days: {errors.numberOfDays.message}</li>}
            {errors.startDatetime && <li>Start Date: {errors.startDatetime.message}</li>}
            {errors.endDatetime && <li>End Date: {errors.endDatetime.message}</li>}
            {errors.sessions && <li>Sessions: {errors.sessions.message || "Invalid sessions"}</li>}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button 
          type="submit" 
          disabled={isLoading || isSubmitting} 
          size="lg"
          onClick={() => {
            console.log("Submit button clicked")
            console.log("Form is valid:", isValid)
            console.log("Form errors:", errors)
            trigger().then((isValid) => {
              console.log("Validation result:", isValid)
            })
          }}
        >
          {isLoading || isSubmitting ? "Saving..." : submitText}
        </Button>
      </div>
    </form>
  )
}
