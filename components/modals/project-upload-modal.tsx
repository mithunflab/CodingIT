"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUp, Upload, X, File, ImageIcon, Code, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProjectUploadModalProps {
  onUpload: (files: File[], instructions?: string) => void
  isLoading?: boolean
}

export function ProjectUploadModal({ onUpload, isLoading = false }: ProjectUploadModalProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
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
    handleFiles(droppedFiles)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }

  const handleFiles = (newFiles: File[]) => {
    // Filter and validate files
    const validFiles = newFiles.filter((file) => {
      // Check file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB per file.`)
        return false
      }
      return true
    })

    // Limit total files to 20
    const totalFiles = [...files, ...validFiles]
    if (totalFiles.length > 20) {
      alert("Maximum 20 files allowed. Please select fewer files.")
      return
    }

    setFiles(totalFiles)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (file.type.includes("text") || file.name.match(/\.(js|ts|jsx|tsx|html|css|json|md)$/)) {
      return <Code className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const handleUpload = () => {
    if (files.length === 0) {
      alert("Please select at least one file to upload.")
      return
    }

    onUpload(files, instructions)
    setOpen(false)
    setFiles([])
    setInstructions("")
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rainbow-button-content flex items-center gap-2 px-4 py-2 transition-colors border-none"
          disabled={isLoading}
        >
          <FileUp className="w-4 h-4" />
          <span className="text-xs">Upload a Project</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Upload Project Files
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              Upload your project files for AI-powered analysis, review, and enhancement suggestions.
            </AlertDescription>
          </Alert>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-neutral-300 dark:border-neutral-700"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Drag and drop files here, or click to select
            </p>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mb-2">
              Choose Files
            </Button>
            <p className="text-xs text-neutral-500">
              Supports: .js, .ts, .jsx, .tsx, .html, .css, .json, .md, .py, .java, .php, .zip
            </p>
            <p className="text-xs text-neutral-500">Max: 20 files, 10MB per file</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept=".js,.ts,.jsx,.tsx,.html,.css,.json,.md,.txt,.py,.java,.php,.rb,.go,.rs,.zip,.tar,.gz"
          />

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>
                Selected Files ({files.length}/20) - {totalSizeMB}MB total
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {getFileIcon(file)}
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-neutral-500">({(file.size / 1024).toFixed(1)}KB)</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="h-6 w-6 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Analysis Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Specific areas to focus on: security, performance, architecture, etc..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-neutral-500">{instructions.length}/300 characters</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Upload & Analyze"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
