'use client'

import React, { useState } from 'react'
import { FragmentNode, PortMapping } from '@/lib/workflow-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Settings, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Cpu,
  MemoryStick,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface PropertiesPanelProps {
  node: FragmentNode
  onNodeUpdate: (node: FragmentNode) => void
}

export function PropertiesPanel({ node, onNodeUpdate }: PropertiesPanelProps) {
  const [localNode, setLocalNode] = useState<FragmentNode>(node)

  const handleUpdate = (updates: Partial<FragmentNode>) => {
    const updatedNode = { ...localNode, ...updates }
    setLocalNode(updatedNode)
    onNodeUpdate(updatedNode)
  }

  const handleConfigUpdate = (configUpdates: Partial<FragmentNode['config']>) => {
    handleUpdate({
      config: { ...localNode.config, ...configUpdates }
    })
  }

  const handleResourceUpdate = (resourceUpdates: Partial<FragmentNode['config']['resources']>) => {
    handleConfigUpdate({
      resources: { ...localNode.config.resources, ...resourceUpdates }
    })
  }

  const handleRetryPolicyUpdate = (retryUpdates: Partial<FragmentNode['config']['retryPolicy']>) => {
    handleConfigUpdate({
      retryPolicy: { ...localNode.config.retryPolicy, ...retryUpdates }
    })
  }

  const handleAddInput = () => {
    const newInput: PortMapping = {
      id: `input_${Date.now()}`,
      name: 'new_input',
      type: 'input',
      dataType: 'string',
      required: false
    }
    
    handleUpdate({
      inputs: [...localNode.inputs, newInput]
    })
  }

  const handleAddOutput = () => {
    const newOutput: PortMapping = {
      id: `output_${Date.now()}`,
      name: 'new_output',
      type: 'output',
      dataType: 'string',
      required: false
    }
    
    handleUpdate({
      outputs: [...localNode.outputs, newOutput]
    })
  }

  const handleRemoveInput = (inputId: string) => {
    handleUpdate({
      inputs: localNode.inputs.filter(input => input.id !== inputId)
    })
  }

  const handleRemoveOutput = (outputId: string) => {
    handleUpdate({
      outputs: localNode.outputs.filter(output => output.id !== outputId)
    })
  }

  const handlePortUpdate = (portId: string, updates: Partial<PortMapping>, isInput: boolean) => {
    if (isInput) {
      handleUpdate({
        inputs: localNode.inputs.map(input => 
          input.id === portId ? { ...input, ...updates } : input
        )
      })
    } else {
      handleUpdate({
        outputs: localNode.outputs.map(output => 
          output.id === portId ? { ...output, ...updates } : output
        )
      })
    }
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Properties</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure node settings and behavior
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="node-id">Node ID</Label>
                    <Input
                      id="node-id"
                      value={localNode.id}
                      disabled
                      className="bg-gray-50 dark:bg-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fragment-id">Fragment ID</Label>
                    <Input
                      id="fragment-id"
                      value={localNode.fragmentId}
                      onChange={(e) => handleUpdate({ fragmentId: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template">Template</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="template"
                        value={localNode.config.template}
                        onChange={(e) => handleConfigUpdate({ template: e.target.value })}
                      />
                      <Badge variant="outline">{localNode.config.template}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="X"
                        value={Math.round(localNode.position.x)}
                        onChange={(e) => handleUpdate({ 
                          position: { ...localNode.position, x: Number(e.target.value) || 0 }
                        })}
                      />
                      <Input
                        placeholder="Y"
                        value={Math.round(localNode.position.y)}
                        onChange={(e) => handleUpdate({ 
                          position: { ...localNode.position, y: Number(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dependencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Node Dependencies</Label>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {localNode.dependencies.length === 0 ? 'No dependencies' : 
                       `${localNode.dependencies.length} dependencies`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Input Ports</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddInput}
                      className="gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Input
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {localNode.inputs.map((input) => (
                    <Card key={input.id} className="border-dashed">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-sm">{input.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveInput(input.id)}
                            className="p-1 h-auto text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={input.name}
                              onChange={(e) => handlePortUpdate(input.id, { name: e.target.value }, true)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Type</Label>
                            <select
                              value={input.dataType}
                              onChange={(e) => handlePortUpdate(input.id, { dataType: e.target.value as any }, true)}
                              className="w-full h-8 px-2 text-sm border rounded"
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="object">Object</option>
                              <option value="array">Array</option>
                              <option value="file">File</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={input.required}
                            onCheckedChange={(checked) => handlePortUpdate(input.id, { required: checked }, true)}
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outputs" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Output Ports</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOutput}
                      className="gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Output
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {localNode.outputs.map((output) => (
                    <Card key={output.id} className="border-dashed">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-sm">{output.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOutput(output.id)}
                            className="p-1 h-auto text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={output.name}
                              onChange={(e) => handlePortUpdate(output.id, { name: e.target.value }, false)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Type</Label>
                            <select
                              value={output.dataType}
                              onChange={(e) => handlePortUpdate(output.id, { dataType: e.target.value as any }, false)}
                              className="w-full h-8 px-2 text-sm border rounded"
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="object">Object</option>
                              <option value="array">Array</option>
                              <option value="file">File</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Resource Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="memory">Memory Limit</Label>
                    <Input
                      id="memory"
                      value={localNode.config.resources.memory || '512MB'}
                      onChange={(e) => handleResourceUpdate({ memory: e.target.value })}
                      placeholder="512MB"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cpu">CPU Limit</Label>
                    <Input
                      id="cpu"
                      value={localNode.config.resources.cpu || '0.5'}
                      onChange={(e) => handleResourceUpdate({ cpu: e.target.value })}
                      placeholder="0.5"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={localNode.config.resources.timeout || 30000}
                      onChange={(e) => handleResourceUpdate({ timeout: Number(e.target.value) })}
                      placeholder="30000"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="max-retries">Max Retries</Label>
                    <Input
                      id="max-retries"
                      type="number"
                      value={localNode.config.retryPolicy.maxRetries}
                      onChange={(e) => handleRetryPolicyUpdate({ maxRetries: Number(e.target.value) })}
                      min="0"
                      max="10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backoff-strategy">Backoff Strategy</Label>
                    <select
                      id="backoff-strategy"
                      value={localNode.config.retryPolicy.backoffStrategy}
                      onChange={(e) => handleRetryPolicyUpdate({ backoffStrategy: e.target.value as any })}
                      className="w-full h-10 px-3 text-sm border rounded"
                    >
                      <option value="linear">Linear</option>
                      <option value="exponential">Exponential</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="initial-delay">Initial Delay (ms)</Label>
                    <Input
                      id="initial-delay"
                      type="number"
                      value={localNode.config.retryPolicy.initialDelay}
                      onChange={(e) => handleRetryPolicyUpdate({ initialDelay: Number(e.target.value) })}
                      min="100"
                      max="10000"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}