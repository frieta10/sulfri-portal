"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { X, Check, RotateCcw } from "lucide-react"

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
}

// Helper to create cropped image
async function getCroppedImg(
  imageSrc: string,
  crop: { x: number; y: number },
  zoom: number,
  rotation: number
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("No 2d context")
  }

  // Set canvas size - fixed square size for profile photo
  const size = 400
  canvas.width = size
  canvas.height = size

  // Calculate the source dimensions based on zoom
  const sourceWidth = image.width / zoom
  const sourceHeight = image.height / zoom
  const sourceX = (image.width - sourceWidth) / 2 - (crop.x / zoom)
  const sourceY = (image.height - sourceHeight) / 2 - (crop.y / zoom)

  // Save context state
  ctx.save()

  // Move to center of canvas for rotation
  ctx.translate(size / 2, size / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-size / 2, -size / 2)

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    Math.max(0, sourceX),
    Math.max(0, sourceY),
    Math.min(sourceWidth, image.width),
    Math.min(sourceHeight, image.height),
    0,
    0,
    size,
    size
  )

  // Restore context
  ctx.restore()

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"))
        return
      }
      resolve(blob)
    }, "image/jpeg", 0.95)
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = (error) => reject(error)
    image.src = url
  })
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const cropStartRef = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    cropStartRef.current = { ...crop }
  }, [crop])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    
    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y
    
    setCrop({
      x: cropStartRef.current.x + deltaX,
      y: cropStartRef.current.y + deltaY,
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    dragStartRef.current = { x: touch.clientX, y: touch.clientY }
    cropStartRef.current = { ...crop }
  }, [crop])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    
    const deltaX = touch.clientX - dragStartRef.current.x
    const deltaY = touch.clientY - dragStartRef.current.y
    
    setCrop({
      x: cropStartRef.current.x + deltaX,
      y: cropStartRef.current.y + deltaY,
    })
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleSave = async () => {
    try {
      setIsProcessing(true)
      const croppedBlob = await getCroppedImg(imageSrc, crop, zoom, rotation)
      onCropComplete(croppedBlob)
    } catch (error) {
      console.error("Error cropping image:", error)
      alert("Failed to crop image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }

  // Calculate image transform style
  const getImageStyle = () => {
    return {
      transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom}) rotate(${rotation}deg)`,
      transformOrigin: "center center",
      cursor: isDragging ? "grabbing" : "grab",
      transition: isDragging ? "none" : "transform 0.1s ease-out",
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Crop Profile Photo</h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Cropper Container */}
          <div 
            ref={containerRef}
            className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-900 mb-4 select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Image */}
            <img
              src={imageSrc}
              alt="Crop preview"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={getImageStyle()}
              draggable={false}
            />
            
            {/* Circular Mask Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.7) 40%)`,
              }}
            />
            
            {/* Circle Border */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div 
                className="w-[80%] h-[80%] rounded-full border-2 border-white/50"
                style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}
              />
            </div>

            {/* Drag hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-black/50 px-3 py-1 rounded-full pointer-events-none">
              Drag to move • Use controls to zoom/rotate
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 mb-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Rotation</span>
                <span>{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={1}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              disabled={isProcessing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImageCropper
