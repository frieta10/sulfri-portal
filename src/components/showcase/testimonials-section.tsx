"use client"

import { useEffect, useState, useRef } from "react"
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Testimonial {
  id: string
  quote: string
  authorName: string
  authorTitle: string | null
  authorOrganisation: string | null
  photoUrl: string | null
  rating: number | null
}

interface TestimonialsSectionProps {
  className?: string
}

export function TestimonialsSection({ className }: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch("/api/testimonials")
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data)
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error)
    } finally {
      setLoading(false)
    }
  }

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  // Auto-advance carousel
  useEffect(() => {
    if (testimonials.length <= 1) return
    
    const interval = setInterval(() => {
      nextTestimonial()
    }, 6000)

    return () => clearInterval(interval)
  }, [testimonials.length, currentIndex])

  if (loading) {
    return (
      <div className={cn("py-16", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-800 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (testimonials.length === 0) {
    return null
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section 
      ref={sectionRef}
      id="testimonials" 
      className={cn("py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div 
          className={cn(
            "text-center mb-12 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          )}
        >
          <p className="text-blue-800 font-semibold text-xs uppercase tracking-widest mb-3">
            Client Feedback
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            What Clients Say
          </h2>
          <div className="w-12 h-0.5 bg-blue-800 mx-auto mt-4" />
        </div>

        {/* Testimonial Carousel */}
        <div 
          className={cn(
            "relative max-w-4xl mx-auto transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          )}
        >
          {/* Main Testimonial Card */}
          <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-12">
            {/* Quote Icon */}
            <div className="absolute -top-4 left-8 w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
              <Quote className="w-4 h-4 text-white" />
            </div>

            {/* Rating Stars */}
            {currentTestimonial.rating && (
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i < currentTestimonial.rating!
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Quote Text */}
            <blockquote className="text-lg lg:text-xl text-gray-700 leading-relaxed mb-8 italic">
              &ldquo;{currentTestimonial.quote}&rdquo;
            </blockquote>

            {/* Author Info */}
            <div className="flex items-center gap-4">
              {currentTestimonial.photoUrl ? (
                <img
                  src={currentTestimonial.photoUrl}
                  alt={currentTestimonial.authorName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-100">
                  <span className="text-lg font-semibold text-blue-800">
                    {currentTestimonial.authorName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {currentTestimonial.authorName}
                </p>
                {(currentTestimonial.authorTitle || currentTestimonial.authorOrganisation) && (
                  <p className="text-sm text-gray-500">
                    {currentTestimonial.authorTitle}
                    {currentTestimonial.authorTitle && currentTestimonial.authorOrganisation && ", "}
                    {currentTestimonial.authorOrganisation}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          {testimonials.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              {/* Next Button */}
              <button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex
                        ? "bg-blue-800 w-6"
                        : "bg-gray-300 hover:bg-gray-400"
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Multiple Testimonials Grid (for desktop when there are many) */}
        {testimonials.length > 2 && (
          <div 
            className={cn(
              "hidden lg:grid grid-cols-3 gap-6 mt-12 transition-all duration-700 delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
          >
            {testimonials.slice(0, 3).map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  const idx = testimonials.findIndex(t => t.id === testimonial.id)
                  if (idx !== -1) setCurrentIndex(idx)
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {testimonial.photoUrl ? (
                    <img
                      src={testimonial.photoUrl}
                      alt={testimonial.authorName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-800">
                        {testimonial.authorName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {testimonial.authorName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {testimonial.authorOrganisation}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                {testimonial.rating && (
                  <div className="flex items-center gap-0.5 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3 h-3",
                          i < testimonial.rating!
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default TestimonialsSection
