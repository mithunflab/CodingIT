"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Code2, 
  Lightbulb, 
  Bug, 
  Zap, 
  RefreshCw,
  Copy,
  Check,
  Download,
  FileText,
  Sparkles,
  Terminal,
  Wand2,
  MessageSquare,
  Eye,
  EyeOff,
  Settings,
  History,
  Trash2,
  Star,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  codeBlocks?: {
    language: string
    code: string
    description: string
    file?: string
  }[]
  suggestions?: {
    type: 'implement' | 'refactor' | 'optimize' | 'debug'
    title: string
    description: string
    code?: string
  }[]
  isTyping?: boolean
}

interface FileContext {
  name: string
  content: string
  path: string
  language?: string
}

interface AICodeAssistantProps {
  files: FileContext[]
  activeFile: string
  sandboxId?: string
  onCodeRequest: (request: string, context?: any) => Promise<void>
  onFileUpdate: (filePath: string, content: string) => void
  className?: string
}

const AI_PROMPTS = {
  explain: "Explain how this code works",
  optimize: "Optimize this code for better performance",
  debug: "Find and fix bugs in this code",
  refactor: "Refactor this code to be cleaner and more maintainable",
  test: "Generate unit tests for this code",
  document: "Add comprehensive documentation to this code",
  security: "Review this code for security vulnerabilities",
  modernize: "Update this code to use modern best practices"
}

const QUICK_ACTIONS = [
  { id: 'explain', label: 'Explain Code', icon: MessageSquare, color: 'blue' },
  { id: 'optimize', label: 'Optimize', icon: Zap, color: 'green' },
  { id: 'debug', label: 'Debug', icon: Bug, color: 'red' },
  { id: 'refactor', label: 'Refactor', icon: RefreshCw, color: 'purple' },
  { id: 'test', label: 'Generate Tests', icon: FileText, color: 'orange' },
  { id: 'document', label: 'Add Docs', icon: BookOpen, color: 'indigo' }
]

export function AICodeAssistant({
  files,
  activeFile,
  sandboxId,
  onCodeRequest,
  onFileUpdate,
  className
}: AICodeAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI coding assistant. I can help you with code explanation, debugging, optimization, refactoring, and more. What would you like to work on?",
      timestamp: new Date(),
      suggestions: [
        {
          type: 'implement',
          title: 'Code Review',
          description: 'Get a comprehensive review of your current code'
        },
        {
          type: 'optimize',
          title: 'Performance Analysis',
          description: 'Analyze and optimize your code performance'
        },
        {
          type: 'debug',
          title: 'Bug Detection',
          description: 'Find and fix potential issues in your code'
        }
      ]
    }
  ])
  
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(activeFile)
  const [selectedCode, setSelectedCode] = useState('')
  const [showCodeContext, setShowCodeContext] = useState(true)
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'settings'>('chat')
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: AIMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      const currentFile = files.find(f => f.name === selectedFile)
      const context = {
        file: selectedFile,
        content: currentFile?.content || '',
        language: currentFile?.language || 'text',
        selection: selectedCode,
        allFiles: files.map(f => ({ name: f.name, language: f.language }))
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: currentMessage,
          context,
          history: messages.slice(-10),
          sandboxId: sandboxId,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const { message: aiResponse, suggestions, codeBlocks } = await response.json()

      // Remove typing indicator and add real response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing')
        const aiMessage: AIMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          codeBlocks,
          suggestions
        }
        return [...filtered, aiMessage]
      })

    } catch (error) {
      console.error('AI chat error:', error)
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing')
        const errorMessage: AIMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date()
        }
        return [...filtered, errorMessage]
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentMessage, isLoading, files, selectedFile, selectedCode, messages, sandboxId])

  const handleQuickAction = useCallback(async (actionId: string) => {
    const prompt = AI_PROMPTS[actionId as keyof typeof AI_PROMPTS]
    if (!prompt) return

    const currentFile = files.find(f => f.name === selectedFile)
    if (!currentFile) return

    const codeToAnalyze = selectedCode || currentFile.content
    const fullPrompt = `${prompt}:\n\n\`\`\`${currentFile.language}\n${codeToAnalyze}\n\`\`\``

    setCurrentMessage(fullPrompt)
    setTimeout(() => handleSendMessage(), 100)
  }, [files, selectedFile, selectedCode, handleSendMessage])

  const handleApplyCode = useCallback((code: string, file?: string) => {
    const targetFile = file || selectedFile
    const fileToUpdate = files.find(f => f.name === targetFile)
    
    if (fileToUpdate) {
      onFileUpdate(fileToUpdate.path, code)
    }
  }, [files, selectedFile, onFileUpdate])

  const handleCopyCode = useCallback(async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedStates(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const currentFile = files.find(f => f.name === selectedFile)

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0">
          {/* File Context Header */}
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AI Assistant</span>
                {sandboxId && (
                  <Badge variant="outline" className="text-xs">
                    <Terminal className="w-3 h-3 mr-1" />
                    {sandboxId.slice(0, 8)}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCodeContext(!showCodeContext)}
              >
                {showCodeContext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            
            {showCodeContext && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active File:</span>
                  <Select value={selectedFile} onValueChange={setSelectedFile}>
                    <SelectTrigger className="w-auto h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {files.map((file) => (
                        <SelectItem key={file.name} value={file.name}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            {file.name}
                            <Badge variant="outline" className="text-xs">
                              {file.language}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedCode && (
                  <div className="p-2 bg-accent rounded text-xs">
                    <span className="text-muted-foreground">Selected: </span>
                    <span className="font-mono">{selectedCode.slice(0, 50)}...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-b">
            <div className="text-xs font-medium mb-2 text-muted-foreground">Quick Actions:</div>
            <div className="flex flex-wrap gap-1">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.id)}
                  disabled={isLoading || !currentFile}
                  className="h-7 text-xs gap-1"
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Code Blocks */}
                        {message.codeBlocks?.map((block, index) => (
                          <div key={index} className="mt-3 border rounded">
                            <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Code2 className="w-3 h-3" />
                                <span className="text-xs font-medium">{block.language}</span>
                                {block.file && (
                                  <Badge variant="outline" className="text-xs">
                                    {block.file}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyCode(block.code, `${message.id}-${index}`)}
                                  className="h-6 w-6 p-0"
                                >
                                  {copiedStates[`${message.id}-${index}`] ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApplyCode(block.code, block.file)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Apply
                                </Button>
                              </div>
                            </div>
                            <div className="p-3">
                              <pre className="text-xs overflow-x-auto">
                                <code>{block.code}</code>
                              </pre>
                            </div>
                            {block.description && (
                              <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground">
                                {block.description}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Suggestions */}
                        {message.suggestions?.map((suggestion, index) => (
                          <div key={index} className="mt-2 p-2 border rounded bg-accent/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-medium">{suggestion.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {suggestion.description}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  if (suggestion.code) {
                                    handleApplyCode(suggestion.code)
                                  }
                                }}
                              >
                                <Wand2 className="w-3 h-3 mr-1" />
                                Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t">
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your code... (Ctrl+Enter to send)"
                className="min-h-[80px] resize-none"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Ctrl+Enter to send
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  size="sm"
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0">
          <div className="p-4">
            <div className="text-center text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Chat history will be available here</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">AI Model</h4>
              <Select defaultValue="gpt-4">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Code Context</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Include file context in requests</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Auto-detect code language</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Include project dependencies</span>
                </label>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
