'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Type, 
  Square, 
  Image, 
  BarChart, 
  Sliders, 
  MousePointer,
  Code,
  Package,
  Database,
  FileText,
  Plus
} from 'lucide-react'

type CategoryComponent = {
  id: string
  name: string
  type: string
  icon: React.ReactNode
  description: string
  code: string
  props: Record<string, any>
}

type ComponentLibrary = {
  name: string
  categories: {
    [category: string]: CategoryComponent[]
  }
}

const componentLibraries: Record<string, ComponentLibrary> = {
  'streamlit-developer': {
    name: 'Streamlit Components',
    categories: {
      'Display': [
        {
          id: 'st-title',
          name: 'Title',
          type: 'title',
          icon: <Type className="w-4 h-4" />,
          description: 'Display a title',
          code: 'st.title("Your Title Here")',
          props: { title: 'Title' }
        },
        {
          id: 'st-header',
          name: 'Header',
          type: 'header',
          icon: <Type className="w-4 h-4" />,
          description: 'Display a header',
          code: 'st.header("Your Header Here")',
          props: { header: 'Header' }
        },
        {
          id: 'st-text',
          name: 'Text',
          type: 'text',
          icon: <FileText className="w-4 h-4" />,
          description: 'Display text',
          code: 'st.text("Your text here")',
          props: { text: 'Text' }
        },
        {
          id: 'st-markdown',
          name: 'Markdown',
          type: 'markdown',
          icon: <FileText className="w-4 h-4" />,
          description: 'Display markdown',
          code: 'st.markdown("**Bold text**")',
          props: { markdown: '**Bold text**' }
        }
      ],
      'Input': [
        {
          id: 'st-text-input',
          name: 'Text Input',
          type: 'input',
          icon: <Type className="w-4 h-4" />,
          description: 'Text input field',
          code: 'user_input = st.text_input("Enter text")',
          props: { label: 'Enter text', variable: 'user_input' }
        },
        {
          id: 'st-number-input',
          name: 'Number Input',
          type: 'number',
          icon: <Type className="w-4 h-4" />,
          description: 'Number input field',
          code: 'number = st.number_input("Enter number")',
          props: { label: 'Enter number', variable: 'number' }
        },
        {
          id: 'st-slider',
          name: 'Slider',
          type: 'slider',
          icon: <Sliders className="w-4 h-4" />,
          description: 'Slider input',
          code: 'value = st.slider("Select value", 0, 100, 50)',
          props: { label: 'Select value', min: 0, max: 100, default: 50 }
        },
        {
          id: 'st-button',
          name: 'Button',
          type: 'button',
          icon: <MousePointer className="w-4 h-4" />,
          description: 'Clickable button',
          code: 'if st.button("Click me"):\n    st.success("Button clicked!")',
          props: { label: 'Click me' }
        }
      ],
      'Charts': [
        {
          id: 'st-line-chart',
          name: 'Line Chart',
          type: 'chart',
          icon: <BarChart className="w-4 h-4" />,
          description: 'Line chart visualization',
          code: 'st.line_chart(data)',
          props: { data: 'data' }
        },
        {
          id: 'st-bar-chart',
          name: 'Bar Chart',
          type: 'chart',
          icon: <BarChart className="w-4 h-4" />,
          description: 'Bar chart visualization',
          code: 'st.bar_chart(data)',
          props: { data: 'data' }
        },
        {
          id: 'st-area-chart',
          name: 'Area Chart',
          type: 'chart',
          icon: <BarChart className="w-4 h-4" />,
          description: 'Area chart visualization',
          code: 'st.area_chart(data)',
          props: { data: 'data' }
        }
      ],
      'Data': [
        {
          id: 'st-dataframe',
          name: 'DataFrame',
          type: 'dataframe',
          icon: <Database className="w-4 h-4" />,
          description: 'Display DataFrame',
          code: 'st.dataframe(df)',
          props: { data: 'df' }
        },
        {
          id: 'st-table',
          name: 'Table',
          type: 'table',
          icon: <Database className="w-4 h-4" />,
          description: 'Display table',
          code: 'st.table(df)',
          props: { data: 'df' }
        }
      ]
    }
  },
  'nextjs-developer': {
    name: 'React/Next.js Components',
    categories: {
      'Layout': [
        {
          id: 'div',
          name: 'Div',
          type: 'div',
          icon: <Square className="w-4 h-4" />,
          description: 'Container element',
          code: '<div className="container">Content</div>',
          props: { className: 'container', children: 'Content' }
        },
        {
          id: 'section',
          name: 'Section',
          type: 'section',
          icon: <Square className="w-4 h-4" />,
          description: 'Section element',
          code: '<section className="section">Content</section>',
          props: { className: 'section', children: 'Content' }
        },
        {
          id: 'header',
          name: 'Header',
          type: 'header',
          icon: <Square className="w-4 h-4" />,
          description: 'Header element',
          code: '<header className="header">Content</header>',
          props: { className: 'header', children: 'Content' }
        }
      ],
      'Input': [
        {
          id: 'input',
          name: 'Input',
          type: 'input',
          icon: <Type className="w-4 h-4" />,
          description: 'Input field',
          code: '<input type="text" placeholder="Enter text" />',
          props: { type: 'text', placeholder: 'Enter text' }
        },
        {
          id: 'button',
          name: 'Button',
          type: 'button',
          icon: <MousePointer className="w-4 h-4" />,
          description: 'Button element',
          code: '<button onClick={handleClick}>Click me</button>',
          props: { onClick: 'handleClick', children: 'Click me' }
        },
        {
          id: 'textarea',
          name: 'Textarea',
          type: 'textarea',
          icon: <Type className="w-4 h-4" />,
          description: 'Textarea field',
          code: '<textarea placeholder="Enter text" rows={4} />',
          props: { placeholder: 'Enter text', rows: 4 }
        }
      ],
      'Typography': [
        {
          id: 'h1',
          name: 'Heading 1',
          type: 'h1',
          icon: <Type className="w-4 h-4" />,
          description: 'Main heading',
          code: '<h1 className="text-4xl font-bold">Heading</h1>',
          props: { className: 'text-4xl font-bold', children: 'Heading' }
        },
        {
          id: 'p',
          name: 'Paragraph',
          type: 'p',
          icon: <FileText className="w-4 h-4" />,
          description: 'Paragraph text',
          code: '<p className="text-base">Paragraph text</p>',
          props: { className: 'text-base', children: 'Paragraph text' }
        }
      ]
    }
  },
  'vue-developer': {
    name: 'Vue.js Components',
    categories: {
      'Layout': [
        {
          id: 'div',
          name: 'Div',
          type: 'div',
          icon: <Square className="w-4 h-4" />,
          description: 'Container element',
          code: '<div class="container">Content</div>',
          props: { class: 'container', children: 'Content' }
        },
        {
          id: 'section',
          name: 'Section',
          type: 'section',
          icon: <Square className="w-4 h-4" />,
          description: 'Section element',
          code: '<section class="section">Content</section>',
          props: { class: 'section', children: 'Content' }
        }
      ],
      'Input': [
        {
          id: 'input',
          name: 'Input',
          type: 'input',
          icon: <Type className="w-4 h-4" />,
          description: 'Input field',
          code: '<input type="text" v-model="inputValue" placeholder="Enter text" />',
          props: { type: 'text', model: 'inputValue', placeholder: 'Enter text' }
        },
        {
          id: 'button',
          name: 'Button',
          type: 'button',
          icon: <MousePointer className="w-4 h-4" />,
          description: 'Button element',
          code: '<button @click="handleClick">Click me</button>',
          props: { onClick: 'handleClick', children: 'Click me' }
        }
      ]
    }
  },
  'gradio-developer': {
    name: 'Gradio Components',
    categories: {
      'Input': [
        {
          id: 'textbox',
          name: 'Textbox',
          type: 'textbox',
          icon: <Type className="w-4 h-4" />,
          description: 'Text input field',
          code: 'gr.Textbox(label="Input", placeholder="Enter text")',
          props: { label: 'Input', placeholder: 'Enter text' }
        },
        {
          id: 'number',
          name: 'Number',
          type: 'number',
          icon: <Type className="w-4 h-4" />,
          description: 'Number input field',
          code: 'gr.Number(label="Number", value=0)',
          props: { label: 'Number', value: 0 }
        },
        {
          id: 'slider',
          name: 'Slider',
          type: 'slider',
          icon: <Sliders className="w-4 h-4" />,
          description: 'Slider input',
          code: 'gr.Slider(minimum=0, maximum=100, value=50, label="Slider")',
          props: { min: 0, max: 100, value: 50, label: 'Slider' }
        },
        {
          id: 'button',
          name: 'Button',
          type: 'button',
          icon: <MousePointer className="w-4 h-4" />,
          description: 'Submit button',
          code: 'gr.Button("Submit")',
          props: { label: 'Submit' }
        }
      ],
      'Output': [
        {
          id: 'textbox-output',
          name: 'Text Output',
          type: 'textbox',
          icon: <FileText className="w-4 h-4" />,
          description: 'Text output field',
          code: 'gr.Textbox(label="Output", interactive=False)',
          props: { label: 'Output', interactive: false }
        },
        {
          id: 'image',
          name: 'Image',
          type: 'image',
          // eslint-disable-next-line jsx-a11y/alt-text
          icon: <Image className="w-4 h-4" />,
          description: 'Image display',
          code: 'gr.Image(label="Image")',
          props: { label: 'Image' }
        }
      ]
    }
  },
  'code-interpreter-v1': {
    name: 'Python Components',
    categories: {
      'Imports': [
        {
          id: 'import-pandas',
          name: 'Pandas',
          type: 'import',
          icon: <Package className="w-4 h-4" />,
          description: 'Import pandas',
          code: 'import pandas as pd',
          props: { module: 'pandas as pd' }
        },
        {
          id: 'import-numpy',
          name: 'NumPy',
          type: 'import',
          icon: <Package className="w-4 h-4" />,
          description: 'Import numpy',
          code: 'import numpy as np',
          props: { module: 'numpy as np' }
        },
        {
          id: 'import-matplotlib',
          name: 'Matplotlib',
          type: 'import',
          icon: <Package className="w-4 h-4" />,
          description: 'Import matplotlib',
          code: 'import matplotlib.pyplot as plt',
          props: { module: 'matplotlib.pyplot as plt' }
        }
      ],
      'Functions': [
        {
          id: 'function',
          name: 'Function',
          type: 'function',
          icon: <Code className="w-4 h-4" />,
          description: 'Create a function',
          code: 'def my_function():\n    """Function description"""\n    pass',
          props: { name: 'my_function', docstring: 'Function description' }
        },
        {
          id: 'class',
          name: 'Class',
          type: 'class',
          icon: <Code className="w-4 h-4" />,
          description: 'Create a class',
          code: 'class MyClass:\n    """Class description"""\n    def __init__(self):\n        pass',
          props: { name: 'MyClass', docstring: 'Class description' }
        }
      ],
      'Visualization': [
        {
          id: 'plot',
          name: 'Plot',
          type: 'plot',
          icon: <BarChart className="w-4 h-4" />,
          description: 'Create a plot',
          code: 'plt.figure(figsize=(10, 6))\nplt.plot(data)\nplt.title("Plot")\nplt.show()',
          props: { data: 'data', title: 'Plot' }
        }
      ]
    }
  }
}

