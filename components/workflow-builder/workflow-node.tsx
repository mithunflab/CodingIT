'use client'

import React from 'react'
import { FragmentNode, PortMapping } from '@/lib/workflow-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Code, 
  Play, 
  Square, 
  Circle, 
  Trash2, 
  Settings,
  Zap,
  Database,
  Globe,
  FileText
} from 'lucide-react'

interface WorkflowNodeProps {
  node: FragmentNode
  selected: boolean
  zoom: number
  offset: { x: number; y: number }
  onSelect: (node: FragmentNode) => void
  onDragStart: (node: FragmentNode, event: React.MouseEvent) => void
  onConnectionStart: (nodeId: string, portId: string, type: 'input' | 'output') => void
  onConnectionEnd: (nodeId: string, portId: string, type: 'input' | 'output') => void
  onDelete: (nodeId: string) => void
  readonly?: boolean
}

const getNodeIcon = (template: string) => {
  switch (template) {
    case 'code-interpreter-v1':
      return <Code className="w-4 h-4" />
    case 'nextjs-developer':
      return <Globe className="w-4 h-4" />
    case 'vue-developer':
      return <Globe className="w-4 h-4" />
    case 'streamlit-developer':
      return <Zap className="w-4 h-4" />
    case 'gradio-developer':
      return <Zap className="w-4 h-4" />
    case 'bolt.diy':
      return <FileText className="w-4 h-4" />
    default:
      return <Square className="w-4 h-4" />
  }
}

const getNodeColor = (template: string) => {
  switch (template) {
    case 'code-interpreter-v1':
      return 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-600'
    case 'nextjs-developer':
      return 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-600'
    case 'vue-developer':
      return 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900 dark:border-emerald-600'
    case 'streamlit-developer':
      return 'bg-purple-100 border-purple-300 dark:bg-purple-900 dark:border-purple-600'
    case 'gradio-developer':
      return 'bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-600'
    case 'bolt.diy':
      return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-600'
    default:
      return 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
  }
}

const Port = ({ 
  port, 
  nodeId, 
  type, 
  position, 
  onConnectionStart, 
  onConnectionEnd,
  readonly 
}: {
  port: PortMapping
  nodeId: string
  type: 'input' | 'output'
  position: { x: number; y: number }
  onConnectionStart: (nodeId: string, portId: string, type: 'input' | 'output') => void
  onConnectionEnd: (nodeId: string, portId: string, type: 'input' | 'output') => void
  readonly?: boolean
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (readonly) return
    e.stopPropagation()
    onConnectionStart(nodeId, port.id, type)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (readonly) return
    e.stopPropagation()
    onConnectionEnd(nodeId, port.id, type)
  }

  const getPortColor = (dataType: string) => {
    switch (dataType) {
      case 'string':
        return 'bg-green-500'
      case 'number':
        return 'bg-blue-500'
      case 'object':
        return 'bg-purple-500'
      case 'array':
        return 'bg-orange-500'
      case 'file':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div 
      className={`absolute flex items-center ${type === 'input' ? 'left-0' : 'right-0'} transform ${type === 'input' ? '-translate-x-2' : 'translate-x-2'}`}
      style={{ 
        top: position.y,
        [type === 'input' ? 'left' : 'right']: type === 'input' ? 0 : 0
      }}
    >
      <div
        className={`w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform ${getPortColor(port.dataType)} ${readonly ? 'cursor-not-allowed' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        title={`${port.name} (${port.dataType})`}
      />
      <div className={`ml-2 text-xs font-medium ${type === 'input' ? 'text-left' : 'text-right'}`}>
        {port.name}
        {port.required && <span className="text-red-500 ml-1">*</span>}
      </div>
    </div>
  )
}

export function WorkflowNode({
  node,
  selected,
  zoom,
  offset,
  onSelect,
  onDragStart,
  onConnectionStart,
  onConnectionEnd,
  onDelete,
  readonly = false
}: WorkflowNodeProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (readonly) return
    e.stopPropagation()
    onSelect(node)
    onDragStart(node, e)
  }

  const handleDelete = (e: React.MouseEvent) => {
    if (readonly) return
    e.stopPropagation()
    onDelete(node.id)
  }

  const nodeWidth = 200
  const nodeHeight = 120 + Math.max(node.inputs.length, node.outputs.length) * 24

  return (
    <div
      className={`absolute select-none ${readonly ? 'cursor-default' : 'cursor-move'}`}
      style={{
        left: node.position.x * zoom + offset.x,
        top: node.position.y * zoom + offset.y,
        width: nodeWidth * zoom,
        height: nodeHeight * zoom,
        transform: `scale(${zoom})`,
        transformOrigin: '0 0'
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className={`
        w-full h-full
        ${getNodeColor(node.config.template)}
        ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        hover:shadow-lg transition-shadow
        relative
      `}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getNodeIcon(node.config.template)}
              <CardTitle className="text-sm font-medium truncate">
                {node.fragmentId}
              </CardTitle>
            </div>
            {!readonly && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-red-500"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              {node.config.template}
            </Badge>
            
            {node.config.resources.timeout && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Timeout: {node.config.resources.timeout}ms
              </div>
            )}
            
            {node.dependencies.length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Dependencies: {node.dependencies.length}
              </div>
            )}
          </div>
        </CardContent>

        {/* Input Ports */}
        {node.inputs.map((input, index) => (
          <Port
            key={input.id}
            port={input}
            nodeId={node.id}
            type="input"
            position={{ x: 0, y: 60 + index * 24 }}
            onConnectionStart={onConnectionStart}
            onConnectionEnd={onConnectionEnd}
            readonly={readonly}
          />
        ))}

        {/* Output Ports */}
        {node.outputs.map((output, index) => (
          <Port
            key={output.id}
            port={output}
            nodeId={node.id}
            type="output"
            position={{ x: nodeWidth, y: 60 + index * 24 }}
            onConnectionStart={onConnectionStart}
            onConnectionEnd={onConnectionEnd}
            readonly={readonly}
          />
        ))}
      </Card>
    </div>
  )
}