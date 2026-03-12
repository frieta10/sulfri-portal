"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <img 
          src="/msh-logo.svg" 
          alt="MSH Corporate Trainer" 
          className="w-24 h-24 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-white">MSH Corporate Trainer</h1>
        <p className="text-green-400 text-sm">Admin Portal</p>
      </div>
      
      <Card className="w-full max-w-md border-green-500/20 bg-slate-900/90">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold text-white">Admin Login</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-500 text-white" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <footer className="mt-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img 
            src="/msh-logo.svg" 
            alt="MSH" 
            className="w-6 h-6 object-contain"
          />
          <span className="text-slate-400 text-sm">MSH Corporate Trainer</span>
        </div>
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} Mohd Sulfri Mohd Harris. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