type ComponentLibraryKey = keyof typeof componentLibraries;

interface ComponentLibraryProps {
  template: ComponentLibraryKey
  onComponentDragStart: (component: any, event: React.DragEvent) => void
  onComponentSelect: (component: any) => void
}

export function ComponentLibrary({ 
  template, 
  onComponentDragStart, 
  onComponentSelect 
}: ComponentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  
  const library = componentLibraries[template]
  
  if (!library) {
    return (
      <div className="p-4 text-center text-gray-500">
        No components available for this template
      </div>
    )
  }

  const categories = Object.keys(library.categories)
  const allCategories = ['All', ...categories]

  const filteredComponents = categories.reduce((acc, category) => {
    if (selectedCategory === 'All' || selectedCategory === category) {
      const components = library.categories[category].filter((component: any) =>
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (components.length > 0) {
        acc[category] = components
      }
    }
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3">{library.name}</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          {allCategories.map(category => (
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

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {Object.entries(filteredComponents).map(([category, components]) => (
            <div key={category}>
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {category}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {components.map((component) => (
                  <Card
                    key={component.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
                    draggable
                    onDragStart={(e) => onComponentDragStart(component, e)}
                    onClick={() => onComponentSelect(component)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded bg-blue-100 dark:bg-blue-900">
                          {component.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {component.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {component.description}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-gray-400" />
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono text-gray-700 dark:text-gray-300">
                        {component.code.split('\n')[0]}
                        {component.code.split('\n').length > 1 && '...'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Drag components to the editor or click to insert
        </p>
      </div>
    </div>
  )
}