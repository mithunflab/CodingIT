"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import './code-theme.css'
import { Textarea } from '@/components/ui/textarea'
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
  Settings,
  Code2,
  Sparkles,
  MessageSquare,
  Command,
  Search,
  Lightbulb,
  RefreshCw,
  GitBranch,
  Bug,
  Wand2,
  Bot,
  Terminal,
  FileCode,
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Copy,
  Download,
  Share,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileTree, FileTreeNode } from './file-tree'

interface FileContent {
  name: string
  content: string
  path: string
  language?: string
  modified?: boolean
  saving?: boolean
  suggestions?: CodeSuggestion[]
  diagnostics?: Diagnostic[]
}

interface CodeSuggestion {
  id: string
  type: 'completion' | 'refactor' | 'fix' | 'optimize'
  line: number
  column: number
  text: string
  replacement: string
  confidence: number
  description: string
}

interface Diagnostic {
  id: string
  type: 'error' | 'warning' | 'info'
  line: number
  column: number
  message: string
  suggestion?: string
}

interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  codeContext?: {
    file: string
    lines: number[]
    selection?: string
  }
}

interface CursorLikeEditorProps {
  files: Array<{ name: string; content: string; path?: string }>
  sandboxId?: string
  onFileUpdate?: (filePath: string, content: string) => void
  className?: string
}

function buildFileTree(files: { path: string }[]): FileTreeNode[] {
  const root: FileTreeNode = { name: 'root', type: 'folder', children: [] };

  for (const file of files) {
    const pathParts = file.path.split('/').filter(p => p);
    let currentNode = root;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      let childNode = currentNode.children!.find(c => c.name === part);

      if (!childNode) {
        const isFile = i === pathParts.length - 1;
        childNode = {
          name: part,
          type: isFile ? 'file' : 'folder',
        };
        if (!isFile) {
          childNode.children = [];
        }
        currentNode.children!.push(childNode);
        // Keep children sorted, folders first
        currentNode.children!.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      }
      currentNode = childNode;
    }
  }
  return root.children || [];
}

