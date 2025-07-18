'use client'

import React from 'react'
import { LibraryFragment } from './fragment-library'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Download, 
  Star, 
  GitFork, 
  Eye, 
  Clock, 
  User,
  Code,
  Globe,
  Zap,
  FileText,
  Database
} from 'lucide-react'

interface FragmentCardProps {
  fragment: LibraryFragment
  onSelect: () => void
  onLike: () => void
  onDownload: () => void
  onFork: () => void
}

const getTemplateIcon = (template: string) => {
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
      return <Database className="w-4 h-4" />
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

export function FragmentCard({ 
  fragment, 
  onSelect, 
  onLike, 
  onDownload, 
  onFork 
}: FragmentCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    onSelect()
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 relative group"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
              {getTemplateIcon(fragment.template)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {fragment.title}
              </CardTitle>
              <div className="flex items-center gap-1 mt-1">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {fragment.author}
                </span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onLike()
            }}
          >
            <Heart 
              className={`w-4 h-4 ${fragment.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {fragment.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {fragment.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {fragment.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{fragment.tags.length - 3}
            </Badge>
          )}
        </div>
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{fragment.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{fragment.downloads}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              <span>{fragment.forks}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{fragment.estimatedTime}</span>
          </div>
        </div>
        
        {/* Category and Difficulty */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="text-xs">
            {fragment.category}
          </Badge>
          <Badge className={`text-xs ${getDifficultyColor(fragment.difficulty)}`}>
            {fragment.difficulty}
          </Badge>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <Eye className="w-3 h-3" />
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
            }}
          >
            <Download className="w-3 h-3" />
            Use
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={(e) => {
              e.stopPropagation()
              onFork()
            }}
          >
            <GitFork className="w-3 h-3" />
            Fork
          </Button>
        </div>
      </CardContent>
      
      {/* Template badge */}
      <div className="absolute top-2 right-2">
        <Badge variant="outline" className="text-xs">
          {fragment.template}
        </Badge>
      </div>
      
      {/* Version */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
        v{fragment.version}
      </div>
    </Card>
  )
}