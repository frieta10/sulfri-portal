"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-300">Error</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mt-2 max-w-md">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  )
}
