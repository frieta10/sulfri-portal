"use client"

import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { Building2, Landmark, GraduationCap, Building, Briefcase } from "lucide-react"

interface Client {
  name: string
  type: "government" | "glc" | "corporate" | "education"
  logo?: string
  initials: string
  color: string
}

// Default clients list (will be overridden by actual data)
const defaultClients: Client[] = [
  // Government
  { name: "Ministry of Education Malaysia", type: "government", initials: "MOE", color: "bg-blue-600" },
  { name: "Civil Aviation Authority of Malaysia", type: "government", initials: "CAAM", color: "bg-sky-600" },
  { name: "MAMPU", type: "government", initials: "MAMPU", color: "bg-indigo-600" },
  { name: "JPA", type: "government", initials: "JPA", color: "bg-blue-700" },
  { name: "Ministry of Transport", type: "government", initials: "MOT", color: "bg-cyan-600" },
  { name: "Ministry of Digital", type: "government", initials: "MOD", color: "bg-violet-600" },
  
  // GLC
  { name: "Malaysia Airports Holdings Berhad", type: "glc", initials: "MAHB", color: "bg-emerald-600" },
  { name: "Heitech Padu Berhad", type: "glc", initials: "HEITECH", color: "bg-teal-600" },
  { name: "Serba Dinamik", type: "glc", initials: "SERBA", color: "bg-green-600" },
  { name: "Awantec", type: "glc", initials: "AWAN", color: "bg-lime-600" },
  { name: "Perbadanan Tabung Pembangunan Kemahiran", type: "glc", initials: "PTPK", color: "bg-amber-600" },
  { name: "Tabung Haji", type: "glc", initials: "TH", color: "bg-green-700" },
  { name: "Perbena Emas Holdings", type: "glc", initials: "PEH", color: "bg-yellow-600" },
  
  // Corporate
  { name: "London Stock Exchange Group", type: "corporate", initials: "LSEG", color: "bg-rose-600" },
  { name: "Ultiotech", type: "corporate", initials: "ULT", color: "bg-orange-600" },
  { name: "Virtual Space Centre", type: "corporate", initials: "VSC", color: "bg-pink-600" },
  { name: "Socoe Sdn Bhd", type: "corporate", initials: "SOCOE", color: "bg-fuchsia-600" },
  { name: "S5 System Sdn Bhd (Nexbis)", type: "corporate", initials: "NEXBIS", color: "bg-purple-600" },
  
  // Education
  { name: "Universiti Teknologi Malaysia", type: "education", initials: "UTM", color: "bg-red-600" },
  { name: "Universiti Malaya", type: "education", initials: "UM", color: "bg-red-700" },
  { name: "Politeknik Kuching Sarawak", type: "education", initials: "PKS", color: "bg-orange-700" },
  { name: "ADTEC", type: "education", initials: "ADTEC", color: "bg-amber-700" },
]

const getTypeIcon = (type: Client["type"]) => {
  switch (type) {
    case "government":
      return <Landmark className="w-3 h-3" />
    case "glc":
      return <Building2 className="w-3 h-3" />
    case "corporate":
      return <Briefcase className="w-3 h-3" />
    case "education":
      return <GraduationCap className="w-3 h-3" />
    default:
      return <Building className="w-3 h-3" />
  }
}

const getTypeLabel = (type: Client["type"]) => {
  switch (type) {
    case "government":
      return "Government"
    case "glc":
      return "GLC"
    case "corporate":
      return "Corporate"
    case "education":
      return "Education"
    default:
      return "Organization"
  }
}

// Infer client type from name
const inferClientType = (name: string): Client["type"] => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("universiti") || lowerName.includes("politeknik") || lowerName.includes("adtec") || lowerName.includes("college")) {
    return "education"
  }
  if (lowerName.includes("ministry") || lowerName.includes("mampu") || lowerName.includes("jpa") || lowerName.includes("authority")) {
    return "government"
  }
  if (lowerName.includes("berhad") || lowerName.includes("bhd") || lowerName.includes("holdings") || lowerName.includes("tabung")) {
    return "glc"
  }
  return "corporate"
}

