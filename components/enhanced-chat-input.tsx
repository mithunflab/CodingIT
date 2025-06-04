"use client"

import type React from "react"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, isFileInArray } from "@/lib/utils"
import { useLocalStorage } from "usehooks-ts"
import { ScreenshotCloneModal } from "@/components/modals/screenshot-clone-modal"
import { FigmaImportModal } from "@/components/modals/figma-import-modal"
import { GitHubImportModal } from "@/components/modals/github-import-modal"
import { EnhancedProjectUploadModal } from "@/components/modals/enhanced-project-upload-modal"
import { handleCloneScreenshot, handleFigmaImport, handleUploadProject } from "@/lib/action-handlers"
import { 
  Send, 
  Square, 
  RotateCcw, 
  AlertCircle, 
  X,
  ImageIcon,
  FileUp,
  Figma,
  Github,
  Sparkles,
  Upload,
  Eye,
  EyeOff
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface ProjectAnalysis {
  structure: {
    files: Array<{
      name: string
      path: string
      language: string
      size: number
      type: string
    }>
    dependencies: Set<string>
    frameworks: Set<string>
    patterns: Set<string>
    components: Set<string>
    types: Set<string>
    utilities: Set<string>
    architecture: {
      type: string
      description: string
    }
  }
  analysis: string
  recommendations: string[]
}

interface EnhancedChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, projectFiles?: File[], projectAnalysis?: ProjectAnalysis) => void
  isLoading?: boolean
  isErrored?: boolean
  errorMessage?: string
  isRateLimited?: boolean
  retry?: () => void
  stop?: () => void
  isMultiModal?: boolean
  files: File[]
  handleFileChange: (files: File[] | ((prev: File[]) => File[])) => void
  children?: React.ReactNode
}

