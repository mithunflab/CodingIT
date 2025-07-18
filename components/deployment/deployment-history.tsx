'use client'

import React, { useState } from 'react'
import { DeploymentResult } from '@/lib/deployment/deployment-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  Globe,
  Server,
  Trash2,
  Copy,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface DeploymentHistoryProps {
  deployments: DeploymentResult[]
  onRedeploy?: (deployment: DeploymentResult) => void
  onRollback?: (deployment: DeploymentResult) => void
  onDelete?: (deploymentId: string) => void
  onRefresh?: () => void
}

export function DeploymentHistory({ 
  deployments, 
  onRedeploy, 
  onRollback, 
  onDelete,
  onRefresh 
}: DeploymentHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentResult | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)

  // Filter deployments based on search and filters
  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.deploymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deployment.url?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter
    const matchesProvider = providerFilter === 'all' || deployment.provider === providerFilter

    return matchesSearch && matchesStatus && matchesProvider
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'building':
      case 'deploying':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'building':
      case 'deploying':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, React.ReactNode> = {
      'vercel': <Server className="w-4 h-4" />,
      'netlify': <Globe className="w-4 h-4" />,
      'railway': <Server className="w-4 h-4" />,
      'render': <Server className="w-4 h-4" />,
      'aws-amplify': <Server className="w-4 h-4" />,
      'fly-io': <Server className="w-4 h-4" />
    }
    return icons[provider] || <Server className="w-4 h-4" />
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to Clipboard",
      description: "URL has been copied to your clipboard",
    })
  }

  const formatDeploymentTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const formatBuildTime = (buildTime: number) => {
    if (buildTime < 1000) return `${buildTime}ms`
    if (buildTime < 60000) return `${Math.round(buildTime / 1000)}s`
    return `${Math.round(buildTime / 60000)}m ${Math.round((buildTime % 60000) / 1000)}s`
  }

  const handleDelete = async (deploymentId: string) => {
    if (onDelete) {
      onDelete(deploymentId)
      setShowDeleteDialog(null)
      toast({
        title: "Deployment Deleted",
        description: `Deployment ${deploymentId} has been deleted`,
      })
    }
  }

  const exportDeploymentData = () => {
    const data = JSON.stringify(filteredDeployments, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deployment-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get unique providers for filter
  const uniqueProviders = Array.from(new Set(deployments.map(d => d.provider)))

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Deployment History</h2>
          <p className="text-muted-foreground">
            View and manage your deployment history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportDeploymentData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search deployments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="deploying">Deploying</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {uniqueProviders.map(provider => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Deployments ({filteredDeployments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredDeployments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {deployments.length === 0 ? (
                    <div>
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No deployments yet</p>
                      <p>Your deployment history will appear here</p>
                    </div>
                  ) : (
                    <div>
                      <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No deployments match your filters</p>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  )}
                </div>
              ) : (
                filteredDeployments.map((deployment) => (
                  <div
                    key={deployment.deploymentId}
                    className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(deployment.status)}
                          <div className="flex items-center gap-2">
                            {getProviderIcon(deployment.provider)}
                            <span className="font-medium">{deployment.deploymentId}</span>
                          </div>
                          <Badge className={getStatusColor(deployment.status)}>
                            {deployment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {deployment.deployedAt 
                                ? formatDeploymentTime(deployment.deployedAt)
                                : 'Recently deployed'
                              }
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatBuildTime(deployment.buildTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              {deployment.provider}
                            </div>
                          </div>
                          
                          {deployment.url && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <a 
                                href={deployment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {deployment.url}
                              </a>
                            </div>
                          )}
                          
                          {deployment.error && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              {deployment.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDeployment(deployment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {deployment.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(deployment.url!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {deployment.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(deployment.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {deployment.status === 'success' && onRedeploy && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRedeploy(deployment)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {deployment.status === 'success' && onRollback && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRollback(deployment)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {onDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Deployment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this deployment? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(deployment.deploymentId)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Deployment Details Modal */}
      {selectedDeployment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedDeployment.status)}
                <div>
                  <h3 className="text-xl font-semibold">{selectedDeployment.deploymentId}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedDeployment.provider} • {selectedDeployment.deployedAt 
                      ? formatDeploymentTime(selectedDeployment.deployedAt)
                      : 'Recently deployed'
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDeployment(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedDeployment.status)}>
                    {selectedDeployment.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label>Build Time</Label>
                  <p className="text-sm">{formatBuildTime(selectedDeployment.buildTime)}</p>
                </div>
                
                {selectedDeployment.url && (
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <div className="flex items-center gap-2">
                      <a 
                        href={selectedDeployment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        {selectedDeployment.url}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedDeployment.url!)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <p className="text-sm">{selectedDeployment.provider}</p>
                </div>
              </div>
              
              {selectedDeployment.error && (
                <div className="space-y-2">
                  <Label>Error</Label>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-sm text-red-700 dark:text-red-300">{selectedDeployment.error}</p>
                  </div>
                </div>
              )}
              
              {selectedDeployment.metadata && (
                <div className="space-y-2">
                  <Label>Metadata</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedDeployment.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
