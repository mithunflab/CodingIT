'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Plus, Github, Mail, Calendar, Folder } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  connected: boolean
  status: 'connected' | 'disconnected' | 'error'
}

export default function IntegrationsSettings() {
  const [artifactsEnabled, setArtifactsEnabled] = useState(true)
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'github',
      name: 'GitHub',
      description: 'Connect your GitHub repositories for seamless code management',
      icon: <Github className="h-5 w-5" />,
      connected: true,
      status: 'connected'
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Access and sync files from your Google Drive',
      icon: <Folder className="h-5 w-5" />,
      connected: false,
      status: 'disconnected'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Send and receive emails directly from the platform',
      icon: <Mail className="h-5 w-5" />,
      connected: false,
      status: 'disconnected'
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync your calendar events and schedule meetings',
      icon: <Calendar className="h-5 w-5" />,
      connected: true,
      status: 'connected'
    }
  ])

  const handleConnect = (integrationId: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, connected: !integration.connected, status: integration.connected ? 'disconnected' : 'connected' }
          : integration
      )
    )
  }

  const getStatusButton = (integration: Integration) => {
    if (integration.connected) {
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleConnect(integration.id)}
        >
          Disconnect
        </Button>
      )
    }
    return (
      <Button 
        size="sm"
        onClick={() => handleConnect(integration.id)}
      >
        Connect
      </Button>
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
          <CardTitle>Capabilities</CardTitle>
          <CardDescription>
            Enable or disable platform features and capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Artifacts</h4>
              <p className="text-sm text-muted-foreground">
                Enable artifact generation and preview functionality
              </p>
            </div>
            <Switch
              checked={artifactsEnabled}
              onCheckedChange={setArtifactsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Services</CardTitle>
          <CardDescription>
            Manage your connected integrations and authorize new services to enhance your development workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-2">
                  {integration.icon}
                </div>
                <div>
                  <h4 className="font-medium">{integration.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integration.connected && (
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    Connected
                  </div>
                )}
                {getStatusButton(integration)}
              </div>
            </div>
          ))}
          
          <Separator />
          
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add integration
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}