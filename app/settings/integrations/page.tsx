'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Github, 
  Mail, 
  Calendar, 
  FolderOpen, 
  Plus, 
  Unlink,
  Loader2,
  ExternalLink,
  Activity,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { 
  getUserIntegrations, 
  upsertUserIntegration, 
  disconnectUserIntegration,
  UserIntegration
} from '@/lib/user-settings'
import { 
  generateGitHubOAuthUrl, 
  getGitHubScopes, 
  revokeGitHubToken,
  isGitHubIntegrationHealthy,
  formatGitHubWebhookEvent,
  getGitHubEventIcon,
  type GitHubOAuthConfig 
} from '@/lib/github-oauth'

const availableIntegrations = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access your repositories and collaborate on code',
    icon: Github,
    color: 'bg-gray-900 text-white'
  },
  {
    id: 'google-drive',
    name: 'Google Drive', 
    description: 'Import and export files from your Drive',
    icon: FolderOpen,
    color: 'bg-blue-600 text-white'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send emails and access your inbox',
    icon: Mail,
    color: 'bg-red-600 text-white'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Schedule meetings and manage your calendar',
    icon: Calendar,
    color: 'bg-green-600 text-white'
  }
]

export default function IntegrationsSettings() {
  const { session } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  
  const [integrations, setIntegrations] = useState<UserIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadIntegrations = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      console.log('Loading integrations for user:', session.user.id)
      const userIntegrations = await getUserIntegrations(session.user.id)
      console.log('Loaded integrations:', userIntegrations)
      setIntegrations(userIntegrations)
    } catch (error) {
      console.error('Error loading integrations:', error)
      toast({
        title: "Error",
        description: "Failed to load integrations. Please try again.",
        variant: "destructive",
      })
    }
  }, [session?.user?.id, toast])

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    const initializeIntegrations = async () => {
      setIsLoading(true)
      await loadIntegrations()
      setIsLoading(false)
    }

    initializeIntegrations()
  }, [session?.user?.id, loadIntegrations])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'github_connected') {
      toast({
        title: "Success",
        description: "GitHub connected successfully!",
      })
      window.history.replaceState({}, '', window.location.pathname)
      // Force reload integrations after successful OAuth
      loadIntegrations()
    }

    if (error) {
      toast({
        title: "Error", 
        description: decodeURIComponent(error),
        variant: "destructive",
      })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [loadIntegrations, toast])

  const getIntegrationStatus = useCallback((serviceId: string) => {
    const integration = integrations.find(integration => integration.service_name === serviceId)
    console.log(`Integration status for ${serviceId}:`, integration)
    return integration
  }, [integrations])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadIntegrations()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Integration status updated.",
    })
  }

  const handleConnect = async (serviceId: string) => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "Please log in to connect integrations.",
        variant: "destructive",
      })
      return
    }

    setConnecting(serviceId)
    
    try {
      if (serviceId === 'github') {
        if (!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID) {
          throw new Error('GitHub OAuth not configured. Please check environment variables.')
        }

        const config: GitHubOAuthConfig = {
          clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          redirectUri: `${window.location.origin}/api/auth/github`,
          scopes: getGitHubScopes(),
        }

        console.log('Initiating GitHub OAuth with config:', config)
        const authUrl = generateGitHubOAuthUrl(config)
        window.location.href = authUrl
        return
      }

      // For other services (simulated for now)
      console.log(`Connecting ${serviceId} for user:`, session.user.id)
      
      const success = await upsertUserIntegration(session.user.id, serviceId, {
        is_connected: true,
        connection_data: {
          connected_at: new Date().toISOString(),
          simulated: true,
        }
      })

      if (success) {
        await loadIntegrations() // Reload from database
        
        toast({
          title: "Success",
          description: `${availableIntegrations.find(int => int.id === serviceId)?.name} connected successfully.`,
        })
      } else {
        throw new Error('Failed to save integration to database')
      }
    } catch (error) {
      console.error('Error connecting service:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (serviceId: string) => {
    if (!session?.user?.id) return

    setDisconnecting(serviceId)
    
    try {
      console.log(`Disconnecting ${serviceId} for user:`, session.user.id)

      if (serviceId === 'github') {
        const integration = getIntegrationStatus(serviceId)
        if (integration?.connection_data?.access_token) {
          console.log('Revoking GitHub token...')
          const revoked = await revokeGitHubToken(integration.connection_data.access_token)
          if (!revoked) {
            console.warn('Failed to revoke GitHub token, but continuing with disconnect')
          }
        }
      }

      const success = await disconnectUserIntegration(session.user.id, serviceId)

      if (success) {
        await loadIntegrations() // Reload from database
        
        toast({
          title: "Success",
          description: `${availableIntegrations.find(int => int.id === serviceId)?.name} disconnected successfully.`,
        })
      } else {
        throw new Error('Failed to disconnect service')
      }
    } catch (error) {
      console.error('Error disconnecting service:', error)
      toast({
        title: "Error",
        description: "Failed to disconnect service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDisconnecting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect external services to enhance your workflow.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  if (!session?.user?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Please log in to manage your integrations.
          </p>
        </div>
      </div>
    )
  }

  const githubIntegration = getIntegrationStatus('github')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect external services to enhance your workflow.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Services</CardTitle>
          <CardDescription>
            Manage your connected third-party services and applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableIntegrations.map((service) => {
              const Icon = service.icon
              const integration = getIntegrationStatus(service.id)
              const isConnected = Boolean(integration?.is_connected)
              const isConnecting = connecting === service.id
              const isDisconnecting = disconnecting === service.id
              const isProcessing = isConnecting || isDisconnecting
              const isHealthy = service.id === 'github' && integration ? isGitHubIntegrationHealthy(integration) : isConnected
              
              console.log(`Service ${service.id}: connected=${isConnected}, integration=`, integration)
              
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${service.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{service.name}</h4>
                        {isConnected ? (
                          <Badge variant={isHealthy ? "default" : "secondary"}>
                            {isHealthy ? "Connected" : "Needs Attention"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not connected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                      {isConnected && integration?.connection_data?.connected_at && (
                        <p className="text-xs text-muted-foreground">
                          Connected {new Date(integration.connection_data.connected_at).toLocaleDateString()}
                        </p>
                      )}
                      {service.id === 'github' && isConnected && integration?.connection_data?.username && (
                        <p className="text-xs text-muted-foreground">
                          GitHub: @{integration.connection_data.username}
                        </p>
                      )}
                      {integration?.connection_data?.simulated && (
                        <p className="text-xs text-yellow-600">
                          Simulated connection
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(service.id)}
                        disabled={isProcessing}
                      >
                        {isDisconnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlink className="h-4 w-4 mr-2" />
                        )}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConnect(service.id)}
                        disabled={isProcessing}
                      >
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {githubIntegration?.is_connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              GitHub Integration Status
            </CardTitle>
            <CardDescription>
              Monitor your GitHub integration health and recent activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status</span>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isGitHubIntegrationHealthy(githubIntegration) ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-sm text-muted-foreground">
                    {isGitHubIntegrationHealthy(githubIntegration) ? 'Healthy' : 'Needs Attention'}
                  </span>
                </div>
              </div>

              {githubIntegration.connection_data?.github_user_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">GitHub User ID</span>
                  <span className="text-sm text-muted-foreground">
                    {githubIntegration.connection_data.github_user_id}
                  </span>
                </div>
              )}

              {githubIntegration.last_sync_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last Sync
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(githubIntegration.last_sync_at).toLocaleString()}
                  </span>
                </div>
              )}
              
              {githubIntegration.connection_data?.last_webhook_event && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Recent Activity</span>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {getGitHubEventIcon(githubIntegration.connection_data.last_webhook_event.type)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">
                          {formatGitHubWebhookEvent(githubIntegration.connection_data.last_webhook_event)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(githubIntegration.connection_data.last_webhook_event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Platform Capabilities</CardTitle>
          <CardDescription>
            Core features and capabilities enabled in your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Artifacts</h4>
                <p className="text-sm text-muted-foreground">
                  Enable creation and execution of code artifacts in the sandbox environment
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Fragment Templates</h4>
                <p className="text-sm text-muted-foreground">
                  Access to pre-built templates for common development patterns
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">E2B Sandbox</h4>
                <p className="text-sm text-muted-foreground">
                  Cloud-based development environment for running and testing code
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>
            Manage API keys and access tokens for external integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Personal Access Token</h4>
              <p className="text-sm text-muted-foreground">
                Generate tokens for API access and automation
              </p>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Tokens
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}