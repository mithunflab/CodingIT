'use client'

import React, { useState, useEffect } from 'react'
import { FragmentSchema } from '@/lib/schema'
import type { TemplateId } from '@/lib/templates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FragmentCard } from './fragment-card'
import { FragmentDetail } from './fragment-detail'
import { TemplateMarketplace } from './template-marketplace'
import { 
  Search, 
  Filter, 
  Plus, 
  Star, 
  Download, 
  Clock, 
  TrendingUp,
  Layers,
  Package,
  Heart,
  Share
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface FragmentLibraryProps {
  onFragmentSelect: (fragment: FragmentSchema) => void
  onFragmentFork: (fragment: FragmentSchema) => void
  onFragmentCreate: () => void
  userFragments?: FragmentSchema[]
  isLoading?: boolean
}

export interface LibraryFragment extends FragmentSchema {
  id: string
  author: string
  authorId: string
  tags: string[]
  downloads: number
  likes: number
  forks: number
  rating: number
  isPublic: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  dependencies: string[]
  version: string
  changelog?: string
  screenshots?: string[]
  demoUrl?: string
  githubUrl?: string
}

const mockFragments: LibraryFragment[] = [
  {
    id: '1',
    title: 'Data Visualization Dashboard',
    description: 'Interactive dashboard with multiple chart types using Streamlit and Plotly',
    template: 'streamlit-developer',
    code: `import streamlit as st
import plotly.express as px
import pandas as pd

st.title("Data Visualization Dashboard")

# Sample data
data = pd.DataFrame({
    'x': [1, 2, 3, 4, 5],
    'y': [10, 15, 13, 17, 20]
})

# Create charts
fig = px.line(data, x='x', y='y', title='Sample Line Chart')
st.plotly_chart(fig)

fig2 = px.bar(data, x='x', y='y', title='Sample Bar Chart')
st.plotly_chart(fig2)`,
    author: 'DataViz Pro',
    authorId: 'user123',
    tags: ['dashboard', 'visualization', 'plotly', 'charts'],
    downloads: 1250,
    likes: 89,
    forks: 23,
    rating: 4.8,
    isPublic: true,
    isFavorite: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
    category: 'Data Analysis',
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    dependencies: ['streamlit', 'plotly', 'pandas'],
    version: '1.2.0',
    changelog: 'Added bar chart support',
    demoUrl: 'https://example.com/demo1',
    commentary: 'This fragment creates a simple data visualization dashboard using Streamlit and Plotly. It displays a line chart and a bar chart from a sample dataset.',
    additional_dependencies: [],
    has_additional_dependencies: false,
    install_dependencies_command: '',
    port: null,
    file_path: 'data-viz-dashboard.py'
  },
  {
    id: '2',
    title: 'React Todo App',
    description: 'A complete todo application with CRUD operations and local storage',
    template: 'nextjs-developer',
    code: `import React, { useState, useEffect } from 'react'

export default function TodoApp() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')

  useEffect(() => {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }])
      setNewTodo('')
    }
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Todo App</h1>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      
      <ul className="space-y-2">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center gap-2 p-2 border rounded">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}`,
    author: 'React Master',
    authorId: 'user456',
    tags: ['react', 'todo', 'crud', 'localstorage'],
    downloads: 890,
    likes: 67,
    forks: 34,
    rating: 4.6,
    isPublic: true,
    isFavorite: true,
    createdAt: '2024-01-10T08:15:00Z',
    updatedAt: '2024-01-18T16:20:00Z',
    category: 'Web Development',
    difficulty: 'beginner',
    estimatedTime: '45 minutes',
    dependencies: ['react', 'next.js'],
    version: '1.1.0',
    changelog: 'Fixed localStorage bug',
    githubUrl: 'https://github.com/example/todo-app',
    commentary: 'This fragment is a complete Todo application built with React. It supports adding, toggling, and deleting todos, and persists them to local storage.',
    additional_dependencies: [],
    has_additional_dependencies: false,
    install_dependencies_command: '',
    port: 3000,
    file_path: 'components/todo-app.tsx'
  },
  {
    id: '3',
    title: 'ML Model Interface',
    description: 'Gradio interface for machine learning model inference with file upload',
    template: 'gradio-developer',
    code: `import gradio as gr
import numpy as np
from PIL import Image

def predict_image(image):
    """Dummy prediction function"""
    # In a real app, this would load and run your ML model
    predictions = {
        "cat": 0.8,
        "dog": 0.15,
        "bird": 0.05
    }
    return predictions

def predict_text(text):
    """Dummy text classification"""
    return {
        "positive": 0.7,
        "negative": 0.2,
        "neutral": 0.1
    }

# Create Gradio interface
with gr.Blocks(title="ML Model Interface") as demo:
    gr.Markdown("# Machine Learning Model Interface")
    
    with gr.Tab("Image Classification"):
        with gr.Row():
            image_input = gr.Image(type="pil")
            image_output = gr.Label()
        
        image_button = gr.Button("Classify Image")
        image_button.click(predict_image, inputs=image_input, outputs=image_output)
    
    with gr.Tab("Text Classification"):
        with gr.Row():
            text_input = gr.Textbox(placeholder="Enter text to classify...")
            text_output = gr.Label()
        
        text_button = gr.Button("Classify Text")
        text_button.click(predict_text, inputs=text_input, outputs=text_output)

if __name__ == "__main__":
    demo.launch()`,
    author: 'ML Engineer',
    authorId: 'user789',
    tags: ['machine-learning', 'gradio', 'classification', 'interface'],
    downloads: 456,
    likes: 45,
    forks: 12,
    rating: 4.9,
    isPublic: true,
    isFavorite: false,
    createdAt: '2024-01-12T12:00:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
    category: 'Machine Learning',
    difficulty: 'advanced',
    estimatedTime: '60 minutes',
    dependencies: ['gradio', 'numpy', 'pillow'],
    version: '1.0.0',
    demoUrl: 'https://example.com/ml-demo',
    commentary: 'This fragment provides a Gradio interface for a machine learning model. It includes tabs for both image and text classification, with dummy prediction functions.',
    additional_dependencies: [],
    has_additional_dependencies: false,
    install_dependencies_command: '',
    port: 7860,
    file_path: 'ml-interface.py'
  }
]

export function FragmentLibrary({ 
  onFragmentSelect, 
  onFragmentFork, 
  onFragmentCreate,
  userFragments = [],
  isLoading = false
}: FragmentLibraryProps) {
  const [activeTab, setActiveTab] = useState('browse')
  const [selectedFragment, setSelectedFragment] = useState<LibraryFragment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | 'All'>('All')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular')
  const [fragments, setFragments] = useState<LibraryFragment[]>(mockFragments)

  const categories = ['All', 'Data Analysis', 'Web Development', 'Machine Learning', 'Utilities', 'Templates']
  const templates: (TemplateId | 'All')[] = ['All', 'streamlit-developer', 'nextjs-developer', 'vue-developer', 'gradio-developer', 'code-interpreter-v1']

  const filteredFragments = fragments.filter(fragment => {
    const matchesSearch = fragment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fragment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fragment.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || fragment.category === selectedCategory
    const matchesTemplate = selectedTemplate === 'All' || fragment.template === selectedTemplate
    
    return matchesSearch && matchesCategory && matchesTemplate
  })

  const sortedFragments = [...filteredFragments].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'rating':
        return b.rating - a.rating
      default:
        return 0
    }
  })

  const handleFragmentLike = (fragmentId: string) => {
    setFragments(prev => prev.map(fragment => 
      fragment.id === fragmentId 
        ? { ...fragment, likes: fragment.likes + 1, isFavorite: !fragment.isFavorite }
        : fragment
    ))
    
    toast({
      title: "Fragment Liked",
      description: "Fragment has been added to your favorites.",
    })
  }

  const handleFragmentDownload = (fragment: LibraryFragment) => {
    setFragments(prev => prev.map(f => 
      f.id === fragment.id 
        ? { ...f, downloads: f.downloads + 1 }
        : f
    ))
    
    onFragmentSelect(fragment)
    
    toast({
      title: "Fragment Downloaded",
      description: "Fragment has been added to your workspace.",
    })
  }

  const handleFragmentFork = (fragment: LibraryFragment) => {
    setFragments(prev => prev.map(f => 
      f.id === fragment.id 
        ? { ...f, forks: f.forks + 1 }
        : f
    ))
    
    onFragmentFork(fragment)
    
    toast({
      title: "Fragment Forked",
      description: "Fragment has been forked to your workspace.",
    })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Fragment Library</h1>
            <Badge variant="outline">{fragments.length} fragments</Badge>
          </div>
          
          <Button onClick={onFragmentCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Fragment
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search fragments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as TemplateId | 'All')}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  {templates.map(template => (
                    <option key={template} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'rating')}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="popular">Most Popular</option>
                  <option value="recent">Most Recent</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <h3 className="font-medium mb-2">Library Stats</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Total Fragments</span>
                  <span>{fragments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Fragments</span>
                  <span>{userFragments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Downloads</span>
                  <span>{fragments.reduce((sum, f) => sum + f.downloads, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="browse">Browse</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="my-fragments">My Fragments</TabsTrigger>
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="browse" className="flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedFragments.map(fragment => (
                  <FragmentCard
                    key={fragment.id}
                    fragment={fragment}
                    onSelect={() => setSelectedFragment(fragment)}
                    onLike={() => handleFragmentLike(fragment.id)}
                    onDownload={() => handleFragmentDownload(fragment)}
                    onFork={() => handleFragmentFork(fragment)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedFragments.filter(f => f.isFavorite).map(fragment => (
                  <FragmentCard
                    key={fragment.id}
                    fragment={fragment}
                    onSelect={() => setSelectedFragment(fragment)}
                    onLike={() => handleFragmentLike(fragment.id)}
                    onDownload={() => handleFragmentDownload(fragment)}
                    onFork={() => handleFragmentFork(fragment)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="my-fragments" className="flex-1 p-6">
              <div className="text-center py-12">
                <Layers className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Personal Fragments</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first fragment to get started
                </p>
                <Button onClick={onFragmentCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Fragment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="marketplace" className="flex-1 p-6">
              <TemplateMarketplace />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fragment Detail Modal */}
      {selectedFragment && (
        <FragmentDetail
          fragment={selectedFragment}
          onClose={() => setSelectedFragment(null)}
          onDownload={() => handleFragmentDownload(selectedFragment)}
          onFork={() => handleFragmentFork(selectedFragment)}
          onLike={() => handleFragmentLike(selectedFragment.id)}
        />
      )}
    </div>
  )
}
