'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { WorkflowSchema, FragmentNode, Connection } from '@/lib/workflow-engine'
import { WorkflowNode } from './workflow-node'
import { ConnectionLine } from './connection-line'
import { NodePalette } from './node-palette'
import { WorkflowToolbar } from './workflow-toolbar'
import { PropertiesPanel } from './properties-panel'
import { Button } from '@/components/ui/button'
import { Play, Save, Settings, Zap } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface WorkflowCanvasProps {
  workflow: WorkflowSchema
  onWorkflowUpdate: (workflow: WorkflowSchema) => void
  onExecute: (workflow: WorkflowSchema) => void
  readonly?: boolean
}

export function WorkflowCanvas({ 
  workflow, 
  onWorkflowUpdate, 
  onExecute, 
  readonly = false 
}: WorkflowCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<FragmentNode | null>(null)
  const [draggedNode, setDraggedNode] = useState<FragmentNode | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string
    portId: string
    type: 'input' | 'output'
  } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Handle node drag start
  const handleNodeDragStart = useCallback((node: FragmentNode, event: React.MouseEvent) => {
    if (readonly) return
    
    setDraggedNode(node)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: event.clientX - rect.left - node.position.x * zoom - canvasOffset.x,
        y: event.clientY - rect.top - node.position.y * zoom - canvasOffset.y
      })
    }
  }, [readonly, zoom, canvasOffset])

  // Handle node drag
  const handleNodeDrag = useCallback((event: React.MouseEvent) => {
    if (!draggedNode || readonly) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const newX = (event.clientX - rect.left - dragOffset.x - canvasOffset.x) / zoom
      const newY = (event.clientY - rect.top - dragOffset.y - canvasOffset.y) / zoom

      const updatedFragments = workflow.fragments.map(node =>
        node.id === draggedNode.id
          ? { ...node, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
          : node
      )

      onWorkflowUpdate({
        ...workflow,
        fragments: updatedFragments
      })
    }
  }, [draggedNode, workflow, onWorkflowUpdate, dragOffset, canvasOffset, zoom, readonly])

  // Handle node drag end
  const handleNodeDragEnd = useCallback(() => {
    setDraggedNode(null)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  // Handle connection start
  const handleConnectionStart = useCallback((
    nodeId: string,
    portId: string,
    type: 'input' | 'output'
  ) => {
    if (readonly) return
    
    setIsConnecting(true)
    setConnectionStart({ nodeId, portId, type })
  }, [readonly])

  // Handle connection end
  const handleConnectionEnd = useCallback((
    nodeId: string,
    portId: string,
    type: 'input' | 'output'
  ) => {
    if (!connectionStart || readonly) return

    // Prevent connecting to same node or same type
    if (connectionStart.nodeId === nodeId || connectionStart.type === type) {
      setIsConnecting(false)
      setConnectionStart(null)
      return
    }

    // Create connection
    const newConnection: Connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: connectionStart.type === 'output' 
        ? { nodeId: connectionStart.nodeId, portId: connectionStart.portId }
        : { nodeId, portId },
      target: connectionStart.type === 'input'
        ? { nodeId: connectionStart.nodeId, portId: connectionStart.portId }
        : { nodeId, portId },
      dataType: 'object' // Default type
    }

    // Check if connection already exists
    const existingConnection = workflow.connections.find(conn =>
      conn.source.nodeId === newConnection.source.nodeId &&
      conn.source.portId === newConnection.source.portId &&
      conn.target.nodeId === newConnection.target.nodeId &&
      conn.target.portId === newConnection.target.portId
    )

    if (!existingConnection) {
      onWorkflowUpdate({
        ...workflow,
        connections: [...workflow.connections, newConnection]
      })
    }

    setIsConnecting(false)
    setConnectionStart(null)
  }, [connectionStart, workflow, onWorkflowUpdate, readonly])

  // Handle node addition
  const handleNodeAdd = useCallback((nodeTemplate: any, position: { x: number; y: number }) => {
    if (readonly) return

    const newNode: FragmentNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fragmentId: nodeTemplate.id,
      position: {
        x: (position.x - canvasOffset.x) / zoom,
        y: (position.y - canvasOffset.y) / zoom
      },
      inputs: nodeTemplate.inputs || [],
      outputs: nodeTemplate.outputs || [],
      config: {
        template: nodeTemplate.template,
        environment: {},
        resources: {
          memory: '512MB',
          cpu: '0.5',
          timeout: 30000
        },
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000
        }
      },
      dependencies: []
    }

    onWorkflowUpdate({
      ...workflow,
      fragments: [...workflow.fragments, newNode]
    })
  }, [workflow, onWorkflowUpdate, canvasOffset, zoom, readonly])

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (readonly) return

    const updatedFragments = workflow.fragments.filter(node => node.id !== nodeId)
    const updatedConnections = workflow.connections.filter(conn =>
      conn.source.nodeId !== nodeId && conn.target.nodeId !== nodeId
    )

    onWorkflowUpdate({
      ...workflow,
      fragments: updatedFragments,
      connections: updatedConnections
    })

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }, [workflow, onWorkflowUpdate, selectedNode, readonly])

  // Handle canvas panning
  const handleCanvasPan = useCallback((event: React.MouseEvent) => {
    if (event.button === 1 || (event.button === 0 && event.ctrlKey)) { // Middle mouse or Ctrl+Left
      setIsPanning(true)
      setLastPanPoint({ x: event.clientX, y: event.clientY })
      event.preventDefault()
    }
  }, [])

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = event.clientX - lastPanPoint.x
      const deltaY = event.clientY - lastPanPoint.y
      
      setCanvasOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: event.clientX, y: event.clientY })
    } else if (draggedNode) {
      handleNodeDrag(event)
    }
  }, [isPanning, lastPanPoint, draggedNode, handleNodeDrag])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    handleNodeDragEnd()
  }, [handleNodeDragEnd])

  // Handle zoom
  const handleZoom = useCallback((event: React.WheelEvent) => {
    event.preventDefault()
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.2, Math.min(2, prev * zoomFactor)))
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && selectedNode) {
        handleNodeDelete(selectedNode.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, handleNodeDelete])

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Node Palette */}
      {!readonly && (
        <NodePalette onNodeAdd={handleNodeAdd} />
      )}
      
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <WorkflowToolbar
          workflow={workflow}
          onExecute={() => onExecute(workflow)}
          onSave={() => {
            toast({
              title: "Workflow Saved",
              description: "Your workflow has been saved successfully.",
            })
          }}
          readonly={readonly}
        />
        
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasPan}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleZoom}
        >
          <div 
            className="absolute inset-0 bg-grid-pattern"
            style={{
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`
            }}
          />
          
          {/* Workflow Nodes */}
          {workflow.fragments.map(node => (
            <WorkflowNode
              key={node.id}
              node={node}
              selected={selectedNode?.id === node.id}
              zoom={zoom}
              offset={canvasOffset}
              onSelect={setSelectedNode}
              onDragStart={handleNodeDragStart}
              onConnectionStart={handleConnectionStart}
              onConnectionEnd={handleConnectionEnd}
              onDelete={handleNodeDelete}
              readonly={readonly}
            />
          ))}
          
          {/* Connection Lines */}
          <svg 
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            style={{ 
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            {workflow.connections.map(connection => (
              <ConnectionLine
                key={connection.id}
                connection={connection}
                nodes={workflow.fragments}
                selected={false}
                onSelect={() => {}}
              />
            ))}
          </svg>
        </div>
      </div>
      
      {/* Properties Panel */}
      {selectedNode && !readonly && (
        <PropertiesPanel
          node={selectedNode}
          onNodeUpdate={(updatedNode) => {
            const updatedFragments = workflow.fragments.map(node =>
              node.id === updatedNode.id ? updatedNode : node
            )
            onWorkflowUpdate({
              ...workflow,
              fragments: updatedFragments
            })
          }}
        />
      )}
    </div>
  )
}