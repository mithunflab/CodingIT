'use client'

import React, { useState, useEffect } from 'react'
import { DeploymentResult } from '@/lib/deployment/deployment-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity,
  Globe,
  Server,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Monitor,
  Users,
  Database,
  Wifi,
  WifiOff,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface DeploymentMonitoringProps {
  deployments: DeploymentResult[]
  onRefresh?: () => void
}

interface MetricData {
  timestamp: string
  value: number
  label: string
}

interface DeploymentMetrics {
  deploymentId: string
  status: 'online' | 'offline' | 'degraded'
  uptime: number
  responseTime: number
  requests: number
  errors: number
  bandwidth: number
  cpu: number
  memory: number
  lastCheck: string
  healthChecks: {
    endpoint: string
    status: 'healthy' | 'unhealthy' | 'timeout'
    responseTime: number
    lastCheck: string
  }[]
  alerts: {
    id: string
    level: 'info' | 'warning' | 'error' | 'critical'
    message: string
    timestamp: string
  }[]
}

export function DeploymentMonitoring({ deployments, onRefresh }: DeploymentMonitoringProps) {
  const [selectedDeployment, setSelectedDeployment] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('24h')
  const [metrics, setMetrics] = useState<Record<string, DeploymentMetrics>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Generate mock metrics for active deployments
  const generateMockMetrics = (deployment: DeploymentResult): DeploymentMetrics => {
    const baseMetrics = {
      deploymentId: deployment.deploymentId,
      status: 'online' as const,
      uptime: 99.9,
      responseTime: Math.random() * 200 + 100,
      requests: Math.floor(Math.random() * 10000) + 1000,
      errors: Math.floor(Math.random() * 50),
      bandwidth: Math.random() * 1000 + 500,
      cpu: Math.random() * 80 + 10,
      memory: Math.random() * 70 + 20,
      lastCheck: new Date().toISOString(),
      healthChecks: [
        {
          endpoint: deployment.url || 'https://example.com/health',
          status: 'healthy' as const,
          responseTime: Math.random() * 50 + 20,
          lastCheck: new Date().toISOString()
        }
      ],
      alerts: [] as any[]
    }

    // Add some alerts based on metrics
    if (baseMetrics.responseTime > 250) {
      baseMetrics.alerts.push({
        id: `alert_${Date.now()}`,
        level: 'warning' as const,
        message: 'High response time detected',
        timestamp: new Date().toISOString()
      })
    }

    if (baseMetrics.cpu > 80) {
      baseMetrics.alerts.push({
        id: `alert_${Date.now()}_cpu`,
        level: 'warning' as const,
        message: 'High CPU usage detected',
        timestamp: new Date().toISOString()
      })
    }

    if (baseMetrics.errors > 30) {
      baseMetrics.alerts.push({
        id: `alert_${Date.now()}_errors`,
        level: 'error' as const,
        message: 'High error rate detected',
        timestamp: new Date().toISOString()
      })
    }

    return baseMetrics
  }

  // Load metrics for all deployments
  useEffect(() => {
    const loadMetrics = () => {
      setIsLoading(true)
      const newMetrics: Record<string, DeploymentMetrics> = {}
      
      deployments.forEach(deployment => {
        newMetrics[deployment.deploymentId] = generateMockMetrics(deployment)
      })
      
      setMetrics(newMetrics)
      setIsLoading(false)
    }

    loadMetrics()
  }, [deployments])

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      const newMetrics: Record<string, DeploymentMetrics> = {}
      
      deployments.forEach(deployment => {
        newMetrics[deployment.deploymentId] = generateMockMetrics(deployment)
      })
      
      setMetrics(newMetrics)
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [deployments, autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'error':
        return 'border-red-400 bg-red-50 dark:bg-red-900/20'
      case 'warning':
        return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'info':
        return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`
  }

  const formatResponseTime = (responseTime: number) => {
    return `${Math.round(responseTime)}ms`
  }

  const formatBandwidth = (bandwidth: number) => {
    if (bandwidth < 1000) return `${Math.round(bandwidth)}MB`
    return `${(bandwidth / 1000).toFixed(1)}GB`
  }

  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString()
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
    return `${(num / 1000000).toFixed(1)}M`
  }

  const handleRefresh = () => {
    const newMetrics: Record<string, DeploymentMetrics> = {}
    
    deployments.forEach(deployment => {
      newMetrics[deployment.deploymentId] = generateMockMetrics(deployment)
    })
    
    setMetrics(newMetrics)
    
    if (onRefresh) {
      onRefresh()
    }
    
    toast({
      title: "Metrics Refreshed",
      description: "Deployment metrics have been updated",
    })
  }

  const filteredDeployments = selectedDeployment === 'all' 
    ? deployments 
    : deployments.filter(d => d.deploymentId === selectedDeployment)

  const overallMetrics = Object.values(metrics).reduce((acc, metric) => {
    acc.totalRequests += metric.requests
    acc.totalErrors += metric.errors
    acc.avgResponseTime += metric.responseTime
    acc.avgUptime += metric.uptime
    acc.onlineCount += metric.status === 'online' ? 1 : 0
    return acc
  }, {
    totalRequests: 0,
    totalErrors: 0,
    avgResponseTime: 0,
    avgUptime: 0,
    onlineCount: 0
  })

  if (Object.keys(metrics).length > 0) {
    overallMetrics.avgResponseTime /= Object.keys(metrics).length
    overallMetrics.avgUptime /= Object.keys(metrics).length
  }

  const errorRate = overallMetrics.totalRequests > 0 
    ? (overallMetrics.totalErrors / overallMetrics.totalRequests) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            Deployment Monitoring
          </h2>
          <p className="text-muted-foreground">
            Real-time metrics and health monitoring for your deployments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deployments</SelectItem>
                {deployments.map(deployment => (
                  <SelectItem key={deployment.deploymentId} value={deployment.deploymentId}>
                    {deployment.deploymentId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Deployments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallMetrics.onlineCount}/{deployments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {deployments.length > 0 ? Math.round((overallMetrics.onlineCount / deployments.length) * 100) : 0}% availability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatResponseTime(overallMetrics.avgResponseTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              12% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(overallMetrics.totalRequests)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              23% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 inline mr-1" />
              2% from last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredDeployments.map(deployment => {
              const metric = metrics[deployment.deploymentId]
              if (!metric) return null

              return (
                <Card key={deployment.deploymentId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(metric.status)}
                        <div>
                          <CardTitle className="text-lg">{deployment.deploymentId}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {deployment.provider}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                        {deployment.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(deployment.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uptime</span>
                          <span className="font-medium">{formatUptime(metric.uptime)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Response Time</span>
                          <span className="font-medium">{formatResponseTime(metric.responseTime)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Requests</span>
                          <span className="font-medium">{formatNumber(metric.requests)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Errors</span>
                          <span className="font-medium text-red-600">{metric.errors}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span className="font-medium">{Math.round(metric.cpu)}%</span>
                        </div>
                        <Progress value={metric.cpu} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span>Memory Usage</span>
                          <span className="font-medium">{Math.round(metric.memory)}%</span>
                        </div>
                        <Progress value={metric.memory} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <LineChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Performance Charts</p>
                <p>Interactive performance charts would be displayed here</p>
                <p className="text-sm mt-2">
                  Integration with charting libraries like Chart.js or Recharts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Health Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDeployments.map(deployment => {
                  const metric = metrics[deployment.deploymentId]
                  if (!metric) return null

                  return (
                    <div key={deployment.deploymentId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Server className="w-4 h-4" />
                          <span className="font-medium">{deployment.deploymentId}</span>
                        </div>
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {metric.healthChecks.map((check, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                            <div className="flex items-center gap-2">
                              {check.status === 'healthy' && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {check.status === 'unhealthy' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                              {check.status === 'timeout' && <Clock className="w-4 h-4 text-yellow-500" />}
                              <span className="text-sm">{check.endpoint}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatResponseTime(check.responseTime)}</span>
                              <span>•</span>
                              <span>{new Date(check.lastCheck).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.values(metrics).flatMap(metric => 
                  metric.alerts.map(alert => (
                    <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.level)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-sm text-muted-foreground">
                              {metric.deploymentId} • {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {alert.level}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
                
                {Object.values(metrics).every(metric => metric.alerts.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <p className="text-lg font-medium">No Active Alerts</p>
                    <p>All deployments are running smoothly</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
