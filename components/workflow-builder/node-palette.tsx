'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Code, 
  Globe, 
  Zap, 
  FileText, 
  Search, 
  Plus,
  Database,
  Settings,
  Workflow
} from 'lucide-react'

const nodeTemplates = [
  {
    id: 'code-interpreter',
    name: 'Code Interpreter',
    description: 'Execute Python code with data analysis capabilities',
    template: 'code-interpreter-v1',
    category: 'Analysis',
    icon: <Code className="w-5 h-5" />,
    color: 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-600',
    inputs: [
      {
        id: 'code',
        name: 'code',
        type: 'input' as const,
        dataType: 'string' as const,
        required: true
      },
      {
        id: 'data',
        name: 'data',
        type: 'input' as const,
        dataType: 'object' as const,
        required: false
      }
    ],
    outputs: [
      {
        id: 'result',
        name: 'result',
        type: 'output' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'logs',
        name: 'logs',
        type: 'output' as const,
        dataType: 'string' as const,
        required: false
      }
    ]
  },
  {
    id: 'nextjs-app',
    name: 'Next.js App',
    description: 'Create and run Next.js applications',
    template: 'nextjs-developer',
    category: 'Web',
    icon: <Globe className="w-5 h-5" />,
    color: 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-600',
    inputs: [
      {
        id: 'components',
        name: 'components',
        type: 'input' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'config',
        name: 'config',
        type: 'input' as const,
        dataType: 'object' as const,
        required: false
      }
    ],
    outputs: [
      {
        id: 'app',
        name: 'app',
        type: 'output' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'url',
        name: 'url',
        type: 'output' as const,
        dataType: 'string' as const,
        required: true
      }
    ]
  },
  {
    id: 'vue-app',
    name: 'Vue.js App',
    description: 'Create and run Vue.js applications',
    template: 'vue-developer',
    category: 'Web',
    icon: <Globe className="w-5 h-5" />,
    color: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900 dark:border-emerald-600',
    inputs: [
      {
        id: 'components',
        name: 'components',
        type: 'input' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'config',
        name: 'config',
        type: 'input' as const,
        dataType: 'object' as const,
        required: false
      }
    ],
    outputs: [
      {
        id: 'app',
        name: 'app',
        type: 'output' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'url',
        name: 'url',
        type: 'output' as const,
        dataType: 'string' as const,
        required: true
      }
    ]
  },
  {
    id: 'streamlit-app',
    name: 'Streamlit App',
    description: 'Create interactive data applications',
    template: 'streamlit-developer',
    category: 'Data',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-purple-100 border-purple-300 dark:bg-purple-900 dark:border-purple-600',
    inputs: [
      {
        id: 'script',
        name: 'script',
        type: 'input' as const,
        dataType: 'string' as const,
        required: true
      },
      {
        id: 'data',
        name: 'data',
        type: 'input' as const,
        dataType: 'object' as const,
        required: false
      }
    ],
    outputs: [
      {
        id: 'app',
        name: 'app',
        type: 'output' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'url',
        name: 'url',
        type: 'output' as const,
        dataType: 'string' as const,
        required: true
      }
    ]
  },
  {
    id: 'gradio-app',
    name: 'Gradio App',
    description: 'Create machine learning interfaces',
    template: 'gradio-developer',
    category: 'ML',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-600',
    inputs: [
      {
        id: 'interface',
        name: 'interface',
        type: 'input' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'model',
        name: 'model',
        type: 'input' as const,
        dataType: 'object' as const,
        required: false
      }
    ],
    outputs: [
      {
        id: 'app',
        name: 'app',
        type: 'output' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'url',
        name: 'url',
        type: 'output' as const,
        dataType: 'string' as const,
        required: true
      }
    ]
  },
  {
    id: 'data-processor',
    name: 'Data Processor',
    description: 'Process and transform data',
    template: 'code-interpreter-v1',
    category: 'Data',
    icon: <Database className="w-5 h-5" />,
    color: 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900 dark:border-indigo-600',
    inputs: [
      {
        id: 'data',
        name: 'data',
        type: 'input' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'config',
        name: 'config',
        type: 'input' as const,
        dataType: 'object' as const,
        required: false
      }
    ],
    outputs: [
      {
        id: 'processed_data',
        name: 'processed_data',
        type: 'output' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'stats',
        name: 'stats',
        type: 'output' as const,
        dataType: 'object' as const,
        required: false
      }
    ]
  },
  {
    id: 'api-connector',
    name: 'API Connector',
    description: 'Connect to external APIs',
    template: 'code-interpreter-v1',
    category: 'Integration',
    icon: <Settings className="w-5 h-5" />,
    color: 'bg-cyan-100 border-cyan-300 dark:bg-cyan-900 dark:border-cyan-600',
    inputs: [
      {
        id: 'url',
        name: 'url',
        type: 'input' as const,
        dataType: 'string' as const,
        required: true
      },
      {
        id: 'params',
        name: 'params',
        type: 'input' as const,
        dataType: 'object' as const,
        required: false
      }
    ],
    outputs: [
      {
        id: 'response',
        name: 'response',
        type: 'output' as const,
        dataType: 'object' as const,
        required: true
      },
      {
        id: 'status',
        name: 'status',
        type: 'output' as const,
        dataType: 'number' as const,
        required: true
      }
    ]
  },
  {
    id: 'workflow-trigger',
    name: 'Workflow Trigger',
    description: 'Trigger workflows based on events',
    template: 'code-interpreter-v1',
    category: 'Control',
    icon: <Workflow className="w-5 h-5" />,
    color: 'bg-rose-100 border-rose-300 dark:bg-rose-900 dark:border-rose-600',
    inputs: [
      {
        id: 'event',
        name: 'event',
        type: 'input' as const,
        dataType: 'object' as const,
        required: true
      }
    ],
    outputs: [
      {
        id: 'triggered',
        name: 'triggered',
        type: 'output' as const,
        dataType: 'string' as const,
        required: true
      }
    ]
  }
]

const categories = ['All', 'Analysis', 'Web', 'Data', 'ML', 'Integration', 'Control']

interface NodePaletteProps {
  onNodeAdd: (nodeTemplate: any, position: { x: number; y: number }) => void
}

export function NodePalette({ onNodeAdd }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredTemplates = nodeTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDragStart = (e: React.DragEvent, template: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(template))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleNodeClick = (template: any) => {
    // Add node at center of canvas
    onNodeAdd(template, { x: 400, y: 300 })
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3">Node Palette</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Node Templates */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${template.color}`}
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              onClick={() => handleNodeClick(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-white dark:bg-gray-800">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {template.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {template.category}
                    </Badge>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {template.description}
                </p>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{template.inputs.length} inputs</span>
                  <span>{template.outputs.length} outputs</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      
      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Drag nodes to canvas or click to add at center
        </p>
      </div>
    </div>
  )
}