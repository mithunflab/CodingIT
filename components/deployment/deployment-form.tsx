'use client'

import * as React from 'react'
import { useState } from 'react'
import { FragmentSchema } from '@/lib/schema'
import { DeploymentConfig, DeploymentProvider, deploymentProviders } from '@/lib/deployment/deployment-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Rocket, 
  Settings, 
  Globe, 
  Shield, 
  Zap, 
  Database,
  Monitor,
  Bell,
  Code,
  Server,
  Cloud,
  CheckCircle,
  X
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface DeploymentFormProps {
  fragment?: FragmentSchema
  providers?: DeploymentProvider[]
  onDeploy: (fragment: FragmentSchema, config: DeploymentConfig) => void
  isDeploying: boolean
}

export function DeploymentForm({ fragment, providers = deploymentProviders, onDeploy, isDeploying }: DeploymentFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<DeploymentProvider | null>(null)
  const [formData, setFormData] = useState({
    name: fragment?.title || 'My App',
    environment: 'production' as 'development' | 'staging' | 'production',
    customDomain: '',
    nodeVersion: '18.x',
    buildCommand: '',
    outputDirectory: '',
    environmentVariables: {} as Record<string, string>,
    regions: [] as string[],
    autoScale: true,
    minInstances: 1,
    maxInstances: 10,
    memoryLimit: '512MB',
    timeout: 30,
    healthCheckPath: '/',
    sslEnabled: true,
    cdnEnabled: true,
    analyticsEnabled: true,
    logsRetention: 30,
    backupEnabled: false,
    notifications: {
      email: [] as string[],
      slack: '',
      discord: ''
    }
  })

  const [newEnvVar, setNewEnvVar] = useState({ key: '', value: '' })
  const [newEmailNotification, setNewEmailNotification] = useState('')
  const [fragmentCode, setFragmentCode] = useState(fragment?.code || '')
  const [fragmentTemplate, setFragmentTemplate] = useState(fragment?.template || 'nextjs-developer')

  const handleProviderSelect = (provider: DeploymentProvider) => {
    setSelectedProvider(provider)
    
    // Set default values based on provider
    setFormData(prev => ({
      ...prev,
      buildCommand: getDefaultBuildCommand(provider, fragmentTemplate),
      outputDirectory: getDefaultOutputDirectory(provider, fragmentTemplate),
      nodeVersion: provider.buildSettings.supportedNodeVersions[0] || '18.x',
      regions: provider.regions[0] ? [provider.regions[0]] : []
    }))
  }

  const getDefaultBuildCommand = (provider: DeploymentProvider, template: string) => {
    const commands: Record<string, string> = {
      'nextjs-developer': 'npm run build',
      'vue-developer': 'npm run build',
      'streamlit-developer': 'pip install -r requirements.txt',
      'gradio-developer': 'pip install -r requirements.txt',
      'code-interpreter-v1': 'pip install -r requirements.txt'
    }
    return commands[template] || 'npm run build'
  }

  const getDefaultOutputDirectory = (provider: DeploymentProvider, template: string) => {
    const dirs: Record<string, string> = {
      'nextjs-developer': '.next',
      'vue-developer': 'dist',
      'streamlit-developer': '.',
      'gradio-developer': '.',
      'code-interpreter-v1': '.'
    }
    return dirs[template] || 'dist'
  }

  const addEnvironmentVariable = () => {
    if (newEnvVar.key && newEnvVar.value) {
      setFormData(prev => ({
        ...prev,
        environmentVariables: {
          ...prev.environmentVariables,
          [newEnvVar.key]: newEnvVar.value
        }
      }))
      setNewEnvVar({ key: '', value: '' })
    }
  }

  const removeEnvironmentVariable = (key: string) => {
    setFormData(prev => ({
      ...prev,
      environmentVariables: Object.fromEntries(
        Object.entries(prev.environmentVariables).filter(([k]) => k !== key)
      )
    }))
  }

  const addEmailNotification = () => {
    if (newEmailNotification && newEmailNotification.includes('@')) {
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          email: [...prev.notifications.email, newEmailNotification]
        }
      }))
      setNewEmailNotification('')
    }
  }

  const removeEmailNotification = (email: string) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        email: prev.notifications.email.filter(e => e !== email)
      }
    }))
  }

  const handleDeploy = () => {
    if (!selectedProvider) {
      toast({
        title: "Error",
        description: "Please select a deployment provider",
        variant: "destructive",
      })
      return
    }

    if (!fragmentCode) {
      toast({
        title: "Error", 
        description: "Please provide code to deploy",
        variant: "destructive",
      })
      return
    }

    const deploymentConfig: DeploymentConfig = {
      id: `config_${Date.now()}`,
      name: formData.name,
      provider: selectedProvider,
      environment: formData.environment,
      customDomain: formData.customDomain || undefined,
      environmentVariables: formData.environmentVariables,
      buildCommand: formData.buildCommand || undefined,
      outputDirectory: formData.outputDirectory || undefined,
      nodeVersion: formData.nodeVersion || undefined,
      regions: formData.regions.length > 0 ? formData.regions : undefined,
      autoScale: formData.autoScale,
      minInstances: formData.minInstances,
      maxInstances: formData.maxInstances,
      memoryLimit: formData.memoryLimit,
      timeout: formData.timeout * 1000, // Convert to milliseconds
      healthCheckPath: formData.healthCheckPath,
      sslEnabled: formData.sslEnabled,
      cdnEnabled: formData.cdnEnabled,
      analyticsEnabled: formData.analyticsEnabled,
      logsRetention: formData.logsRetention,
      backupEnabled: formData.backupEnabled,
      notifications: formData.notifications.email.length > 0 || formData.notifications.slack || formData.notifications.discord ? formData.notifications : undefined
    }

    const deploymentFragment: FragmentSchema = {
      ...fragment,
      code: fragmentCode,
      template: fragmentTemplate,
      title: formData.name,
      description: `Deployment of ${formData.name}`,
      commentary: `Deploying ${formData.name} to ${selectedProvider.name}`,
      additional_dependencies: [],
      has_additional_dependencies: false,
      install_dependencies_command: getDefaultBuildCommand(selectedProvider, fragmentTemplate),
      port: selectedProvider.type === 'static' ? null : 3000,
      file_path: 'index.js'
    }

    onDeploy(deploymentFragment, deploymentConfig)
  }

  const getProviderIcon = (providerId: string) => {
    const icons: Record<string, React.ReactNode> = {
      'vercel': <Zap className="w-5 h-5" />,
      'netlify': <Globe className="w-5 h-5" />,
      'railway': <Server className="w-5 h-5" />,
      'render': <Cloud className="w-5 h-5" />,
      'aws-amplify': <Database className="w-5 h-5" />,
      'fly-io': <Rocket className="w-5 h-5" />
    }
    return icons[providerId] || <Server className="w-5 h-5" />
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Select Deployment Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProvider?.id === provider.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProviderSelect(provider)}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getProviderIcon(provider.id)}
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {provider.type}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {provider.features.slice(0, 2).join(', ')}
                </p>
                <div className="flex items-center gap-2">
                  {provider.pricing.free && (
                    <Badge variant="secondary" className="text-xs">Free tier</Badge>
                  )}
                  {selectedProvider?.id === provider.id && (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Code to Deploy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={fragmentTemplate} onValueChange={setFragmentTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nextjs-developer">Next.js Developer</SelectItem>
                <SelectItem value="vue-developer">Vue.js Developer</SelectItem>
                <SelectItem value="streamlit-developer">Streamlit Developer</SelectItem>
                <SelectItem value="gradio-developer">Gradio Developer</SelectItem>
                <SelectItem value="code-interpreter-v1">Python Data Analyst</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Textarea
              id="code"
              placeholder="Enter your code here..."
              value={fragmentCode}
              onChange={(e) => setFragmentCode(e.target.value)}
              className="min-h-[200px] font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Deployment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="build">Build</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">App Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="my-awesome-app"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value: 'development' | 'staging' | 'production') => 
                        setFormData(prev => ({ ...prev, environment: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain (optional)</Label>
                  <Input
                    id="customDomain"
                    value={formData.customDomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="myapp.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regions">Regions</Label>
                  <Select
                    value={formData.regions[0] || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, regions: [value] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProvider.regions.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="build" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="buildCommand">Build Command</Label>
                    <Input
                      id="buildCommand"
                      value={formData.buildCommand}
                      onChange={(e) => setFormData(prev => ({ ...prev, buildCommand: e.target.value }))}
                      placeholder="npm run build"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="outputDirectory">Output Directory</Label>
                    <Input
                      id="outputDirectory"
                      value={formData.outputDirectory}
                      onChange={(e) => setFormData(prev => ({ ...prev, outputDirectory: e.target.value }))}
                      placeholder="dist"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nodeVersion">Node Version</Label>
                  <Select
                    value={formData.nodeVersion}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, nodeVersion: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProvider.buildSettings.supportedNodeVersions.map((version) => (
                        <SelectItem key={version} value={version}>{version}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Environment Variables */}
                <div className="space-y-2">
                  <Label>Environment Variables</Label>
                  <div className="space-y-2">
                    {Object.entries(formData.environmentVariables).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="font-mono text-sm">{key}</span>
                        <span className="text-gray-500">=</span>
                        <span className="font-mono text-sm flex-1">{value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEnvironmentVariable(key)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="KEY"
                        value={newEnvVar.key}
                        onChange={(e) => setNewEnvVar(prev => ({ ...prev, key: e.target.value }))}
                      />
                      <Input
                        placeholder="value"
                        value={newEnvVar.value}
                        onChange={(e) => setNewEnvVar(prev => ({ ...prev, value: e.target.value }))}
                      />
                      <Button onClick={addEnvironmentVariable}>Add</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="memoryLimit">Memory Limit</Label>
                    <Select
                      value={formData.memoryLimit}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, memoryLimit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="256MB">256MB</SelectItem>
                        <SelectItem value="512MB">512MB</SelectItem>
                        <SelectItem value="1GB">1GB</SelectItem>
                        <SelectItem value="2GB">2GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={formData.timeout}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                      min="10"
                      max="900"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoScale">Auto Scaling</Label>
                      <p className="text-sm text-gray-600">Automatically scale based on traffic</p>
                    </div>
                    <Switch
                      id="autoScale"
                      checked={formData.autoScale}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoScale: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sslEnabled">SSL Certificate</Label>
                      <p className="text-sm text-gray-600">Enable HTTPS for your domain</p>
                    </div>
                    <Switch
                      id="sslEnabled"
                      checked={formData.sslEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sslEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cdnEnabled">CDN</Label>
                      <p className="text-sm text-gray-600">Enable content delivery network</p>
                    </div>
                    <Switch
                      id="cdnEnabled"
                      checked={formData.cdnEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, cdnEnabled: checked }))}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Notifications</Label>
                  <div className="space-y-2">
                    {formData.notifications.email.map((email) => (
                      <div key={email} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmailNotification(email)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="email@example.com"
                        value={newEmailNotification}
                        onChange={(e) => setNewEmailNotification(e.target.value)}
                      />
                      <Button onClick={addEmailNotification}>Add</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slack">Slack Webhook (optional)</Label>
                  <Input
                    id="slack"
                    value={formData.notifications.slack}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, slack: e.target.value }
                    }))}
                    placeholder="https://hooks.slack.com/..."
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Deploy Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleDeploy}
          disabled={!selectedProvider || !fragmentCode || isDeploying}
          className="min-w-32"
        >
          {isDeploying ? (
            <>
              <Monitor className="w-4 h-4 mr-2 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Deploy to {selectedProvider?.name}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
