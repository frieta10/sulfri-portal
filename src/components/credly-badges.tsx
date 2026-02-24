"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, ExternalLink, Loader2, RefreshCw, Shield, Sparkles } from "lucide-react"

interface CredlyBadge {
  id: string
  name: string
  description: string
  imageUrl: string
  badgeUrl: string
  issuedAt: string
  skills: string[]
  issuer: string
}

interface CredlyBadgesProps {
  username: string
  displayStyle?: "grid" | "carousel" | "compact"
  maxBadges?: number
  showSkills?: boolean
}

export function CredlyBadges({ 
  username, 
  displayStyle = "grid",
  maxBadges,
  showSkills = true 
}: CredlyBadgesProps) {
  const [badges, setBadges] = useState<CredlyBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<CredlyBadge | null>(null)

  const fetchBadges = useCallback(async () => {
    if (!username) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/credly?username=${encodeURIComponent(username)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch badges")
      }
      
      setBadges(data.badges || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load badges")
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  const displayedBadges = maxBadges ? badges.slice(0, maxBadges) : badges

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-slate-400 mt-4">Loading certifications...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-950/30 border-red-500/30">
        <CardContent className="py-8 text-center">
          <p className="text-red-400">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBadges}
            className="mt-4 border-red-500/30 text-red-400 hover:bg-red-950/50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (badges.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-8 text-center">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No badges found for this user.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Badges Grid */}
      <div className={`grid gap-4 ${
        displayStyle === "compact" 
          ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" 
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      }`}>
        {displayedBadges.map((badge) => (
          <div
            key={badge.id}
            className="group relative bg-slate-900/50 rounded-2xl border border-slate-800 p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedBadge(badge)}
          >
            {/* Badge Image */}
            <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
              <img
                src={badge.imageUrl}
                alt={badge.name}
                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              />
              {/* Verified Badge */}
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            
            {/* Badge Info */}
            <h4 className="font-semibold text-sm text-slate-100 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {badge.name}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(badge.issuedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
            
            {/* Skills Preview (only in non-compact mode) */}
            {showSkills && displayStyle !== "compact" && badge.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {badge.skills.slice(0, 2).map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-800 text-slate-300 border-slate-700">
                    {skill}
                  </Badge>
                ))}
                {badge.skills.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-500">
                    +{badge.skills.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      {maxBadges && badges.length > maxBadges && (
        <div className="text-center">
          <a 
            href={`https://www.credly.com/users/${username}/badges`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            View all {badges.length} badges on Credly
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <Card 
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Large Badge Image */}
                <div className="w-32 h-32 mb-4">
                  <img
                    src={selectedBadge.imageUrl}
                    alt={selectedBadge.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Badge Details */}
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {selectedBadge.name}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  Issued by {selectedBadge.issuer}
                </p>
                <p className="text-slate-500 text-sm mb-4">
                  {selectedBadge.description}
                </p>
                
                {/* Issue Date */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Earned on {new Date(selectedBadge.issuedAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                
                {/* Skills */}
                {showSkills && selectedBadge.skills.length > 0 && (
                  <div className="w-full mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Skills</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {selectedBadge.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-3 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBadge(null)}
                  >
                    Close
                  </Button>
                  <a 
                    href={selectedBadge.badgeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Credly
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Setup Guide Component
// Setup Guide Component - Hidden by default, can be shown in admin only
export function CredlySetupGuide() {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          How to Connect Your Credly Account
        </h3>
        
        <ol className="space-y-4 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <div>
              <p className="font-medium">Go to your Credly profile</p>
              <p className="text-slate-500 mt-0.5">
                Visit{' '}
                <a 
                  href="https://www.credly.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  credly.com
                </a>
                {' '}and sign in to your account
              </p>
            </div>
          </li>
          
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <div>
              <p className="font-medium">Find your public profile URL</p>
              <p className="text-slate-500 mt-0.5">
                Click on your profile and copy the URL. It looks like:{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                  credly.com/users/your-username/badges
                </code>
              </p>
            </div>
          </li>
          
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <div>
              <p className="font-medium">Get your username</p>
              <p className="text-slate-500 mt-0.5">
                Your username is the part between{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">/users/</code>
                {' '}and{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">/badges</code>
              </p>
            </div>
          </li>
          
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              4
            </span>
            <div>
              <p className="font-medium">Update your profile settings</p>
              <p className="text-slate-500 mt-0.5">
                Go to{' '}
                <strong>Admin → Profile Settings</strong>
                {' '}and enter your Credly username in the designated field
              </p>
            </div>
          </li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Your Credly profile must be public for badges to display. 
            You can verify this by visiting your profile URL in an incognito window.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default CredlyBadges
