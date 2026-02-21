"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  ExternalLink,
  X,
} from "lucide-react"
import toast from "react-hot-toast"

type Download = {
  id: string
  title: string
  fileUrl: string
  isPublic: boolean
  updatedAt: string
}

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [title, setTitle] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDownloads()
  }, [])

  const fetchDownloads = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/downloads")
      if (response.ok) {
        const data = await response.json()
        setDownloads(data.downloads)
      }
    } catch (error) {
      console.error("Error fetching downloads:", error)
      toast.error("Failed to load downloads")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error("Please select a file")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("title", title.trim())
      formData.append("isPublic", String(isPublic))

      const response = await fetch("/api/downloads", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      toast.success("File uploaded successfully!")
      setTitle("")
      setSelectedFile(null)
      setIsPublic(true)
      setShowUploadForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      fetchDownloads()
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const toggleVisibility = async (download: Download) => {
    try {
      const response = await fetch(`/api/downloads/${download.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: download.title,
          isPublic: !download.isPublic,
        }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast.success(
        download.isPublic ? "Set to private" : "Set to public"
      )
      fetchDownloads()
    } catch (error) {
      toast.error("Failed to update visibility")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await fetch(`/api/downloads/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast.success("File deleted successfully!")
      fetchDownloads()
    } catch (error) {
      toast.error("Failed to delete file")
    }
  }

  const getFileExtension = (url: string) => {
    const ext = url.split(".").pop()?.toUpperCase() || "FILE"
    return ext
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Downloads</h1>
          <p className="text-gray-600 mt-1">
            Manage downloadable files and documents
          </p>
        </div>
        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
          {showUploadForm ? (
            <>
              <X className="w-4 h-4 mr-2" /> Cancel
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" /> Upload File
            </>
          )}
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Upload New File</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Company Profile 2024"
                  disabled={uploading}
                />
              </div>

              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG. Max 10MB.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={uploading}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Make publicly visible
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Downloads List */}
      <Card>
        <CardHeader>
          <CardTitle>All Files ({downloads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading files...</p>
            </div>
          ) : downloads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files uploaded yet.</p>
              <Button
                className="mt-4"
                onClick={() => setShowUploadForm(true)}
              >
                Upload Your First File
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {downloads.map((download) => (
                <div
                  key={download.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {download.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {getFileExtension(download.fileUrl)}
                        </span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs text-gray-500">
                          Updated {new Date(download.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        download.isPublic
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {download.isPublic ? "Public" : "Private"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibility(download)}
                      title={download.isPublic ? "Make private" : "Make public"}
                      aria-label={download.isPublic ? "Make private" : "Make public"}
                    >
                      {download.isPublic ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>

                    <a
                      href={download.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                      aria-label={`Preview ${download.title}`}
                    >
                      <Button variant="outline" size="sm" title="Preview file">
                        <ExternalLink className="w-4 h-4" />
                        <span className="sr-only">Preview</span>
                      </Button>
                    </a>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(download.id)}
                      title="Delete file"
                      aria-label={`Delete ${download.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
