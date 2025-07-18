'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Star, 
  Download, 
  TrendingUp, 
  Clock, 
  User, 
  Package,
  Zap,
  Code,
  Globe,
  Database,
  Brain,
  Palette,
  Settings,
  ShoppingCart,
  Crown,
  Gift
} from 'lucide-react'

interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  templates: MarketplaceTemplate[]
}

interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  author: string
  authorId: string
  price: number
  originalPrice?: number
  rating: number
  downloads: number
  tags: string[]
  thumbnailUrl: string
  previewUrl?: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  lastUpdated: string
  isPremium: boolean
  isNew: boolean
  isOnSale: boolean
  features: string[]
  requirements: string[]
  compatibility: string[]
}

const templateCategories: TemplateCategory[] = [
  {
    id: 'data-science',
    name: 'Data Science',
    description: 'Advanced analytics and machine learning templates',
    icon: <Brain className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    templates: [
      {
        id: 'ml-pipeline',
        name: 'Complete ML Pipeline',
        description: 'End-to-end machine learning pipeline with data preprocessing, model training, and deployment',
        author: 'AI Solutions',
        authorId: 'ai-solutions',
        price: 29.99,
        originalPrice: 39.99,
        rating: 4.9,
        downloads: 1250,
        tags: ['machine-learning', 'pipeline', 'deployment', 'scikit-learn'],
        thumbnailUrl: '/api/placeholder/300/200',
        previewUrl: 'https://example.com/ml-pipeline-demo',
        category: 'Data Science',
        difficulty: 'advanced',
        lastUpdated: '2024-01-15',
        isPremium: true,
        isNew: false,
        isOnSale: true,
        features: [
          'Automated data preprocessing',
          'Model selection and hyperparameter tuning',
          'Production-ready deployment',
          'Comprehensive documentation'
        ],
        requirements: ['Python 3.8+', 'scikit-learn', 'pandas', 'numpy'],
        compatibility: ['streamlit-developer', 'gradio-developer']
      },
      {
        id: 'time-series',
        name: 'Time Series Analysis Suite',
        description: 'Comprehensive time series forecasting and analysis tools',
        author: 'Data Analytics Pro',
        authorId: 'data-pro',
        price: 24.99,
        rating: 4.7,
        downloads: 890,
        tags: ['time-series', 'forecasting', 'analysis', 'prophet'],
        thumbnailUrl: '/api/placeholder/300/200',
        category: 'Data Science',
        difficulty: 'intermediate',
        lastUpdated: '2024-01-10',
        isPremium: true,
        isNew: true,
        isOnSale: false,
        features: [
          'Multiple forecasting algorithms',
          'Interactive visualizations',
          'Seasonal decomposition',
          'Anomaly detection'
        ],
        requirements: ['Python 3.7+', 'prophet', 'plotly', 'pandas'],
        compatibility: ['streamlit-developer', 'code-interpreter-v1']
      }
    ]
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Modern web application templates and components',
    icon: <Globe className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    templates: [
      {
        id: 'saas-starter',
        name: 'SaaS Starter Kit',
        description: 'Complete SaaS application with authentication, billing, and dashboard',
        author: 'WebDev Masters',
        authorId: 'webdev-masters',
        price: 49.99,
        originalPrice: 69.99,
        rating: 4.8,
        downloads: 2100,
        tags: ['saas', 'authentication', 'billing', 'dashboard', 'nextjs'],
        thumbnailUrl: '/api/placeholder/300/200',
        previewUrl: 'https://example.com/saas-demo',
        category: 'Web Development',
        difficulty: 'advanced',
        lastUpdated: '2024-01-20',
        isPremium: true,
        isNew: false,
        isOnSale: true,
        features: [
          'User authentication & authorization',
          'Subscription billing integration',
          'Admin dashboard',
          'API documentation',
          'Email templates'
        ],
        requirements: ['Node.js 16+', 'Next.js 13+', 'Supabase', 'Stripe'],
        compatibility: ['nextjs-developer']
      },
      {
        id: 'ecommerce-components',
        name: 'E-commerce Components',
        description: 'Reusable e-commerce components for building online stores',
        author: 'Commerce Solutions',
        authorId: 'commerce-solutions',
        price: 19.99,
        rating: 4.6,
        downloads: 1580,
        tags: ['ecommerce', 'components', 'shopping', 'cart', 'checkout'],
        thumbnailUrl: '/api/placeholder/300/200',
        category: 'Web Development',
        difficulty: 'intermediate',
        lastUpdated: '2024-01-12',
        isPremium: true,
        isNew: true,
        isOnSale: false,
        features: [
          'Product catalog components',
          'Shopping cart functionality',
          'Checkout process',
          'Payment integration'
        ],
        requirements: ['React 18+', 'TypeScript', 'Tailwind CSS'],
        compatibility: ['nextjs-developer', 'vue-developer']
      }
    ]
  },
  {
    id: 'design-systems',
    name: 'Design Systems',
    description: 'Professional UI components and design systems',
    icon: <Palette className="w-5 h-5" />,
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    templates: [
      {
        id: 'enterprise-ui',
        name: 'Enterprise UI Kit',
        description: 'Complete enterprise-grade UI component library',
        author: 'Design Systems Inc',
        authorId: 'design-systems',
        price: 39.99,
        rating: 4.9,
        downloads: 950,
        tags: ['ui-kit', 'components', 'enterprise', 'design-system'],
        thumbnailUrl: '/api/placeholder/300/200',
        previewUrl: 'https://example.com/ui-kit-demo',
        category: 'Design Systems',
        difficulty: 'intermediate',
        lastUpdated: '2024-01-18',
        isPremium: true,
        isNew: false,
        isOnSale: false,
        features: [
          '100+ UI components',
          'Dark mode support',
          'Accessibility compliant',
          'Figma design files included'
        ],
        requirements: ['React 17+', 'Styled Components', 'TypeScript'],
        compatibility: ['nextjs-developer', 'vue-developer']
      }
    ]
  },
  {
    id: 'free-templates',
    name: 'Free Templates',
    description: 'High-quality free templates for everyone',
    icon: <Gift className="w-5 h-5" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    templates: [
      {
        id: 'basic-dashboard',
        name: 'Basic Dashboard',
        description: 'Simple dashboard template with charts and metrics',
        author: 'Community',
        authorId: 'community',
        price: 0,
        rating: 4.3,
        downloads: 3200,
        tags: ['dashboard', 'charts', 'metrics', 'free'],
        thumbnailUrl: '/api/placeholder/300/200',
        previewUrl: 'https://example.com/dashboard-demo',
        category: 'Free Templates',
        difficulty: 'beginner',
        lastUpdated: '2024-01-08',
        isPremium: false,
        isNew: false,
        isOnSale: false,
        features: [
          'Responsive design',
          'Chart.js integration',
          'Basic authentication',
          'Mobile friendly'
        ],
        requirements: ['React 16+', 'Chart.js'],
        compatibility: ['nextjs-developer', 'vue-developer']
      },
      {
        id: 'portfolio-site',
        name: 'Portfolio Website',
        description: 'Modern portfolio website template for developers',
        author: 'Community',
        authorId: 'community',
        price: 0,
        rating: 4.1,
        downloads: 2800,
        tags: ['portfolio', 'website', 'developer', 'free'],
        thumbnailUrl: '/api/placeholder/300/200',
        category: 'Free Templates',
        difficulty: 'beginner',
        lastUpdated: '2024-01-05',
        isPremium: false,
        isNew: false,
        isOnSale: false,
        features: [
          'Responsive design',
          'Project showcase',
          'Contact form',
          'SEO optimized'
        ],
        requirements: ['Next.js 12+', 'Tailwind CSS'],
        compatibility: ['nextjs-developer']
      }
    ]
  }
]

