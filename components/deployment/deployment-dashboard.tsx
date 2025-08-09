'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FragmentSchema } from '@/lib/schema'
import { DeploymentConfig, DeploymentResult, DeploymentStatus, deploymentProviders } from '@/lib/deployment/deployment-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeploymentForm } from './deployment-form'
import { DeploymentMonitoring } from './deployment-monitoring'
import { 
  Rocket, 
  Globe, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  RefreshCw,
  Pause} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { DeploymentHistory } from './deployment-history'

interface DeploymentDashboardProps {
  fragment: FragmentSchema
  onClose: () => void
}

export function DeploymentDashboard({ fragment, onClose }: DeploymentDashboardProps) {
  const [activeTab, setActiveTab] = useState('deploy')
  const [, setDeploymentConfig] = useState<DeploymentConfig | null>(null)
  const [currentDeployment, setCurrentDeployment] = useState<DeploymentStatus | null>(null)
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentResult[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [, setActiveDeployments] = useState<DeploymentStatus[]>([])

  const loadDeploymentHistory = useCallback(async () => {
    try {
      // In a real implementation, this would fetch from API
      const history = JSON.parse(localStorage.getItem(`deployment_history_${fragment.title}`) || '[]')
      setDeploymentHistory(history)
    } catch (error) {
      console.error('Failed to load deployment history:', error)
    }
  }, [fragment.title])

  const loadActiveDeployments = useCallback(async () => {
    try {
      // In a real implementation, this would fetch from API
      const active = JSON.parse(localStorage.getItem(`active_deployments_${fragment.title}`) || '[]')
      setActiveDeployments(active)
    } catch (error) {
      console.error('Failed to load active deployments:', error)
    }
  }, [fragment.title])

  useEffect(() => {
    loadDeploymentHistory()
    loadActiveDeployments()
  }, [loadDeploymentHistory, loadActiveDeployments])

  const handleDeploy = async (fragmentArg: FragmentSchema, config: DeploymentConfig) => {
    setIsDeploying(true)
    setDeploymentConfig(config)
    
    try {
      // Import deployment engine
      const { deploymentEngine } = await import('@/lib/deployment/deployment-engine')
      
      // Start deployment
      const result = await deploymentEngine.deployFragment(fragmentArg, config)
      
      // Update history
      const newHistory = [result, ...deploymentHistory].slice(0, 10)
      setDeploymentHistory(newHistory)
      localStorage.setItem(`deployment_history_${fragmentArg.title}`, JSON.stringify(newHistory))
      
      if (result.success) {
        toast({
          title: "Deployment Successful",
          description: `Your app has been deployed to ${config.provider.name}`,
        })
        
        // Switch to monitoring tab
        setActiveTab('monitoring')
      } else {
        toast({
          title: "Deployment Failed",
          description: result.error || "An error occurred during deployment",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Deployment Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const handleCancel = async () => {
    if (currentDeployment) {
      try {
        const { deploymentEngine } = await import('@/lib/deployment/deployment-engine')
        await deploymentEngine.cancelDeployment(currentDeployment.deploymentId)
        setCurrentDeployment(null)
        toast({
          title: "Deployment Cancelled",
          description: "The deployment has been cancelled successfully",
        })
      } catch (error) {
        toast({
          title: "Cancellation Failed",
          description: error instanceof Error ? error.message : "Failed to cancel deployment",
          variant: "destructive"
        })
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'running':
      case 'building':
      case 'deploying':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      case 'cancelled':
        return <Pause className="w-5 h-5 text-gray-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'running':
      case 'building':
      case 'deploying':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to Clipboard",
      description: "URL has been copied to your clipboard",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Deploy {fragment.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Template: {fragment.template}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {deploymentHistory.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Globe className="w-3 h-3" />
                {deploymentHistory.filter(d => d.success).length} deployments
              </Badge>
            )}
            
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

        {/* Current Deployment Status */}
        {currentDeployment && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(currentDeployment.status)}
                <div>
                  <p className="font-medium">{currentDeployment.currentStep}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentDeployment.status === 'building' && `Build time: ${currentDeployment.buildTime}ms`}
                    {currentDeployment.status === 'deploying' && 'Deploying to provider...'}
                    {currentDeployment.status === 'success' && currentDeployment.url && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <a 
                          href={currentDeployment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {currentDeployment.url}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(currentDeployment.url!)}
                          className="p-1 h-auto"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(currentDeployment.status)}>
                  {currentDeployment.status}
                </Badge>
                
                {currentDeployment.status === 'building' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="gap-1"
                  >
                    <Pause className="w-3 h-3" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            
            {currentDeployment.status !== 'success' && (
              <div className="mt-3">
                <Progress value={currentDeployment.progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {currentDeployment.progress}% complete
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="deploy">Deploy</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="deploy" className="flex-1 p-6">
              <DeploymentForm
                fragment={fragment}
                providers={deploymentProviders}
                onDeploy={handleDeploy}
                isDeploying={isDeploying}
              />
            </TabsContent>

            <TabsContent value="history" className="flex-1 p-6">
              <DeploymentHistory
                deployments={deploymentHistory}
                onRedeploy={(deployment: DeploymentResult) => {
                  // Extract config from deployment metadata
                  const config = deployment.metadata as any
                  if (config) {
                    setActiveTab('deploy')
                    // Set form with previous config
                  }
                }}
                onRollback={async (deployment: DeploymentResult) => {
                  try {
                    const { deploymentEngine } = await import('@/lib/deployment/deployment-engine')
                    await deploymentEngine.rollbackDeployment(deployment.deploymentId)
                    toast({
                      title: "Rollback Initiated",
                      description: "Rolling back to previous deployment",
                    })
                  } catch (error) {
                    toast({
                      title: "Rollback Failed",
                      description: error instanceof Error ? error.message : "Failed to rollback",
                      variant: "destructive"
                    })
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="monitoring" className="flex-1 p-6">
              <DeploymentMonitoring
                deployments={deploymentHistory.filter(d => d.success)}
                onRefresh={loadDeploymentHistory}
              />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deployment Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Auto-deploy</label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Automatically deploy when fragment is updated
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Enable auto-deploy</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Build notifications</label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Get notified about deployment status
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Email notifications</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Preview deployments</label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Create preview URLs for testing
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Enable previews</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Environment Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Manage environment variables for your deployments
                    </p>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Variables
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
