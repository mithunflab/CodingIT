'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Square, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  FileText, 
  Settings, 
  Zap,
  GitBranch,
  Bug,
  BookOpen,
  Loader2
} from 'lucide-react'
import { 
  useE2BTools, 
  type UseE2BToolsOptions, 
  type E2BToolType 
} from '../../components/e2b-tools'
import type { LLMModel, LLMModelConfig } from '@/lib/models'

interface E2BToolsPanelProps {
  userID: string
  teamID: string
  sessionId?: string
  model: LLMModel
  config: LLMModelConfig
  projectFiles?: Array<{
    name: string
    content: string
    path: string
    type: string
  }>
  onResultGenerated?: (result: any) => void
  className?: string
}

interface ToolDefinition {
  id: E2BToolType
  name: string
  description: string
  icon: any
  category: 'development' | 'optimization' | 'analysis' | 'documentation'
  placeholder: string
  minLength: number
}

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'new_task',
    name: 'New Task Execution',
    description: 'Execute complex development tasks with production-grade results',
    icon: Code2,
    category: 'development',
    placeholder: 'Describe the application or feature you want to build...\n\nExample: "Create a modern dashboard with real-time analytics, dark mode support, and responsive design using React and TypeScript"',
    minLength: 20
  },
  {
    id: 'condense',
    name: 'Context Condensation',
    description: 'Intelligently condense conversation context for optimal execution',
    icon: GitBranch,
    category: 'optimization',
    placeholder: 'Paste the conversation context or documentation you want to condense...\n\nThis tool will reduce context size by 70% while retaining 100% of critical information.',
    minLength: 100
  },
  {
    id: 'new_rule',
    name: 'Rule Generation',
    description: 'Generate project-specific development rules and guidelines',
    icon: Settings,
    category: 'analysis',
    placeholder: 'Describe the type of rules or guidelines you need...\n\nExample: "Create coding standards for TypeScript React components with focus on performance and accessibility"',
    minLength: 15
  },
  {
    id: 'report_bug',
    name: 'Bug Analysis & Resolution',
    description: 'Comprehensive bug analysis with production-ready solutions',
    icon: Bug,
    category: 'development',
    placeholder: 'Describe the bug or issue you\'re experiencing...\n\nInclude: error messages, steps to reproduce, expected vs actual behavior, and any relevant code snippets.',
    minLength: 25
  },
  {
    id: 'generate_docs',
    name: 'Documentation Generation',
    description: 'Generate comprehensive technical documentation',
    icon: BookOpen,
    category: 'documentation',
    placeholder: 'Specify what documentation you need...\n\nExample: "Generate API documentation for user authentication endpoints" or "Create setup guide for the project"',
    minLength: 15
  }
]

const CATEGORY_COLORS = {
  development: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800',
  optimization: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800',
  analysis: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-300 dark:border-purple-800',
  documentation: 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-300 dark:border-orange-800'
}

export function E2BToolsPanel({
  userID,
  teamID,
  sessionId,
  model,
  config,
  projectFiles,
  onResultGenerated,
  className
}: E2BToolsPanelProps) {
  const [selectedTool, setSelectedTool] = useState<E2BToolType>('new_task')
  const [userInput, setUserInput] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const e2bTools = useE2BTools({
    userID,
    teamID,
    sessionId,
    model,
    config,
    onSuccess: (result) => {
      console.log('E2B tool execution completed:', result)
      onResultGenerated?.(result)
    },
    onError: (error) => {
      console.error('E2B tool execution failed:', error)
    }
  })

  const selectedToolDef = TOOL_DEFINITIONS.find(tool => tool.id === selectedTool)
  const filteredTools = activeCategory === 'all' 
    ? TOOL_DEFINITIONS 
    : TOOL_DEFINITIONS.filter(tool => tool.category === activeCategory)

  const categories = ['all', ...Array.from(new Set(TOOL_DEFINITIONS.map(tool => tool.category)))]

  const handleExecute = async () => {
    if (!userInput.trim() || !selectedToolDef) return

    if (userInput.length < selectedToolDef.minLength) {
      return
    }

    await e2bTools.executeE2BTool(selectedTool, userInput, projectFiles)
  }

  const handleCancel = () => {
    e2bTools.cancelExecution()
  }

  const isInputValid = userInput.trim().length >= (selectedToolDef?.minLength || 10)
  const canExecute = isInputValid && !e2bTools.isExecuting

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Tools</CardTitle>
              <p className="text-sm text-muted-foreground">
                Production-grade AI tools for development workflow
              </p>
            </div>
          </div>
          {e2bTools.availableTools.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {e2bTools.availableTools.length} tools available
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Display */}
        {e2bTools.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{e2bTools.error.message}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={e2bTools.clearError}
                className="h-auto p-1 text-xs"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Display */}
        {e2bTools.isExecuting && e2bTools.progress && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{e2bTools.progress.message}</span>
                  <span className="text-xs text-muted-foreground">{e2bTools.progress.progress}%</span>
                </div>
                <Progress value={e2bTools.progress.progress} className="h-2" />
                {e2bTools.progress.details && (
                  <div className="text-xs text-muted-foreground">
                    {JSON.stringify(e2bTools.progress.details)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Result Display */}
        {e2bTools.lastResult && !e2bTools.isExecuting && (
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Tool execution completed successfully
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {e2bTools.lastResult.performance.executionTime}ms
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Files generated: {e2bTools.lastResult.executionResult.files.length}</div>
                    <div>Sandbox ID: {e2bTools.lastResult.executionResult.sandboxId}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="execute" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="execute">Execute Tools</TabsTrigger>
            <TabsTrigger value="results">View Results</TabsTrigger>
          </TabsList>

          <TabsContent value="execute" className="space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="h-7 text-xs capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Tool Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTools.map((tool) => {
                const Icon = tool.icon
                const isSelected = selectedTool === tool.id
                return (
                  <Card
                    key={tool.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/50 dark:bg-blue-950/20' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${CATEGORY_COLORS[tool.category]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight">{tool.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {tool.description}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`mt-2 text-xs ${CATEGORY_COLORS[tool.category]}`}
                          >
                            {tool.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Input Area */}
            {selectedToolDef && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <selectedToolDef.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{selectedToolDef.name}</span>
                </div>
                
                <Textarea
                  placeholder={selectedToolDef.placeholder}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={e2bTools.isExecuting}
                />
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {userInput.length}/{selectedToolDef.minLength} characters minimum
                  </div>
                  <div className="flex gap-2">
                    {e2bTools.isExecuting ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="h-8"
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        onClick={handleExecute}
                        disabled={!canExecute}
                        size="sm"
                        className="h-8"
                      >
                        {e2bTools.isExecuting ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 mr-1" />
                        )}
                        Execute Tool
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {e2bTools.lastResult ? (
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Execution Result</h4>
                    <Badge variant="secondary">{e2bTools.lastResult.toolType}</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Generated Files</h5>
                      {e2bTools.lastResult.executionResult.files.map((file: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-mono text-sm">{file.path}</span>
                          </div>
                          <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                            {file.content.substring(0, 500)}
                            {file.content.length > 500 && '...'}
                          </pre>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">Performance Metrics</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Execution Time:</span>
                          <span className="ml-2 font-mono">{e2bTools.lastResult.performance.executionTime}ms</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sandbox ID:</span>
                          <span className="ml-2 font-mono text-xs">{e2bTools.lastResult.executionResult.sandboxId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <Code2 className="w-12 h-12 mx-auto opacity-50" />
                  <p>No execution results yet</p>
                  <p className="text-xs">Execute a tool to see results here</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}