'use client'

import React, { useState } from 'react'
import { LibraryFragment } from './fragment-library'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X, 
  Download, 
  GitFork, 
  Heart, 
  Star, 
  User, 
  Calendar, 
  Clock, 
  Code, 
  ExternalLink,
  Github,
  Share,
  Flag,
  Eye,
  Package,
  Zap,
  Globe,
  FileText,
  Database
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FragmentDetailProps {
  fragment: LibraryFragment
  onClose: () => void
  onDownload: () => void
  onFork: () => void
  onLike: () => void
}

const getTemplateIcon = (template: string) => {
  switch (template) {
    case 'code-interpreter-v1':
      return <Code className="w-5 h-5" />
    case 'nextjs-developer':
      return <Globe className="w-5 h-5" />
    case 'vue-developer':
      return <Globe className="w-5 h-5" />
    case 'streamlit-developer':
      return <Zap className="w-5 h-5" />
    case 'gradio-developer':
      return <Zap className="w-5 h-5" />
    case 'bolt.diy':
      return <FileText className="w-5 h-5" />
    default:
      return <Database className="w-5 h-5" />
  }
}

const getLanguageFromTemplate = (template: string): string => {
  switch (template) {
    case 'streamlit-developer':
    case 'gradio-developer':
    case 'code-interpreter-v1':
      return 'python'
    case 'nextjs-developer':
      return 'typescript'
    case 'vue-developer':
      return 'vue'
    default:
      return 'text'
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export function FragmentDetail({ 
  fragment, 
  onClose, 
  onDownload, 
  onFork, 
  onLike 
}: FragmentDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/fragments/${fragment.id}`
    navigator.clipboard.writeText(shareUrl)
    // Toast notification would go here
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
              {getTemplateIcon(fragment.template)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{fragment.title}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>{fragment.author}</span>
                <span>•</span>
                <span>v{fragment.version}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onLike}
              className="gap-1"
            >
              <Heart className={`w-4 h-4 ${fragment.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {fragment.likes}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1"
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onFork}
              className="gap-1"
            >
              <GitFork className="w-4 h-4" />
              Fork
            </Button>
            
            <Button
              onClick={onDownload}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              Use Fragment
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="demo">Demo</TabsTrigger>
                  <TabsTrigger value="changelog">Changelog</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="flex-1 p-6">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Description</h3>
                      <p className="text-gray-700 dark:text-gray-300">{fragment.description}</p>
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {fragment.tags.map(tag => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Dependencies */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Dependencies</h3>
                      <div className="space-y-2">
                        {fragment.dependencies.map(dep => (
                          <div key={dep} className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {dep}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Usage Instructions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Usage Instructions</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          1. Click &quot;Use Fragment&quot; to add this fragment to your workspace
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          2. Customize the code to fit your needs
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          3. Execute the fragment in your chosen environment
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="code" className="flex-1 p-6">
                <div className="h-full">
                  <SyntaxHighlighter
                    language={getLanguageFromTemplate(fragment.template)}
                    style={vscDarkPlus}
                    className="h-full rounded-lg"
                    showLineNumbers
                  >
                    {fragment.code}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>

              <TabsContent value="demo" className="flex-1 p-6">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    {fragment.demoUrl ? (
                      <div className="space-y-4">
                        <Eye className="w-16 h-16 mx-auto text-gray-400" />
                        <h3 className="text-lg font-semibold">Live Demo Available</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          View the live demo to see this fragment in action
                        </p>
                        <Button
                          onClick={() => window.open(fragment.demoUrl, '_blank')}
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Demo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Eye className="w-16 h-16 mx-auto text-gray-400" />
                        <h3 className="text-lg font-semibold">No Demo Available</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          This fragment does not have a live demo yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="changelog" className="flex-1 p-6">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Version History</h3>
                    
                    <div className="space-y-3">
                      <div className="border-l-2 border-blue-500 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">v{fragment.version}</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(fragment.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {fragment.changelog || 'Latest version'}
                        </p>
                      </div>
                      
                      {/* Mock previous versions */}
                      <div className="border-l-2 border-gray-300 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">v1.0.0</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(fragment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Initial release
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Downloads</span>
                    </div>
                    <span className="font-semibold">{fragment.downloads}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Likes</span>
                    </div>
                    <span className="font-semibold">{fragment.likes}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitFork className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Forks</span>
                    </div>
                    <span className="font-semibold">{fragment.forks}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Rating</span>
                    </div>
                    <span className="font-semibold">{fragment.rating}/5</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <p className="text-sm">{fragment.category}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Difficulty
                    </label>
                    <Badge className={`text-xs ${getDifficultyColor(fragment.difficulty)}`}>
                      {fragment.difficulty}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estimated Time
                    </label>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-sm">{fragment.estimatedTime}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Template
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {fragment.template}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created
                    </label>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-sm">
                        {new Date(fragment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Updated
                    </label>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-sm">
                        {new Date(fragment.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fragment.githubUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => window.open(fragment.githubUrl, '_blank')}
                    >
                      <Github className="w-4 h-4" />
                      View on GitHub
                    </Button>
                  )}
                  
                  {fragment.demoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => window.open(fragment.demoUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {/* Report fragment */}}
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}