// Get color based on type
const getClientColor = (type: Client["type"]): string => {
  switch (type) {
    case "government":
      return "bg-blue-600"
    case "glc":
      return "bg-emerald-600"
    case "corporate":
      return "bg-rose-600"
    case "education":
      return "bg-red-600"
    default:
      return "bg-slate-600"
  }
}

// Get initials from name
const getInitials = (name: string): string => {
  const words = name.split(" ")
  if (words.length === 1) return name.substring(0, 4).toUpperCase()
  return words
    .map((w) => w[0])
    .join("")
    .substring(0, 4)
    .toUpperCase()
}

interface ClientCarouselProps {
  speed?: number
  pauseOnHover?: boolean
  actualClients?: string[] // Pass actual client names from classes
}

export function ClientCarousel({ speed = 50, pauseOnHover = true, actualClients }: ClientCarouselProps) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", skipSnaps: false },
    [Autoplay({ playOnInit: true, delay: 0, stopOnInteraction: false, stopOnMouseEnter: pauseOnHover })]
  )

  // Build clients list from actual data or use defaults
  const clients: Client[] = actualClients && actualClients.length > 0
    ? actualClients.map((name) => {
        const type = inferClientType(name)
        return {
          name,
          type,
          initials: getInitials(name),
          color: getClientColor(type),
        }
      })
    : defaultClients

  // Duplicate clients for seamless infinite scroll
  const duplicatedClients = [...clients, ...clients, ...clients]

  return (
    <div className="relative overflow-hidden py-4">
      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div 
          className="flex"
          style={{
            animation: `scroll ${speed}s linear infinite`,
          }}
        >
          {duplicatedClients.map((client, idx) => (
            <div
              key={`${client.name}-${idx}`}
              className="flex-shrink-0 px-3"
            >
              <div className="group flex items-center gap-3 px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300 cursor-default min-w-[200px]">
                {/* Logo/Initials */}
                <div className={`flex-shrink-0 w-12 h-12 ${client.color} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                  {client.initials}
                </div>
                
                {/* Info */}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 text-sm truncate">
                    {client.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-slate-500">
                      {getTypeIcon(client.type)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {getTypeLabel(client.type)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
      `}</style>
    </div>
  )
}

// Static grid version for when carousel isn't needed
export function ClientGrid({ actualClients }: { actualClients?: string[] }) {
  // Build clients list from actual data or use defaults
  const clients: Client[] = actualClients && actualClients.length > 0
    ? actualClients.map((name) => {
        const type = inferClientType(name)
        return {
          name,
          type,
          initials: getInitials(name),
          color: getClientColor(type),
        }
      })
    : defaultClients
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {clients.map((client, idx) => (
        <div
          key={client.name}
          className="group flex flex-col items-center text-center p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300"
        >
          {/* Logo/Initials */}
          <div className={`w-16 h-16 ${client.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm mb-3 group-hover:scale-105 transition-transform`}>
            {client.initials}
          </div>
          
          {/* Name */}
          <p className="font-medium text-slate-100 text-sm line-clamp-2">
            {client.name}
          </p>
          
          {/* Type Badge */}
          <div className="flex items-center gap-1 mt-2">
            <span className="text-slate-500">
              {getTypeIcon(client.type)}
            </span>
            <span className="text-xs text-slate-500">
              {getTypeLabel(client.type)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Category filter tabs for client grid
export function ClientCategoryFilter({ 
  selected, 
  onSelect 
}: { 
  selected: string | null
  onSelect: (category: string | null) => void 
}) {
  const categories = [
    { id: null, label: "All", icon: <Building2 className="w-4 h-4" /> },
    { id: "government", label: "Government", icon: <Landmark className="w-4 h-4" /> },
    { id: "glc", label: "GLC", icon: <Building2 className="w-4 h-4" /> },
    { id: "corporate", label: "Corporate", icon: <Briefcase className="w-4 h-4" /> },
    { id: "education", label: "Education", icon: <GraduationCap className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id ?? "all"}
          onClick={() => onSelect(cat.id)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === cat.id
              ? "bg-blue-600 text-white"
              : "bg-slate-900/50 text-slate-400 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          {cat.icon}
          {cat.label}
        </button>
      ))}
    </div>
  )
}

export default ClientCarousel
