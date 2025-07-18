'use client'

import React, { useState, useEffect } from 'react'
import { ErrorAnalysis, ErrorSuggestion, QuickFix, ErrorType, ErrorCategory } from '@/lib/debugging/error-analyzer'
import { RecoveryManager, RecoveryResult, RecoverySnapshot } from '@/lib/debugging/recovery-manager'
import { FragmentSchema } from '@/lib/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  CheckCircle, 
  Info,
  Lightbulb,
  Wrench,
  Code,
  Clock,
  User,
  ExternalLink,
  Copy,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Zap,
  Shield,
  Network,
  HardDrive,
  Cpu,
  Database,
  Settings,
  FileText,
  GitBranch,
  History,
  BookOpen
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from '@/components/ui/use-toast'

interface ErrorInspectorProps {
  error: ErrorAnalysis
  fragment: FragmentSchema
  onClose: () => void
  onApplyFix: (fix: QuickFix) => void
  onApplySuggestion: (suggestion: ErrorSuggestion) => void
  onStartRecovery: () => void
}

const getErrorIcon = (type: ErrorType, severity: string) => {
  const sizeClass = 'w-5 h-5'
  
  switch (severity) {
    case 'critical':
      return <XCircle className={`${sizeClass} text-red-500`} />
    case 'high':
      return <AlertTriangle className={`${sizeClass} text-orange-500`} />
    case 'medium':
      return <AlertCircle className={`${sizeClass} text-yellow-500`} />
    case 'low':
      return <Info className={`${sizeClass} text-blue-500`} />
    default:
      return <AlertCircle className={`${sizeClass} text-gray-500`} />
  }
}

