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
  ExternalLink
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { 
  getUserIntegrations, 
  upsertUserIntegration, 
  disconnectUserIntegration,
  UserIntegration
} from '@/lib/user-settings'

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
  
  // State
  const [integrations, setIntegrations] = useState<UserIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Load user integrations on mount
  useEffect(() => {
    if (!session?.user?.id) return

    const loadIntegrations = async () => {
      setIsLoading(true)
      try {
        const userIntegrations = await getUserIntegrations(session.user.id)
        setIntegrations(userIntegrations)
      } catch (error) {
        console.error('Error loading integrations:', error)
        toast({
          title: "Error",
          description: "Failed to load integrations. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadIntegrations()
  }, [session?.user?.id, toast])

  const getIntegrationStatus = (serviceId: string) => {
    return integrations.find(integration => integration.service_name === serviceId)
  }

  const handleConnect = async (serviceId: string) => {
    if (!session?.user?.id) return

    setConnecting(serviceId)
    try {
      // In a real implementation, this would initiate OAuth flow
      // For now, we'll simulate a connection
      const success = await upsertUserIntegration(session.user.id, serviceId, {
        is_connected: true,
        connection_data: {
          connected_at: new Date().toISOString(),
          // Add other service-specific data here
        }
      })

      if (success) {
        // Update local state
        const updatedIntegrations = [...integrations]
        const existingIndex = updatedIntegrations.findIndex(int => int.service_name === serviceId)
        
        if (existingIndex >= 0) {
          updatedIntegrations[existingIndex] = {
            ...updatedIntegrations[existingIndex],
            is_connected: true,
            connection_data: {
              connected_at: new Date().toISOString(),
            }
          }
        } else {
          updatedIntegrations.push({
            id: `temp-${Date.now()}`,
            user_id: session.user.id,
            service_name: serviceId,
            is_connected: true,
            connection_data: {
              connected_at: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
        
        setIntegrations(updatedIntegrations)
        
        toast({
          title: "Success",
          description: `${availableIntegrations.find(int => int.id === serviceId)?.name} connected successfully.`,
        })
      } else {
        throw new Error('Failed to connect service')
      }
    } catch (error) {
      console.error('Error connecting service:', error)
      toast({
        title: "Error",
        description: "Failed to connect service. Please try again.",
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
      const success = await disconnectUserIntegration(session.user.id, serviceId)

      if (success) {
        setIntegrations(integrations.map(integration => 
          integration.service_name === serviceId 
            ? { ...integration, is_connected: false, connection_data: {} }
            : integration
        ))
        
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect external services to enhance your workflow.
        </p>
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
              const isConnected = integration?.is_connected || false
              const isConnecting = connecting === service.id
              const isDisconnecting = disconnecting === service.id
              const isProcessing = isConnecting || isDisconnecting
              
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
                          <Badge variant="default">Connected</Badge>
                        ) : (
                          <Badge variant="secondary">Not connected</Badge>
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
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4 mr-2" />
                        )}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(service.id)}
                        disabled={isProcessing}
                      >
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

      <Card>
        <CardHeader>
          <CardTitle>Platform Capabilities</CardTitle>
          <CardDescription>
            Configure which platform features are enabled for your projects.
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