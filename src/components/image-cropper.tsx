"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { X, Check, RotateCcw, Loader2 } from "lucide-react"

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
}

// Portrait aspect ratio (4:5) - matches the profile display
const PORTRAIT_ASPECT = 4 / 5
const OUTPUT_WIDTH = 360
const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / PORTRAIT_ASPECT) // 450

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.6)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [error, setError] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const cropStartRef = useRef({ x: 0, y: 0 })

  // Load image and get dimensions
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
      setImageLoaded(true)
      setError(null)
    }
    img.onerror = () => {
      setError("Failed to load image")
      console.error("Failed to load image:", imageSrc.substring(0, 100))
    }
    img.src = imageSrc
  }, [imageSrc])

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

  const getCroppedImg = async (): Promise<Blob> => {
    if (!imageRef.current || !containerRef.current) {
      throw new Error("Image or container not available")
    }

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas context not available")

    // Portrait output dimensions
    canvas.width = OUTPUT_WIDTH
    canvas.height = OUTPUT_HEIGHT

    // Fill white background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)

    const img = imageRef.current
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // Calculate the crop area (portrait rectangle in center)
    const cropWidth = containerWidth * 0.75 // 75% of container width
    const cropHeight = cropWidth / PORTRAIT_ASPECT // maintain aspect ratio
    const cropX = (containerWidth - cropWidth) / 2
    const cropY = (containerHeight - cropHeight) / 2

    // Calculate base displayed dimensions (fit to container, no zoom)
    const imgAspect = img.naturalWidth / img.naturalHeight
    let baseWidth: number
    let baseHeight: number

    if (imgAspect >= containerWidth / containerHeight) {
      // Image is wider relative to container - fit to container height
      baseHeight = containerHeight
      baseWidth = baseHeight * imgAspect
    } else {
      // Image is taller - fit to container width
      baseWidth = containerWidth
      baseHeight = baseWidth / imgAspect
    }

    // Apply zoom to get actual displayed size
    const displayedWidth = baseWidth * zoom
    const displayedHeight = baseHeight * zoom

    // Calculate image position (centered + crop offset)
    const imgX = (containerWidth - displayedWidth) / 2 + crop.x
    const imgY = (containerHeight - displayedHeight) / 2 + crop.y

    // Calculate scale factor from displayed size to natural size
    const scaleToNatural = img.naturalWidth / baseWidth

    // Calculate source coordinates (what part of original image is visible in crop area)
    const sourceX = Math.max(0, (cropX - imgX) * scaleToNatural / zoom)
    const sourceY = Math.max(0, (cropY - imgY) * scaleToNatural / zoom)
    const sourceWidth = Math.min(
      img.naturalWidth - sourceX, 
      cropWidth * scaleToNatural / zoom
    )
    const sourceHeight = Math.min(
      img.naturalHeight - sourceY, 
      cropHeight * scaleToNatural / zoom
    )

    // Save context for rotation
    ctx.save()

    // Apply rotation around center
    if (rotation !== 0) {
      ctx.translate(OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-OUTPUT_WIDTH / 2, -OUTPUT_HEIGHT / 2)
    }

    // Draw the cropped portion
    ctx.drawImage(
      img,
      Math.max(0, sourceX),
      Math.max(0, sourceY),
      Math.max(1, sourceWidth),
      Math.max(1, sourceHeight),
      0,
      0,
      OUTPUT_WIDTH,
      OUTPUT_HEIGHT
    )

    ctx.restore()

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob from canvas"))
          return
        }
        resolve(blob)
      }, "image/jpeg", 0.95)
    })
  }

  const handleSave = async () => {
    try {
      setIsProcessing(true)
      setError(null)
      const croppedBlob = await getCroppedImg()
      onCropComplete(croppedBlob)
    } catch (err: any) {
      console.error("Crop error:", err)
      setError(err.message || "Failed to crop image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(0.6)
    setRotation(0)
    setError(null)
  }

  // Calculate image style for preview
  const getImageStyle = (): React.CSSProperties => {
    if (!imageLoaded || !containerRef.current) {
      return { visibility: "hidden" }
    }

    const container = containerRef.current
    const containerWidth = container.offsetWidth
    const containerHeight = container.offsetHeight
    const imgAspect = imageSize.width / imageSize.height
    
    let baseWidth: number
    let baseHeight: number

    if (imgAspect >= containerWidth / containerHeight) {
      // Wider image - fit height
      baseHeight = containerHeight
      baseWidth = baseHeight * imgAspect
    } else {
      // Taller image - fit width
      baseWidth = containerWidth
      baseHeight = baseWidth / imgAspect
    }

    return {
      width: baseWidth,
      height: baseHeight,
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

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Cropper Container - Portrait aspect ratio */}
          <div 
            ref={containerRef}
            className="relative w-full overflow-hidden bg-slate-900 mb-4 select-none"
            style={{ aspectRatio: `${PORTRAIT_ASPECT}` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Loading state */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              </div>
            )}

            {/* Image */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="max-w-none max-h-none object-cover"
                style={getImageStyle()}
                draggable={false}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
            
            {/* Portrait Rectangle Mask Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) calc((100% - 75% * ${PORTRAIT_ASPECT}) / 2), 
                  transparent calc((100% - 75% * ${PORTRAIT_ASPECT}) / 2), transparent calc(100% - (100% - 75% * ${PORTRAIT_ASPECT}) / 2),
                  rgba(0,0,0,0.7) calc(100% - (100% - 75% * ${PORTRAIT_ASPECT}) / 2), rgba(0,0,0,0.7) 100%)
                `,
              }}
            />
            
            {/* Portrait Rectangle Border */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="border-2 border-white/50 rounded-lg"
                style={{ 
                  width: "75%", 
                  height: `${75 / PORTRAIT_ASPECT}%`,
                  maxHeight: "90%",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)"
                }}
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
                disabled={!imageLoaded}
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
                disabled={!imageLoaded}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              disabled={isProcessing || !imageLoaded}
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
              disabled={isProcessing || !imageLoaded}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
