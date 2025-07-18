'use client'

import React, { useState, useEffect } from 'react'
import { ProfileMetrics, ExecutionStep, PerformanceBottleneck, NetworkRequest } from '@/lib/debugging/execution-profiler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Clock, 
  Cpu, 
  HardDrive, 
  Network, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Timer,
  Database,
  Globe,
  Info,
  Lightbulb,
  Settings,
  Download,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface PerformanceProfilerProps {
  metrics: ProfileMetrics
  onClose: () => void
  onExport: () => void
  onOptimize: () => void
  isLive?: boolean
}

const formatTime = (ms: number): string => {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
}

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-green-500'
    case 'B': return 'bg-blue-500'
    case 'C': return 'bg-yellow-500'
    case 'D': return 'bg-orange-500'
    case 'F': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getStepIcon = (type: ExecutionStep['type']) => {
  switch (type) {
    case 'initialization': return <Settings className="w-4 h-4 text-blue-500" />
    case 'execution': return <Play className="w-4 h-4 text-green-500" />
    case 'cleanup': return <RotateCcw className="w-4 h-4 text-gray-500" />
    case 'network': return <Network className="w-4 h-4 text-purple-500" />
    case 'computation': return <Cpu className="w-4 h-4 text-orange-500" />
    default: return <Activity className="w-4 h-4 text-gray-500" />
  }
}

const getStepStatusIcon = (status: ExecutionStep['status']) => {
  switch (status) {
    case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'error': return <XCircle className="w-4 h-4 text-red-500" />
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    default: return <Info className="w-4 h-4 text-gray-500" />
  }
}