export function TemplateMarketplace() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'price'>('popular')

  const allTemplates = templateCategories.flatMap(category => category.templates)

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory
    
    return matchesSearch && matchesCategory
  })

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads
      case 'recent':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'rating':
        return b.rating - a.rating
      case 'price':
        return a.price - b.price
      default:
        return 0
    }
  })

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Marketplace</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover premium templates and components to accelerate your development
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="rating">Highest Rated</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory('all')}
        >
          All Templates
        </Button>
        {templateCategories.map(category => (
          <Button
            key={category.id}
            variant={activeCategory === category.name ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(category.name)}
            className="gap-2 whitespace-nowrap"
          >
            {category.icon}
            {category.name}
          </Button>
        ))}
      </div>

      {/* Featured Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Featured Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTemplates.slice(0, 3).map(template => (
            <Card key={template.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              {template.isNew && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-blue-500 text-white">New</Badge>
                </div>
              )}
              
              {template.isPremium && (
                <div className="absolute top-2 right-2 z-10">
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
              )}
              
              {template.isOnSale && (
                <div className="absolute top-8 right-2 z-10">
                  <Badge className="bg-red-500 text-white">Sale</Badge>
                </div>
              )}
              
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{template.name}</h4>
                  <div className="text-right">
                    {template.price === 0 ? (
                      <span className="font-bold text-green-600">Free</span>
                    ) : (
                      <div>
                        <span className="font-bold text-lg">${template.price}</span>
                        {template.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-1">
                            ${template.originalPrice}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {template.description}
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{template.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{template.downloads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{template.author}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(template.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1 gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    {template.price === 0 ? 'Download' : 'Buy Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* All Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">All Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedTemplates.map(template => (
            <Card key={template.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              {template.isNew && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                </div>
              )}
              
              {template.isPremium && (
                <div className="absolute top-2 right-2 z-10">
                  <Crown className="w-4 h-4 text-yellow-500" />
                </div>
              )}
              
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                  <div className="text-right">
                    {template.price === 0 ? (
                      <span className="font-bold text-green-600 text-sm">Free</span>
                    ) : (
                      <span className="font-bold text-sm">${template.price}</span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-medium">{template.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3 text-gray-500" />
                    <span className="text-xs">{template.downloads}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1 text-xs gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    {template.price === 0 ? 'Get' : 'Buy'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}