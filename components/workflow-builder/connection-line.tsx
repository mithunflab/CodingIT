'use client'

import React from 'react'
import { Connection, FragmentNode } from '@/lib/workflow-engine'

interface ConnectionLineProps {
  connection: Connection
  nodes: FragmentNode[]
  selected: boolean
  onSelect: (connection: Connection) => void
}

export function ConnectionLine({ 
  connection, 
  nodes, 
  selected, 
  onSelect 
}: ConnectionLineProps) {
  // Find source and target nodes
  const sourceNode = nodes.find(n => n.id === connection.source.nodeId)
  const targetNode = nodes.find(n => n.id === connection.target.nodeId)

  if (!sourceNode || !targetNode) return null

  // Calculate port positions
  const sourcePortIndex = sourceNode.outputs.findIndex(p => p.id === connection.source.portId)
  const targetPortIndex = targetNode.inputs.findIndex(p => p.id === connection.target.portId)

  const sourceX = sourceNode.position.x + 200 // Node width
  const sourceY = sourceNode.position.y + 60 + sourcePortIndex * 24 + 6 // Port center

  const targetX = targetNode.position.x
  const targetY = targetNode.position.y + 60 + targetPortIndex * 24 + 6 // Port center

  // Calculate control points for smooth curve
  const controlOffset = Math.min(100, Math.abs(targetX - sourceX) / 2)
  const controlX1 = sourceX + controlOffset
  const controlX2 = targetX - controlOffset

  const path = `M ${sourceX},${sourceY} C ${controlX1},${sourceY} ${controlX2},${targetY} ${targetX},${targetY}`

  const getConnectionColor = (dataType: string) => {
    switch (dataType) {
      case 'string':
        return '#10b981' // green
      case 'number':
        return '#3b82f6' // blue
      case 'object':
        return '#8b5cf6' // purple
      case 'array':
        return '#f59e0b' // orange
      case 'file':
        return '#ef4444' // red
      default:
        return '#6b7280' // gray
    }
  }

  return (
    <g>
      {/* Connection path */}
      <path
        d={path}
        stroke={getConnectionColor(connection.dataType)}
        strokeWidth={selected ? 3 : 2}
        fill="none"
        className="cursor-pointer hover:stroke-width-3 transition-all"
        onClick={(e) => {
          e.stopPropagation()
          onSelect(connection)
        }}
      />
      
      {/* Connection arrow */}
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={getConnectionColor(connection.dataType)}
          />
        </marker>
      </defs>
      
      <path
        d={path}
        stroke={getConnectionColor(connection.dataType)}
        strokeWidth={selected ? 3 : 2}
        fill="none"
        markerEnd={`url(#arrowhead-${connection.id})`}
        className="pointer-events-none"
      />
      
      {/* Data type label */}
      <text
        x={(sourceX + targetX) / 2}
        y={(sourceY + targetY) / 2 - 8}
        textAnchor="middle"
        className="text-xs font-medium fill-gray-600 dark:fill-gray-400 pointer-events-none"
      >
        {connection.dataType}
      </text>
    </g>
  )
}