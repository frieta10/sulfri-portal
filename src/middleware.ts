import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/classes/:path*',
    '/profile-settings/:path*',
    '/downloads/:path*',
    '/change-password/:path*'
  ]
}
