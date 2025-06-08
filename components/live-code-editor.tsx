"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  FileText,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileContent {
  name: string
  content: string
  path: string
  language?: string
  modified?: boolean
  saving?: boolean
}

interface LiveCodeEditorProps {
  files: Array<{ name: string; content: string; path?: string }>
  sandboxId?: string
  onFileUpdate?: (filePath: string, content: string) => void
  className?: string
}

export function LiveCodeEditor({ files, sandboxId, onFileUpdate, className }: LiveCodeEditorProps) {
  const [currentFile, setCurrentFile] = useState(files[0]?.name || '')
  const [fileContents, setFileContents] = useState<Record<string, FileContent>>(() => {
    const initial: Record<string, FileContent> = {}
    files.forEach(file => {
      initial[file.name] = {
        name: file.name,
        content: file.content,
        path: file.path || file.name,
        language: getLanguageFromFilename(file.name),
        modified: false,
        saving: false
      }
    })
    return initial
  })
  
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  const currentFileData = fileContents[currentFile]

  function getLanguageFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript', 
      'jsx': 'javascript',
      'json': 'json',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'php': 'php'
    }
    return languageMap[ext || ''] || 'text'
  }

  const saveFile = useCallback(async (filePath: string, content: string) => {
    if (!sandboxId) {
      setError('No sandbox connected')
      return false
    }

    setSaveStatus('saving')
    setError(null)
    
    setFileContents(prev => ({
      ...prev,
      [currentFile]: { ...prev[currentFile], saving: true }
    }))

    try {
      const response = await fetch('/api/sandbox/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          filePath,
          content
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save file')
      }

      setSaveStatus('success')
      setFileContents(prev => ({
        ...prev,
        [currentFile]: { 
          ...prev[currentFile], 
          modified: false, 
          saving: false 
        }
      }))

      onFileUpdate?.(filePath, content)

      // Reset success status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
      
      return true
    } catch (error: any) {
      console.error('Failed to save file:', error)
      setSaveStatus('error')
      setError(error.message)
      
      setFileContents(prev => ({
        ...prev,
        [currentFile]: { ...prev[currentFile], saving: false }
      }))
      
      setTimeout(() => setSaveStatus('idle'), 3000)
      return false
    }
  }, [sandboxId, currentFile, onFileUpdate])

  const handleContentChange = useCallback((newContent: string) => {
    setFileContents(prev => ({
      ...prev,
      [currentFile]: {
        ...prev[currentFile],
        content: newContent,
        modified: prev[currentFile].content !== newContent
      }
    }))

    if (isLiveMode && sandboxId) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      // Debounce auto-save by 1 second
      saveTimeoutRef.current = setTimeout(() => {
        saveFile(currentFileData?.path || currentFile, newContent)
      }, 1000)
    }
  }, [currentFile, isLiveMode, sandboxId, saveFile, currentFileData?.path])

  const handleManualSave = useCallback(async () => {
    if (!currentFileData) return
    
    const success = await saveFile(currentFileData.path, currentFileData.content)
    if (success && saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }, [currentFileData, saveFile])

  const resetFile = useCallback(() => {
    const originalFile = files.find(f => f.name === currentFile)
    if (originalFile) {
      setFileContents(prev => ({
        ...prev,
        [currentFile]: {
          ...prev[currentFile],
          content: originalFile.content,
          modified: false
        }
      }))
      setError(null)
    }
  }, [currentFile, files])

  const getFileIcon = useCallback((filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    
    if (['json', 'yaml', 'yml', 'toml'].includes(ext || '')) {
      return <Settings className="w-4 h-4 text-yellow-500" />
    }
    return <FileText className="w-4 h-4 text-blue-500" />
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const modifiedFiles = Object.values(fileContents).filter(f => f.modified)
  const hasUnsavedChanges = modifiedFiles.length > 0

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Live Editor</h3>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="text-xs">
              {modifiedFiles.length} unsaved
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isLiveMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className="gap-1"
                >
                  {isLiveMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  Live
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isLiveMode ? 'Disable auto-save on edit' : 'Enable auto-save on edit'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isLiveMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSave}
                    disabled={!currentFileData?.modified || saveStatus === 'saving'}
                    className="gap-1"
                  >
                    {saveStatus === 'saving' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : saveStatus === 'success' ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : saveStatus === 'error' ? (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save current file</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFile}
                  disabled={!currentFileData?.modified}
                  className="gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to original content</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Status */}
      {error && (
        <Alert variant="destructive" className="m-3 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLiveMode && (
        <Alert className="m-3 mb-0">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Live mode enabled - changes will auto-save and update the preview
          </AlertDescription>
        </Alert>
      )}

      {/* File Tabs */}
      <div className="flex items-center px-3 pt-3 gap-2 overflow-x-auto">
        {files.map((file, index) => {
          const fileData = fileContents[file.name]
          return (
            <div
              key={file.path || `${file.name}-${index}`}
              className={cn(
                "flex gap-2 select-none cursor-pointer items-center text-sm px-3 py-2 rounded-md border transition-colors",
                file.name === currentFile 
                  ? 'bg-background border-border shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted/50 border-transparent'
              )}
              onClick={() => setCurrentFile(file.name)}
            >
              {getFileIcon(file.name)}
              <span className="truncate">{file.name}</span>
              {fileData?.modified && (
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
              )}
              {fileData?.saving && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
            </div>
          )
        })}
      </div>

      {/* Editor */}
      <div className="flex-1 p-3">
        {currentFileData ? (
          <div className="h-full border rounded-lg bg-muted/20">
            <div className="flex items-center justify-between p-2 border-b bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                {getFileIcon(currentFileData.name)}
                <span className="font-medium">{currentFileData.name}</span>
                <Badge variant="outline" className="text-xs">
                  {currentFileData.language}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentFileData.content.length} characters
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100%-3rem)]">
              <textarea
                ref={textareaRef}
                id={`live-editor-textarea-${currentFileData.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                name="code-editor-content"
                value={currentFileData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full min-h-[400px] p-4 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed"
                placeholder="Start editing your code..."
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </ScrollArea>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select a file to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}