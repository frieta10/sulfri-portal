import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  // Fetch dashboard statistics with error handling
  let totalClasses = 0
  let upcomingClasses = 0
  let totalRegistrations = 0
  let completedClasses = 0
  let recentClasses: any[] = []

  try {
    const [total, upcoming, registrations, completed] = await Promise.all([
      prisma.class.count(),
      prisma.class.count({
        where: { status: "UPCOMING" },
      }),
      prisma.registration.count(),
      prisma.class.count({
        where: { status: "COMPLETED" },
      }),
    ])
    
    totalClasses = total
    upcomingClasses = upcoming
    totalRegistrations = registrations
    completedClasses = completed

    // Fetch recent classes
    recentClasses = await prisma.class.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })
  } catch (error: any) {
    console.error("Dashboard data fetch error:", error)
    // Log specific error details for debugging
    if (error.message?.includes("DATABASE_URL")) {
      throw new Error("Database configuration error: DATABASE_URL is not set")
    }
    if (error.message?.includes("connect")) {
      throw new Error(`Database connection failed: ${error.message}`)
    }
    throw error
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's an overview of your training portal.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingClasses}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">All classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedClasses}</div>
            <p className="text-xs text-muted-foreground">Finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClasses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No classes yet. Create your first class to get started!
            </p>
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
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Registrations
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentClasses.map((cls) => (
                    <tr key={cls.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{cls.title}</td>
                      <td className="py-3 px-4">{cls.clientName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cls.status === "UPCOMING"
                              ? "bg-blue-100 text-blue-800"
                              : cls.status === "ONGOING"
                              ? "bg-green-100 text-green-800"
                              : cls.status === "COMPLETED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {cls.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{cls._count.registrations}</td>
                      <td className="py-3 px-4">
                        {new Date(cls.startDatetime).toLocaleDateString()}
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
