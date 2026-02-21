"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Download, ArrowLeft } from "lucide-react"

type DownloadItem = {
  id: string
  title: string
  fileUrl: string
  updatedAt: string
}

export default function PublicDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const response = await fetch("/api/downloads?public=true")
        if (response.ok) {
          const data = await response.json()
          setDownloads(data.downloads)
        }
      } catch (error) {
        console.error("Error fetching downloads:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDownloads()
  }, [])

  const getFileExtension = (url: string) => {
    return url.split(".").pop()?.toUpperCase() || "FILE"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Downloads</h1>
          <p className="text-gray-600 mt-1">
            Documents and resources available for download
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Loading documents...</p>
          </div>
        ) : downloads.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No documents available at this time.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              Return to Profile
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {downloads.map((download) => (
              <a
                key={download.id}
                href={download.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {download.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {getFileExtension(download.fileUrl)}
                      </span>
                      <span className="text-xs text-gray-400">
                        Updated{" "}
                        {new Date(download.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Sulfri Trainer Portal
        </div>
      </footer>
    </div>
  )
}