export function PerformanceProfiler({ 
  metrics, 
  onClose, 
  onExport, 
  onOptimize, 
  isLive = false 
}: PerformanceProfilerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [collapsedSteps, setCollapsedSteps] = useState<Set<string>>(new Set())

  const toggleStepCollapse = (stepId: string) => {
    const newCollapsed = new Set(collapsedSteps)
    if (newCollapsed.has(stepId)) {
      newCollapsed.delete(stepId)
    } else {
      newCollapsed.add(stepId)
    }
    setCollapsedSteps(newCollapsed)
  }

  const totalNetworkTime = metrics.networkRequests.reduce((sum, req) => sum + req.duration, 0)
  const totalExecutionTime = metrics.executionTime
  const networkPercentage = (totalNetworkTime / totalExecutionTime) * 100

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Performance Profiler</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Timer className="w-4 h-4" />
                <span>Execution time: {formatTime(metrics.executionTime)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${getGradeColor(metrics.performance.grade)}`} />
                  <span>Grade: {metrics.performance.grade}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onOptimize}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Optimize
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
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

        {/* Performance Score */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${getGradeColor(metrics.performance.grade)}`}>
                  {metrics.performance.grade}
                </div>
                <div>
                  <p className="font-semibold">Performance Score</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(metrics.performance.score)}/100
                  </p>
                </div>
              </div>
              
              <div className="flex-1 mx-8">
                <Progress value={metrics.performance.score} className="h-2" />
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold">{formatTime(metrics.executionTime)}</p>
                  <p className="text-gray-600 dark:text-gray-400">Execution Time</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{formatBytes(metrics.memoryUsage.peak)}</p>
                  <p className="text-gray-600 dark:text-gray-400">Peak Memory</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{metrics.networkRequests.length}</p>
                  <p className="text-gray-600 dark:text-gray-400">Network Requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="memory">Memory</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Execution Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      Execution Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Time</span>
                      <span className="font-semibold">{formatTime(metrics.executionTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Timeline Steps</span>
                      <span className="font-semibold">{metrics.timeline.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Average Step</span>
                      <span className="font-semibold">
                        {formatTime(metrics.timeline.reduce((sum, step) => sum + step.duration, 0) / metrics.timeline.length)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Memory Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-purple-500" />
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Peak Usage</span>
                      <span className="font-semibold">{formatBytes(metrics.memoryUsage.peak)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Average Usage</span>
                      <span className="font-semibold">{formatBytes(metrics.memoryUsage.average)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Memory Growth</span>
                      <span className="font-semibold">
                        {formatBytes(metrics.memoryUsage.final - metrics.memoryUsage.initial)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Network Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-green-500" />
                      Network Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Requests</span>
                      <span className="font-semibold">{metrics.networkRequests.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Time</span>
                      <span className="font-semibold">{formatTime(totalNetworkTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">% of Execution</span>
                      <span className="font-semibold">{networkPercentage.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Code Complexity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                      Code Complexity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cyclomatic</span>
                      <span className="font-semibold">{metrics.codeComplexity.cyclomatic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cognitive</span>
                      <span className="font-semibold">{metrics.codeComplexity.cognitive}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Lines of Code</span>
                      <span className="font-semibold">{metrics.codeComplexity.linesOfCode}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Resource Utilization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-red-500" />
                      Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Heap Memory</span>
                      <span className="font-semibold">{formatBytes(metrics.resourceUtilization.memory.heap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Network I/O</span>
                      <span className="font-semibold">{formatBytes(metrics.resourceUtilization.network.bytesReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Functions</span>
                      <span className="font-semibold">{metrics.codeComplexity.functionsCount}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Grade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Performance Grade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${getGradeColor(metrics.performance.grade)}`}>
                        {metrics.performance.grade}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{Math.round(metrics.performance.score)}/100</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Performance Score</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {metrics.timeline.map((step, index) => (
                    <Card 
                      key={step.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedStep?.id === step.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedStep(step)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getStepIcon(step.type)}
                              {getStepStatusIcon(step.status)}
                            </div>
                            <div>
                              <p className="font-semibold">{step.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {step.type} • {formatTime(step.duration)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatTime(step.duration)}</p>
                              <p className="text-xs text-gray-500">
                                {((step.duration / metrics.executionTime) * 100).toFixed(1)}% of total
                              </p>
                            </div>
                            
                            <div className="w-32">
                              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(step.duration / metrics.executionTime) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {step.memorySnapshot && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                            <HardDrive className="w-3 h-3" />
                            <span>Memory: {formatBytes(step.memorySnapshot.used)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bottlenecks" className="flex-1 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {metrics.performance.bottlenecks.length > 0 ? (
                    metrics.performance.bottlenecks.map((bottleneck, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                              {bottleneck.description}
                            </CardTitle>
                            <Badge className={getSeverityColor(bottleneck.severity)}>
                              {bottleneck.severity}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Impact</span>
                              <span className="font-semibold">{bottleneck.impact.toFixed(1)}%</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                              <span className="font-semibold">{formatTime(bottleneck.duration)}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                              <span className="font-semibold">
                                Line {bottleneck.location.line}:{bottleneck.location.column}
                              </span>
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
                                <div>
                                  <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                                    Suggestion
                                  </p>
                                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                                    {bottleneck.suggestion}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Bottlenecks Found</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Your code is running efficiently without major performance issues.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="network" className="flex-1 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {metrics.networkRequests.length > 0 ? (
                    metrics.networkRequests.map((request, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Network className="w-4 h-4 text-blue-500" />
                                <Badge variant="outline" className="text-xs">
                                  {request.method}
                                </Badge>
                                <Badge 
                                  className={`text-xs ${
                                    request.status < 300 ? 'bg-green-100 text-green-800' : 
                                    request.status < 400 ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {request.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="font-medium text-sm truncate max-w-md">
                                  {request.url}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatTime(request.duration)} • {formatBytes(request.size)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium">{formatTime(request.duration)}</p>
                                <p className="text-xs text-gray-500">
                                  {((request.duration / totalNetworkTime) * 100).toFixed(1)}% of network
                                </p>
                              </div>
                              
                              <div className="w-24">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(request.duration / totalNetworkTime) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Network Requests</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          No network activity was detected during execution.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="memory" className="flex-1 p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-purple-500" />
                      Memory Usage Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {formatBytes(metrics.memoryUsage.peak)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Peak Usage</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatBytes(metrics.memoryUsage.average)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Average Usage</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {formatBytes(metrics.memoryUsage.initial)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Initial Usage</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {formatBytes(metrics.memoryUsage.final)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Final Usage</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Memory Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {metrics.memoryUsage.final > metrics.memoryUsage.initial ? (
                          <TrendingUp className="w-5 h-5 text-red-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-green-500" />
                        )}
                        <span className="font-medium">
                          {formatBytes(Math.abs(metrics.memoryUsage.final - metrics.memoryUsage.initial))}
                        </span>
                      </div>
                      <Badge 
                        className={
                          metrics.memoryUsage.final > metrics.memoryUsage.initial 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {metrics.memoryUsage.final > metrics.memoryUsage.initial ? 'Increased' : 'Decreased'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="flex-1 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        Performance Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {metrics.performance.bottlenecks.map((bottleneck, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{bottleneck.description}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {bottleneck.suggestion}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {metrics.performance.bottlenecks.length === 0 && (
                          <div className="text-center py-4">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              No specific recommendations available. Your code is performing well!
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}