export function CursorLikeEditor({ files, sandboxId, onFileUpdate, className }: CursorLikeEditorProps) {
  const [currentFile, setCurrentFile] = useState(files[0]?.path || files[0]?.name || '')
  const [fileContents, setFileContents] = useState<Record<string, FileContent>>(() => {
    const initial: Record<string, FileContent> = {}
    files.forEach(file => {
      const path = file.path || file.name
      initial[path] = {
        name: file.name,
        content: file.content,
        path: path,
        language: getLanguageFromFilename(file.name),
        modified: false,
        saving: false,
        suggestions: [],
        diagnostics: []
      }
    })
    return initial
  })
  
  // Editor State
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [selectedText, setSelectedText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // AI Features
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiChatMessages, setAIChatMessages] = useState<AIChatMessage[]>([])
  const [aiPrompt, setAIPrompt] = useState('')
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState<CodeSuggestion | null>(null)
  
  // UI State
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'files' | 'chat' | 'diagnostics'>('files')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const aiGenerationRef = useRef<AbortController>()

  const fileTree = useMemo(() => buildFileTree(files.map(f => ({ path: f.path || f.name }))), [files])
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

  // AI-powered code analysis and suggestions
  const analyzeCode = useCallback(async (content: string, language: string) => {
    if (!content.trim()) return

    try {
      const response = await fetch('/api/ai/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: content,
          language,
          file: currentFile,
          cursorPosition
        })
      })

      if (!response.ok) throw new Error('Failed to analyze code')

      const { suggestions: newSuggestions, diagnostics } = await response.json()
      
      setFileContents(prev => ({
        ...prev,
        [currentFile]: {
          ...prev[currentFile],
          suggestions: newSuggestions || [],
          diagnostics: diagnostics || []
        }
      }))

      setSuggestions(newSuggestions || [])
    } catch (error) {
      console.error('Code analysis failed:', error)
    }
  }, [currentFile, cursorPosition])

  // Save file to sandbox
  const saveFile = useCallback(async (filePath: string, content: string) => {
    if (!sandboxId) {
      setError('No sandbox connected')
      return false
    }

    setSaveStatus('saving')
    setError(null)
    
    setFileContents(prev => ({
      ...prev,
      [filePath]: { ...prev[filePath], saving: true }
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
        [filePath]: { 
          ...prev[filePath], 
          modified: false, 
          saving: false 
        }
      }))

      onFileUpdate?.(filePath, content)

      // Analyze saved code for suggestions
      await analyzeCode(content, getLanguageFromFilename(filePath))

      setTimeout(() => setSaveStatus('idle'), 2000)
      return true
    } catch (error: any) {
      console.error('Failed to save file:', error)
      setSaveStatus('error')
      setError(error.message)
      
      setFileContents(prev => ({
        ...prev,
        [filePath]: { ...prev[filePath], saving: false }
      }))
      
      setTimeout(() => setSaveStatus('idle'), 3000)
      return false
    }
  }, [sandboxId, analyzeCode, onFileUpdate])

  const handleAutoSave = useCallback((filePath: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveFile(filePath, content)
    }, 1000)
  }, [saveFile])

  // Generate AI code completions
  const generateCompletion = useCallback(async (prompt: string, context: string) => {
    if (aiGenerationRef.current) {
      aiGenerationRef.current.abort()
    }

    aiGenerationRef.current = new AbortController()
    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/complete-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context,
          language: currentFileData?.language,
          file: currentFile,
          cursorPosition,
          sandboxId
        }),
        signal: aiGenerationRef.current.signal
      })

      if (!response.ok) throw new Error('Failed to generate completion')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let completion = ''
      const textarea = textareaRef.current
      if (!textarea) return

      const originalContent = textarea.value
      const insertionPoint = textarea.selectionStart

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        completion += chunk
        
        const newContent = originalContent.slice(0, insertionPoint) + completion + originalContent.slice(insertionPoint)
        
        setFileContents(prev => ({
          ...prev,
          [currentFile]: {
            ...prev[currentFile],
            content: newContent,
            modified: true
          }
        }))
      }

      if (isLiveMode && sandboxId) {
        handleAutoSave(currentFileData.path, fileContents[currentFile].content)
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Code generation failed:', error)
        setError('Failed to generate code completion')
      }
    } finally {
      setIsGenerating(false)
    }
  }, [currentFile, currentFileData, cursorPosition, handleAutoSave, isLiveMode, sandboxId, fileContents])

  const handleContentChange = useCallback((newContent: string) => {
    setFileContents(prev => ({
      ...prev,
      [currentFile]: {
        ...prev[currentFile],
        content: newContent,
        modified: prev[currentFile]?.content !== newContent
      }
    }))

    if (isLiveMode && sandboxId) {
      handleAutoSave(currentFileData?.path || currentFile, newContent)
    }

    if (newContent.trim()) {
      const debounceTimeout = setTimeout(() => {
        analyzeCode(newContent, currentFileData?.language || 'text')
      }, 500)
      
      return () => clearTimeout(debounceTimeout)
    }
  }, [currentFile, isLiveMode, sandboxId, handleAutoSave, currentFileData, analyzeCode])

  const handleCursorChange = useCallback((event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget
    const start = textarea.selectionStart
    const content = textarea.value.substring(0, start)
    const lines = content.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length + 1

    setCursorPosition({ line, column })

    const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
    setSelectedText(selection)
  }, [])

  const sendAIMessage = useCallback(async () => {
    if (!aiPrompt.trim()) return

    const userMessage: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: aiPrompt,
      timestamp: new Date(),
      codeContext: selectedText ? {
        file: currentFile,
        lines: [cursorPosition.line],
        selection: selectedText
      } : undefined
    }

    setAIChatMessages(prev => [...prev, userMessage])
    setAIPrompt('')
    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: aiPrompt,
          context: {
            file: currentFile,
            content: currentFileData?.content,
            language: currentFileData?.language,
            selection: selectedText,
            cursorPosition
          },
          history: aiChatMessages.slice(-10)
        })
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const { message } = await response.json()

      const assistantMessage: AIChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date()
      }

      setAIChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI chat failed:', error)
      setError('Failed to get AI response')
    } finally {
      setIsGenerating(false)
    }
  }, [aiPrompt, currentFile, currentFileData, selectedText, cursorPosition, aiChatMessages])

  const applySuggestion = useCallback((suggestion: CodeSuggestion) => {
    if (!currentFileData) return

    const lines = currentFileData.content.split('\n')
    const lineContent = lines[suggestion.line - 1]
    const newContent = lines.join('\n').replace(lineContent, suggestion.replacement)

    setFileContents(prev => ({
      ...prev,
      [currentFile]: {
        ...prev[currentFile],
        content: newContent,
        modified: true
      }
    }))

    setActiveSuggestion(null)

    if (isLiveMode && sandboxId) {
      handleAutoSave(currentFileData.path, newContent)
    }
  }, [currentFile, currentFileData, isLiveMode, sandboxId, handleAutoSave])

  const commandActions = useMemo(() => [
    {
      id: 'save',
      title: 'Save File',
      action: () => currentFileData && saveFile(currentFileData.path, currentFileData.content),
      shortcut: 'Ctrl+S',
      icon: <Save className="w-4 h-4" />
    },
    {
      id: 'ai-generate',
      title: 'Generate Code with AI...',
      action: () => {
        const prompt = window.prompt("Enter a prompt for the AI to generate code:")
        if (prompt) {
          generateCompletion(prompt, selectedText || currentFileData?.content || '')
        }
      },
      shortcut: 'Ctrl+K',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'format',
      title: 'Format Document',
      action: () => console.log('Format document'),
      shortcut: 'Shift+Alt+F',
      icon: <Wand2 className="w-4 h-4" />
    },
    {
      id: 'find',
      title: 'Find in File',
      action: () => setShowSearch(s => !s),
      shortcut: 'Ctrl+F',
      icon: <Search className="w-4 h-4" />
    }
  ], [currentFileData, saveFile, generateCompletion, selectedText])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            if (currentFileData) {
              saveFile(currentFileData.path, currentFileData.content)
            }
            break
          case 'k':
            event.preventDefault()
            setShowCommandPalette(true)
            break
          case '/':
            event.preventDefault()
            setShowAIChat(true)
            setSidebarActiveTab('chat')
            break
          case 'f':
            event.preventDefault()
            setShowSearch(s => !s)
            break
        }
      }
      if (event.key === 'Escape') {
        if (showCommandPalette) setShowCommandPalette(false)
        if (showSearch) setShowSearch(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentFileData, saveFile, showCommandPalette, showSearch])

  const getFileIcon = useCallback((filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) return <FileCode className="w-4 h-4 text-blue-500" />
    if (['css', 'scss', 'sass'].includes(ext || '')) return <FileCode className="w-4 h-4 text-pink-500" />
    if (['json', 'yaml', 'yml', 'toml'].includes(ext || '')) return <Settings className="w-4 h-4 text-yellow-500" />
    return <FileText className="w-4 h-4 text-gray-500" />
  }, [])

  const modifiedFiles = Object.values(fileContents).filter(f => f.modified)
  const hasUnsavedChanges = modifiedFiles.length > 0

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Editor
          </h3>
          {hasUnsavedChanges && <Badge variant="secondary" className="text-xs">{modifiedFiles.length} unsaved</Badge>}
          {isGenerating && <Badge variant="outline" className="text-xs"><Loader2 className="w-3 h-3 animate-spin mr-1" /></Badge>}
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setShowCommandPalette(true)} className="gap-1"><Command className="w-3 h-3" />Command</Button></TooltipTrigger><TooltipContent>Open Command Palette (Ctrl+K)</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant={showAIChat ? "default" : "outline"} size="sm" onClick={() => setShowAIChat(!showAIChat)} className="gap-1"><Bot className="w-3 h-3" />AI Chat</Button></TooltipTrigger><TooltipContent>Toggle AI Assistant (Ctrl+/)</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant={isLiveMode ? "default" : "outline"} size="sm" onClick={() => setIsLiveMode(!isLiveMode)} className="gap-1">{isLiveMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}Live</Button></TooltipTrigger><TooltipContent>{isLiveMode ? 'Disable auto-save' : 'Enable auto-save'}</TooltipContent></Tooltip>
          </TooltipProvider>
          {!isLiveMode && (
            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => currentFileData && saveFile(currentFileData.path, currentFileData.content)} disabled={!currentFileData?.modified || saveStatus === 'saving'} className="gap-1">{saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : saveStatus === 'success' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : saveStatus === 'error' ? <AlertCircle className="w-3 h-3 text-red-500" /> : <Save className="w-3 h-3" />}Save</Button></TooltipTrigger><TooltipContent>Save file (Ctrl+S)</TooltipContent></Tooltip></TooltipProvider>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <div className="w-80 border-r bg-muted/20 flex flex-col">
            <div className="flex border-b">
              {(['files', 'chat', 'diagnostics'] as const).map((tab) => (
                <Button key={tab} variant={sidebarActiveTab === tab ? "default" : "ghost"} size="sm" onClick={() => setSidebarActiveTab(tab)} className="flex-1 rounded-none">
                  {tab === 'files' && <Folder className="w-4 h-4 mr-1" />}
                  {tab === 'chat' && <MessageSquare className="w-4 h-4 mr-1" />}
                  {tab === 'diagnostics' && <Bug className="w-4 h-4 mr-1" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              {sidebarActiveTab === 'files' && (
                <FileTree
                  files={fileTree}
                  onFileSelect={(path) => {
                    const file = Object.values(fileContents).find(f => f.path === path)
                    if (file) {
                      setCurrentFile(file.path)
                    }
                  }}
                />
              )}
              {sidebarActiveTab === 'chat' && (
                <div className="p-4 flex flex-col h-full">
                  <div className="flex-1 space-y-2 mb-4 overflow-y-auto">
                    {aiChatMessages.map((message) => (
                      <div key={message.id} className={cn("p-2 rounded text-sm", message.role === 'user' ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-800")}>
                        <div className="font-medium text-xs mb-1">{message.role === 'user' ? 'You' : 'AI Assistant'}</div>
                        <div>{message.content}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Textarea value={aiPrompt} onChange={(e) => setAIPrompt(e.target.value)} placeholder="Ask AI about your code..." className="min-h-[80px]" onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendAIMessage() }} />
                    <Button onClick={sendAIMessage} disabled={!aiPrompt.trim() || isGenerating} className="w-full" size="sm">{isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}Send to AI</Button>
                  </div>
                </div>
              )}
              {sidebarActiveTab === 'diagnostics' && (
                <div className="p-2">
                  <Button variant="outline" size="sm" className="w-full mb-2" onClick={() => currentFileData && analyzeCode(currentFileData.content, currentFileData.language || 'text')}><RefreshCw className="w-3 h-3 mr-2" />Re-run Analysis</Button>
                  <div className="space-y-2">
                    {currentFileData?.diagnostics?.map((d) => (
                      <div key={d.id} className={cn("p-2 rounded text-sm border-l-4", d.type === 'error' && "border-red-500 bg-red-50 dark:bg-red-900/20", d.type === 'warning' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20", d.type === 'info' && "border-blue-500 bg-blue-50 dark:bg-blue-900/20")}>
                        <div className="font-medium">{d.message}</div>
                        <div className="text-xs text-muted-foreground">Line {d.line}, Column {d.column}</div>
                        {d.suggestion && <Button variant="ghost" className="h-auto p-1 text-xs mt-1 text-blue-600 dark:text-blue-400"><Wand2 className="w-3 h-3 mr-1" /> {d.suggestion}</Button>}
                      </div>
                    )) || <div className="text-sm text-muted-foreground text-center py-4">No issues found</div>}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="flex border-b bg-muted/10 overflow-x-auto">
            {Object.keys(fileContents).map((filePath) => (
              <div key={filePath} className={cn("flex items-center gap-2 pl-3 pr-2 py-2 border-r cursor-pointer hover:bg-accent", currentFile === filePath && "bg-accent border-b-2 border-b-primary")} onClick={() => setCurrentFile(filePath)}>
                {getFileIcon(fileContents[filePath].name)}
                <span className="text-sm">{fileContents[filePath].name}</span>
                {fileContents[filePath].modified && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                <Button variant="ghost" size="icon" className="w-5 h-5" onClick={(e) => { e.stopPropagation(); const {[filePath]: _, ...rest} = fileContents; setFileContents(rest); if(currentFile === filePath) setCurrentFile(Object.keys(rest)[0] || '')}}><X className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>

          {currentFileData ? (
            <div className="flex-1 relative">
              <div className="absolute inset-0 flex flex-col">
                <div className="flex items-center justify-between p-2 border-b bg-muted/20">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{currentFileData.name}</span>
                    <Badge variant="outline" className="text-xs">{currentFileData.language}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)}><Search className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(currentFileData.content)}><Copy className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { const blob = new Blob([currentFileData.content], {type: 'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = currentFileData.name; a.click(); URL.revokeObjectURL(url);}}><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => navigator.share({ title: currentFileData.name, text: `Check out this code from my sandbox!` })}><Share className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { const original = files.find(f => (f.path || f.name) === currentFile); if(original) handleContentChange(original.content)}}><RotateCcw className="w-4 h-4" /></Button>
                  </div>
                </div>
                
                {showSearch && (
                  <div className="p-2 border-b"><Input placeholder="Search in file..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus onKeyDown={e => e.key === 'Escape' && setShowSearch(false)} /></div>
                )}

                {suggestions.length > 0 && (
                  <div className="border-b bg-blue-50 dark:bg-blue-900/20 p-2">
                    <div className="text-xs font-medium mb-1">AI Suggestions:</div>
                    <div className="flex gap-2 flex-wrap">
                      {suggestions.slice(0, 3).map((s) => (
                        <Button key={s.id} variant="outline" size="sm" onClick={() => applySuggestion(s)} onMouseEnter={() => setActiveSuggestion(s)} onMouseLeave={() => setActiveSuggestion(null)} className={cn("text-xs h-6", activeSuggestion?.id === s.id && "ring-2 ring-blue-500")}>
                          <Lightbulb className="w-3 h-3 mr-1" />{s.description}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <ScrollArea className="flex-1">
                  <textarea ref={textareaRef} value={currentFileData.content} onChange={(e) => handleContentChange(e.target.value)} onSelect={handleCursorChange} className="w-full h-full min-h-[500px] p-4 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed" placeholder="Start coding..." spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No file selected</p>
                <p className="text-sm">Choose a file from the sidebar to start coding</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <Alert className="m-3"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Command Palette</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Input placeholder="Type a command..." className="w-full" autoFocus />
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {commandActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer" onClick={() => { action.action(); setShowCommandPalette(false); }}>
                  <span className="text-sm flex items-center gap-2">{action.icon}{action.title}</span>
                  <Badge variant="outline" className="text-xs">{action.shortcut}</Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {sandboxId && <span className="flex items-center gap-1"><Terminal className="w-3 h-3" />Sandbox: {sandboxId.slice(0, 8)}...</span>}
          <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />main</span>
        </div>
        <div className="flex items-center gap-4">
          {currentFileData && (
            <>
              <span>{currentFileData.language?.toUpperCase() || 'TEXT'}</span>
              <span>Line {cursorPosition.line}, Col {cursorPosition.column}</span>
              <span>UTF-8</span>
              <span>LF</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