export function EnhancedChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading = false,
  isErrored = false,
  errorMessage,
  isRateLimited = false,
  retry,
  stop,
  isMultiModal = false,
  files,
  handleFileChange,
  children,
}: EnhancedChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [projectContext, setProjectContext] = useState<{
    files: File[]
    analysis: ProjectAnalysis | null
    source: 'upload' | 'github' | null
    repositoryInfo?: { owner: string; repo: string }
  }>({
    files: [],
    analysis: null,
    source: null
  })
  const [showProjectPreview, setShowProjectPreview] = useState(false)
  const [enabledFeatures, setEnabledFeatures] = useLocalStorage("enabled-features", {
    screenshotClone: true,
    figmaImport: true,
    githubImport: true,
    projectUpload: true,
  })

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading) {
        const form = e.currentTarget.closest("form")
        if (form) {
          form.requestSubmit()
        }
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      const validFiles = droppedFiles.filter((file) => 
        isMultiModal ? file.type.startsWith("image/") || file.type.startsWith("text/") : file.type.startsWith("image/")
      )
      
      if (validFiles.length > 0) {
        const newFiles = validFiles.filter((file) => !isFileInArray(file, files))
        handleFileChange((prev) => [...prev, ...newFiles])
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles = selectedFiles.filter((file) => 
        isMultiModal ? file.type.startsWith("image/") || file.type.startsWith("text/") : file.type.startsWith("image/")
      )
      
      if (validFiles.length > 0) {
        const newFiles = validFiles.filter((file) => !isFileInArray(file, files))
        handleFileChange((prev) => [...prev, ...newFiles])
      }
    }
  }

  const removeFile = (index: number) => {
    handleFileChange((prev) => prev.filter((_, i) => i !== index))
  }

  const clearProjectContext = () => {
    setProjectContext({
      files: [],
      analysis: null,
      source: null,
      repositoryInfo: undefined
    })
    setShowProjectPreview(false)
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (projectContext.files.length > 0) {
      handleSubmit(e, projectContext.files, projectContext.analysis || undefined)
    } else {
      handleSubmit(e)
    }
  }

  const handleProjectUpload = (uploadedFiles: File[], analysis?: ProjectAnalysis, instructions?: string) => {
    setProjectContext({
      files: uploadedFiles,
      analysis: analysis || null,
      source: 'upload'
    })
    setShowProjectPreview(true)
    
    if (instructions) {
      // Append instructions to current input
      const newInput = input ? `${input}\n\n${instructions}` : instructions
      handleInputChange({ target: { value: newInput } } as React.ChangeEvent<HTMLTextAreaElement>)
    }
  }

  const handleGitHubImport = (importedFiles: any[], analysis: ProjectAnalysis, repositoryInfo: { owner: string; repo: string }) => {
    setProjectContext({
      files: importedFiles,
      analysis,
      source: 'github',
      repositoryInfo
    })
    setShowProjectPreview(true)
    
    // Auto-fill input with repository context
    const repoPrompt = `Analyze and enhance the ${repositoryInfo.owner}/${repositoryInfo.repo} repository. Focus on code quality, performance optimizations, and implementing best practices.`
    handleInputChange({ target: { value: repoPrompt } } as React.ChangeEvent<HTMLTextAreaElement>)
  }

  return (
    <div className="w-full space-y-4">
      {/* Error Message */}
      {isErrored && errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{errorMessage}</span>
            {retry && (
              <Button variant="ghost" size="sm" onClick={retry} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Rate Limit Warning */}
      {isRateLimited && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have reached the rate limit. Please try again later or use your own API key in settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Project Context Preview */}
      {projectContext.files.length > 0 && showProjectPreview && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {projectContext.source === 'github' ? (
                  <Github className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <FileUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {projectContext.source === 'github' && projectContext.repositoryInfo
                    ? `GitHub: ${projectContext.repositoryInfo.owner}/${projectContext.repositoryInfo.repo}`
                    : `Project: ${projectContext.files.length} files`
                  }
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProjectPreview(!showProjectPreview)}
                  className="h-6 w-6 p-0"
                >
                  {showProjectPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
              
              {projectContext.analysis && (
                <div className="space-y-2">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-medium">{projectContext.analysis.structure.architecture.type}</span>
                    {" • "}
                    {projectContext.analysis.structure.dependencies.size} dependencies
                    {" • "}
                    {projectContext.analysis.structure.components.size} components
                  </p>
                  
                  {projectContext.analysis.structure.frameworks.size > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {Array.from(projectContext.analysis.structure.frameworks).map((framework) => (
                        <Badge key={framework} variant="secondary" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearProjectContext}
              className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      )}

      {/* File Attachments */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Attached Files</div>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="truncate max-w-32">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div
          className={cn(
            "relative rounded-lg border bg-background transition-all",
            isDragActive && "border-primary bg-primary/10",
            isErrored && "border-destructive"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Action Buttons Row */}
          <div className="flex items-center gap-1 p-2 border-b">
            {enabledFeatures.screenshotClone && (
              <ScreenshotCloneModal
                onClone={(image, instructions) => {
                  handleFileChange((prev) => [...prev, image])
                  if (instructions) {
                    const newInput = input ? `${input}\n\n${instructions}` : instructions
                    handleInputChange({ target: { value: newInput } } as React.ChangeEvent<HTMLTextAreaElement>)
                  }
                }}
                isLoading={isLoading}
              />
            )}
            
            {enabledFeatures.figmaImport && (
              <FigmaImportModal
                onImport={(figmaUrl, customPrompt) => {
                  const prompt = customPrompt || `Import and recreate this Figma design: ${figmaUrl}`
                  handleInputChange({ target: { value: prompt } } as React.ChangeEvent<HTMLTextAreaElement>)
                }}
                isLoading={isLoading}
              />
            )}
            
            {enabledFeatures.githubImport && (
              <GitHubImportModal
                onImport={handleGitHubImport}
                isLoading={isLoading}
              />
            )}
            
            {enabledFeatures.projectUpload && (
              <EnhancedProjectUploadModal
                onUpload={handleProjectUpload}
                isLoading={isLoading}
              />
            )}
            
            {isMultiModal && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rainbow-button-content flex items-center gap-2 px-4 py-2 transition-colors border-none"
              >
                <Upload className="w-4 h-4" />
                <span className="text-xs">Upload Images</span>
              </Button>
            )}
          </div>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              projectContext.files.length > 0 
                ? "Describe what you'd like to build or modify with your project files..."
                : "Describe what you want to build..."
            }
            className="min-h-[60px] resize-none border-0 focus-visible:ring-0 text-base"
            style={{ height: "auto" }}
            disabled={isLoading}
          />

          {/* Submit Button */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {projectContext.files.length > 0 && (
                <span>{projectContext.files.length} project files loaded</span>
              )}
              {files.length > 0 && (
                <span>{files.length} image{files.length > 1 ? 's' : ''} attached</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isLoading && stop && (
                <Button type="button" variant="outline" size="sm" onClick={stop}>
                  <Square className="h-4 w-4" />
                </Button>
              )}
              
              <Button 
                type="submit" 
                size="sm" 
                disabled={isLoading || !input.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {children}
      </form>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  )
}