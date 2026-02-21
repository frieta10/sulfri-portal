import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mt-2 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium"
          >
            Go to Homepage
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
