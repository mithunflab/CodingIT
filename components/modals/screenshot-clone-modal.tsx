"use client"

import type React from "react"
import Img from "next/image"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, X, Loader2, Camera } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ScreenshotCloneModalProps {
  onClone: (image: File, instructions?: string) => void
  isLoading?: boolean
}

export function ScreenshotCloneModal({ onClone, isLoading = false }: ScreenshotCloneModalProps) {
  const [open, setOpen] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [instructions, setInstructions] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleImageFile(droppedFiles[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0])
    }
  }

  const handleImageFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, GIF, etc.)")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image file is too large. Maximum size is 10MB.")
      return
    }

    setImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClone = () => {
    if (!image) {
      alert("Please select an image to clone.")
      return
    }

    onClone(image, instructions)
    setOpen(false)
    setImage(null)
    setImagePreview(null)
    setInstructions("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rainbow-button-content flex items-center gap-2 px-4 py-2 transition-colors border-none"
          disabled={isLoading}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-xs">Clone a Screenshot</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Clone Screenshot
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <ImageIcon className="h-4 w-4" />
            <AlertDescription>
              Upload a screenshot of any website or UI design to recreate it as functional code.
            </AlertDescription>
          </Alert>

          {/* Image Upload Area */}
          {!image ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                Drag and drop an image here, or click to select
              </p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mb-2">
                Choose Image
              </Button>
              <p className="text-xs text-neutral-500">Supports: PNG, JPG, GIF, WebP, SVG</p>
              <p className="text-xs text-neutral-500">Max size: 10MB</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Selected Image</Label>
              <div className="relative border rounded-lg p-2">
                <div className="flex items-center gap-3">
                  {imagePreview && (
                    <Img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{image.name}</p>
                    <p className="text-xs text-neutral-500">{(image.size / 1024 / 1024).toFixed(2)}MB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeImage} className="h-8 w-8 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" onChange={handleFileInput} className="hidden" accept="image/*" />

          {/* Additional Instructions */}
          <div className="space-y-2">
            <Label htmlFor="clone-instructions">Additional Instructions (Optional)</Label>
            <Textarea
              id="clone-instructions"
              placeholder="Specific requirements: responsive design, dark mode, animations, etc..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-neutral-500">{instructions.length}/200 characters</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={!image || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cloning...
                </>
              ) : (
                "Clone Design"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
