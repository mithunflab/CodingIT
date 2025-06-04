"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileUp, 
  Upload, 
  X, 
  File, 
  ImageIcon, 
  Code, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  FileText,
  Settings,
  Database,
  Globe
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

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

interface EnhancedProjectUploadModalProps {
  onUpload: (files: File[], analysis?: ProjectAnalysis, instructions?: string) => void
  isLoading?: boolean
}

export function EnhancedProjectUploadModal({ onUpload, isLoading = false }: EnhancedProjectUploadModalProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [instructions, setInstructions] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB per file.`)
        return false
      }
      
      const allowedExtensions = [
        '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.php', '.rb', '.go', '.rs',
        '.html', '.css', '.scss', '.sass', '.less',
        '.json', '.yaml', '.yml', '.toml', '.ini', '.env',
        '.md', '.txt', '.gitignore', '.dockerfile',
        '.sql', '.prisma', '.graphql'
      ]
      
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedExtensions.includes(fileExt) && !file.name.includes('package.json') && !file.name.includes('tsconfig')) {
        console.warn(`File ${file.name} has unsupported extension: ${fileExt}`)
        return false
      }
      
      return true
    })

    // Limit total files to 25
    const totalFiles = [...files, ...validFiles]
    if (totalFiles.length > 25) {
      alert("Maximum 25 files allowed. Please select fewer files.")
      return
    }

    setFiles(totalFiles)
    setAnalysis(null) // Clear previous analysis
    setAnalysisError(null)
  }, [files])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }, [handleFiles])

  const removeFile = useCallback((index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setAnalysis(null) // Clear analysis when files change
    setAnalysisError(null)
  }, [files])

  const analyzeProject = useCallback(async () => {
    if (files.length === 0) return

    setIsAnalyzing(true)
    setAnalysisError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append('files', file)
        // Simulate progress
        setUploadProgress(((index + 1) / files.length) * 50)
      })

      const response = await fetch('/api/project/analyze', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(75)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      setAnalysis(result)
      setUploadProgress(100)
      
      console.log('Project analysis completed:', result)
    } catch (error) {
      console.error('Project analysis failed:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [files])

  const handleUpload = useCallback(() => {
    if (files.length === 0) {
      alert("Please select at least one file to upload.")
      return
    }

    onUpload(files, analysis || undefined, instructions)
    setOpen(false)
    setFiles([])
    setInstructions("")
    setAnalysis(null)
    setAnalysisError(null)
  }, [files, analysis, instructions, onUpload])

  const getFileIcon = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'tsx':
      case 'jsx':
      case 'ts':
      case 'js':
        return <Code className="w-4 h-4 text-blue-500" />
      case 'html':
        return <Globe className="w-4 h-4 text-orange-500" />
      case 'css':
      case 'scss':
      case 'sass':
        return <Code className="w-4 h-4 text-purple-500" />
      case 'json':
      case 'yaml':
      case 'yml':
        return <Settings className="w-4 h-4 text-yellow-500" />
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      case 'py':
        return <Code className="w-4 h-4 text-green-500" />
      case 'java':
        return <Code className="w-4 h-4 text-red-500" />
      case 'sql':
      case 'prisma':
        return <Database className="w-4 h-4 text-blue-600" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <ImageIcon className="w-4 h-4 text-green-500" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }, [])

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Upload & Analyze Project
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2" disabled={!analysis && !analysisError}>
              <Zap className="w-4 h-4" />
              Analysis
              {analysis && <CheckCircle className="w-3 h-3 text-green-500" />}
              {analysisError && <AlertCircle className="w-3 h-3 text-red-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                Upload your project files for AI-powered analysis and code generation. Supports JavaScript, TypeScript, Python, and more.
              </AlertDescription>
            </Alert>

            {/* File Upload Area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                dragActive 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                  : "border-neutral-300 dark:border-neutral-700"
              )}
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Supports: .js, .ts, .jsx, .tsx, .py, .html, .css, .json, .md, and more
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Max: 25 files, 10MB per file</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept=".js,.ts,.jsx,.tsx,.vue,.py,.java,.php,.rb,.go,.rs,.html,.css,.scss,.sass,.json,.yaml,.yml,.md,.txt,.sql,.prisma,.graphql"
            />

            {/* Progress Bar */}
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>
                    Selected Files ({files.length}/25) - {totalSizeMB}MB total
                  </Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={analyzeProject}
                    disabled={isAnalyzing || files.length === 0}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze Project
                      </>
                    )}
                  </Button>
                </div>
                <ScrollArea className="max-h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {getFileIcon(file)}
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            ({(file.size / 1024).toFixed(1)}KB)
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFile(index)} 
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Development Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Specific requirements: new features, bug fixes, optimizations, etc..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{instructions.length}/500 characters</p>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {analysisError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Analysis failed: {analysisError}
                </AlertDescription>
              </Alert>
            )}

            {analysis && (
              <div className="space-y-4">
                {/* Architecture Overview */}
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {analysis.structure.architecture.type}
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {analysis.structure.architecture.description}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{analysis.structure.files.length}</div>
                    <div className="text-xs text-muted-foreground">Files</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analysis.structure.dependencies.size}</div>
                    <div className="text-xs text-muted-foreground">Dependencies</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analysis.structure.components.size}</div>
                    <div className="text-xs text-muted-foreground">Components</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analysis.structure.frameworks.size}</div>
                    <div className="text-xs text-muted-foreground">Frameworks</div>
                  </div>
                </div>

                {/* Technologies */}
                <div className="space-y-2">
                  <Label>Detected Technologies</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(analysis.structure.frameworks).map((framework) => (
                      <Badge key={framework} variant="secondary">
                        {framework}
                      </Badge>
                    ))}
                    {analysis.structure.frameworks.size === 0 && (
                      <span className="text-sm text-muted-foreground">No frameworks detected</span>
                    )}
                  </div>
                </div>

                {/* Code Patterns */}
                <div className="space-y-2">
                  <Label>Code Patterns</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(analysis.structure.patterns).map((pattern) => (
                      <Badge key={pattern} variant="outline">
                        {pattern}
                      </Badge>
                    ))}
                    {analysis.structure.patterns.size === 0 && (
                      <span className="text-sm text-muted-foreground">No patterns detected</span>
                    )}
                  </div>
                </div>

                {/* Available Components */}
                {analysis.structure.components.size > 0 && (
                  <div className="space-y-2">
                    <Label>Available Components ({analysis.structure.components.size})</Label>
                    <ScrollArea className="max-h-24 border rounded-md p-2">
                      <div className="flex flex-wrap gap-1">
                        {Array.from(analysis.structure.components).map((component) => (
                          <Badge key={component} variant="secondary" className="text-xs">
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Dependencies */}
                {analysis.structure.dependencies.size > 0 && (
                  <div className="space-y-2">
                    <Label>Dependencies ({analysis.structure.dependencies.size})</Label>
                    <ScrollArea className="max-h-24 border rounded-md p-2">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {Array.from(analysis.structure.dependencies).sort().map((dep) => (
                          <div key={dep} className="truncate text-muted-foreground">
                            {dep}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <Label>AI Recommendations</Label>
                    <div className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border">
                          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-yellow-800 dark:text-yellow-200">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!analysis && !analysisError && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Upload files and click Analyze Project to see detailed analysis</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading || isAnalyzing}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || isLoading || isAnalyzing}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Generate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}