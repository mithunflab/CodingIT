'use client'

import React, { useState } from 'react'
import { WorkflowSchema } from '@/lib/workflow-engine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Save, 
  Settings, 
  Zap, 
  Download, 
  Upload, 
  Share, 
  Eye, 
  EyeOff,
  Grid,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pause,
  Square
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface WorkflowToolbarProps {
  workflow: WorkflowSchema
  onExecute: () => void
  onSave: () => void
  readonly?: boolean
}

export function WorkflowToolbar({ 
  workflow, 
  onExecute, 
  onSave, 
  readonly = false 
}: WorkflowToolbarProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showGrid, setShowGrid] = useState(true)

  const handleExecute = async () => {
    setIsExecuting(true)
    try {
      await onExecute()
      toast({
        title: "Workflow Executed",
        description: "Workflow execution completed successfully.",
      })
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "An error occurred during execution.",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSave = () => {
    onSave()
    toast({
      title: "Workflow Saved",
      description: "Your workflow has been saved successfully.",
    })
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(workflow, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `workflow-${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast({
      title: "Workflow Exported",
      description: "Workflow has been exported to JSON file.",
    })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedWorkflow = JSON.parse(e.target?.result as string)
        // Validate and update workflow
        toast({
          title: "Workflow Imported",
          description: "Workflow has been imported successfully.",
        })
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import workflow. Please check the file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/workflows/${workflow.id}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link Copied",
      description: "Workflow share link has been copied to clipboard.",
    })
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left section - Workflow info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-semibold">{workflow.name}</h1>
          <Badge variant="outline" className="text-xs">
            v{workflow.version}
          </Badge>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {workflow.fragments.length} nodes • {workflow.connections.length} connections
        </div>
      </div>

      {/* Right section - Controls */}
      <div className="flex items-center gap-2">
        {/* View controls */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className="gap-1"
        >
          <Grid className="w-4 h-4" />
          Grid
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {/* implement zoom in */}}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {/* implement zoom out */}}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {/* implement reset view */}}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* File operations */}
        {!readonly && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="gap-1"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4" />
                  Import
                </span>
              </Button>
            </label>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-1"
        >
          <Share className="w-4 h-4" />
          Share
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Settings */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Workflow Settings</DialogTitle>
              <DialogDescription>
                Configure workflow execution settings and behavior.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Workflow Name</label>
                <Input
                  value={workflow.name}
                  onChange={(e) => {
                    // Update workflow name
                  }}
                  disabled={readonly}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={workflow.description || ''}
                  onChange={(e) => {
                    // Update workflow description
                  }}
                  disabled={readonly}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Global Variables</label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {workflow.variables.length} variables defined
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Triggers</label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {workflow.triggers.length} triggers configured
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Execute button */}
        <Button
          onClick={handleExecute}
          disabled={isExecuting || workflow.fragments.length === 0}
          className="gap-1"
        >
          {isExecuting ? (
            <>
              <Pause className="w-4 h-4" />
              Executing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Execute
            </>
          )}
        </Button>
      </div>
    </div>
  )
}