const getCategoryIcon = (category: ErrorCategory) => {
  const sizeClass = 'w-4 h-4'
  
  switch (category) {
    case ErrorCategory.CODE:
      return <Code className={`${sizeClass} text-blue-500`} />
    case ErrorCategory.SECURITY:
      return <Shield className={`${sizeClass} text-red-500`} />
    case ErrorCategory.PERFORMANCE:
      return <Zap className={`${sizeClass} text-yellow-500`} />
    case ErrorCategory.NETWORK:
      return <Network className={`${sizeClass} text-green-500`} />
    case ErrorCategory.SYSTEM:
      return <HardDrive className={`${sizeClass} text-purple-500`} />
    case ErrorCategory.DEPENDENCY:
      return <Database className={`${sizeClass} text-orange-500`} />
    case ErrorCategory.CONFIGURATION:
      return <Settings className={`${sizeClass} text-gray-500`} />
    case ErrorCategory.ENVIRONMENT:
      return <Cpu className={`${sizeClass} text-indigo-500`} />
    default:
      return <FileText className={`${sizeClass} text-gray-500`} />
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export function ErrorInspector({ 
  error, 
  fragment, 
  onClose, 
  onApplyFix, 
  onApplySuggestion, 
  onStartRecovery 
}: ErrorInspectorProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['suggestions']))
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text)
    toast({
      title: "Copied to Clipboard",
      description: `${type} has been copied to your clipboard`,
    })
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleQuickFix = async (fix: QuickFix) => {
    try {
      await onApplyFix(fix)
      toast({
        title: "Fix Applied",
        description: fix.description,
      })
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: error instanceof Error ? error.message : "Failed to apply fix",
        variant: "destructive"
      })
    }
  }

  const handleSuggestion = async (suggestion: ErrorSuggestion) => {
    try {
      await onApplySuggestion(suggestion)
      toast({
        title: "Suggestion Applied",
        description: suggestion.description,
      })
    } catch (error) {
      toast({
        title: "Suggestion Failed",
        description: error instanceof Error ? error.message : "Failed to apply suggestion",
        variant: "destructive"
      })
    }
  }

  const handleRecovery = async () => {
    setIsRecovering(true)
    try {
      onStartRecovery()
      // Recovery result would be provided by parent component
      toast({
        title: "Recovery Started",
        description: "Attempting to recover from error automatically",
      })
    } catch (error) {
      toast({
        title: "Recovery Failed",
        description: error instanceof Error ? error.message : "Failed to start recovery",
        variant: "destructive"
      })
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              {getErrorIcon(error.errorType, error.severity)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                {error.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {getCategoryIcon(error.category)}
                <span>{error.category}</span>
                <span>•</span>
                <Badge className={getSeverityColor(error.severity)} variant="outline">
                  {error.severity}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRecovery}
              disabled={isRecovering}
              className="gap-2"
            >
              {isRecovering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Recovering...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  Auto-Recover
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="code">Code Context</TabsTrigger>
                <TabsTrigger value="quickfixes">Quick Fixes</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="flex-1 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  {/* Error Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Error Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">{error.description}</p>
                      
                      {error.aiSuggestion && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                AI Insight
                              </h4>
                              <p className="text-blue-800 dark:text-blue-200 mt-1">
                                {error.aiSuggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stack Trace */}
                  {error.stackTrace && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Stack Trace
                              </div>
                              <ChevronRight className="w-4 h-4" />
                            </CardTitle>
                          </CardHeader>
                        </Card>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="bg-gray-900 rounded-lg p-4">
                              <pre className="text-green-400 text-sm overflow-x-auto">
                                {error.stackTrace.join('\n')}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Related Errors */}
                  {error.relatedErrors && error.relatedErrors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <GitBranch className="w-5 h-5" />
                          Related Errors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {error.relatedErrors.map((relatedId, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{relatedId}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="suggestions" className="flex-1 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {error.suggestions.map((suggestion, index) => (
                    <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            {suggestion.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(suggestion.difficulty)}>
                              {suggestion.difficulty}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Clock className="w-3 h-3" />
                              {suggestion.estimatedTime}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {suggestion.description}
                        </p>
                        
                        {suggestion.code && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Code Example:</label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(suggestion.code!, 'Code example')}
                                className="gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copy
                              </Button>
                            </div>
                            <div className="bg-gray-900 rounded-lg overflow-hidden">
                              <SyntaxHighlighter
                                language="python"
                                style={vscDarkPlus}
                                className="text-sm"
                              >
                                {suggestion.code}
                              </SyntaxHighlighter>
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <label className="text-sm font-medium mb-2 block">Steps:</label>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            {suggestion.steps.map((step, stepIndex) => (
                              <li key={stepIndex}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        
                        {suggestion.resources && suggestion.resources.length > 0 && (
                          <div className="mb-4">
                            <label className="text-sm font-medium mb-2 block">Resources:</label>
                            <div className="space-y-2">
                              {suggestion.resources.map((resource, resourceIndex) => (
                                <div key={resourceIndex} className="flex items-center gap-2">
                                  <ExternalLink className="w-4 h-4 text-blue-500" />
                                  <a 
                                    href={resource.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                  >
                                    {resource.title}
                                  </a>
                                  <Badge variant="outline" className="text-xs">
                                    {resource.type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleSuggestion(suggestion)}
                            className="gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Apply Suggestion
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="code" className="flex-1 p-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Code Context
                      <Badge variant="outline">
                        Line {error.codeContext.line}:{error.codeContext.column}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                      <SyntaxHighlighter
                        language="python"
                        style={vscDarkPlus}
                        showLineNumbers
                        startingLineNumber={Math.max(1, error.codeContext.line - 2)}
                        className="text-sm"
                      >
                        {error.codeContext.snippet}
                      </SyntaxHighlighter>
                    </div>
                  </CardContent>
                </Card>

                {error.codeContext.highlightedCode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Highlighted Issue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <SyntaxHighlighter
                          language="python"
                          style={vscDarkPlus}
                          showLineNumbers
                          className="text-sm"
                        >
                          {error.codeContext.highlightedCode}
                        </SyntaxHighlighter>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="quickfixes" className="flex-1 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {error.quickFixes && error.quickFixes.length > 0 ? (
                    error.quickFixes.map((fix, index) => (
                      <Card key={fix.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="w-5 h-5 text-green-500" />
                              {fix.title}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {Math.round(fix.confidence * 100)}% confidence
                              </Badge>
                              {fix.automatic && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Automatic
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {fix.description}
                          </p>
                          
                          <div className="mb-4">
                            <label className="text-sm font-medium mb-2 block">Action:</label>
                            <Badge variant="outline" className="capitalize">
                              {fix.action}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              at line {fix.target.line}, column {fix.target.column}
                            </span>
                          </div>
                          
                          {fix.replacement && (
                            <div className="mb-4">
                              <label className="text-sm font-medium mb-2 block">Replacement:</label>
                              <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-sm font-mono">
                                {fix.replacement}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleQuickFix(fix)}
                              className="gap-2"
                              variant={fix.automatic ? "default" : "outline"}
                            >
                              <Play className="w-4 h-4" />
                              Apply Fix
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Quick Fixes Available</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          This error requires manual intervention. Check the suggestions tab for guidance.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="resources" className="flex-1 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {error.documentation && error.documentation.length > 0 ? (
                    error.documentation.map((doc, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            {doc.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {doc.description}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => window.open(doc.url, '_blank')}
                            className="gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Documentation
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Documentation Links</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          No specific documentation available for this error.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}