"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Star, 
  Code, 
  Palette, 
  Database, 
  BarChart3, 
  Globe, 
  Smartphone,
  Server,
  ExternalLink,
  Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProjectTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  language: string;
  framework: string;
  tags: string[];
  config: {
    template: string;
    features: string[];
  };
  is_official: boolean;
  is_featured: boolean;
  usage_count: number;
  thumbnail_url?: string;
  demo_url?: string;
  documentation_url?: string;
}

interface ProjectTemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  web: <Globe className="h-5 w-5" />,
  mobile: <Smartphone className="h-5 w-5" />,
  api: <Server className="h-5 w-5" />,
  data: <BarChart3 className="h-5 w-5" />,
  library: <Code className="h-5 w-5" />,
  marketing: <Palette className="h-5 w-5" />,
  database: <Database className="h-5 w-5" />
};

const FRAMEWORK_COLORS: Record<string, string> = {
  nextjs: "bg-black text-white",
  react: "bg-blue-500 text-white",
  vue: "bg-green-500 text-white",
  fastapi: "bg-emerald-600 text-white",
  streamlit: "bg-red-500 text-white",
  python: "bg-yellow-500 text-black"
};

// Sample templates (in production, this would come from the database)
const SAMPLE_TEMPLATES: ProjectTemplate[] = [
  {
    id: "nextjs-app",
    name: "nextjs-app",
    display_name: "Next.js Application",
    description: "Modern React application with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui components. Perfect for building fast, SEO-friendly web applications.",
    category: "web",
    language: "typescript",
    framework: "nextjs",
    tags: ["typescript", "tailwind", "app-router", "ssr", "seo"],
    config: {
      template: "nextjs-developer",
      features: ["typescript", "tailwind", "app-router", "shadcn-ui"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 1250,
    demo_url: "https://nextjs-template-demo.vercel.app"
  },
  {
    id: "react-component",
    name: "react-component",
    display_name: "React Component Library",
    description: "Reusable React component library with TypeScript, Storybook for documentation, and comprehensive testing setup.",
    category: "library",
    language: "typescript",
    framework: "react",
    tags: ["components", "storybook", "testing", "npm-package"],
    config: {
      template: "nextjs-developer",
      features: ["components", "storybook", "testing", "rollup"]
    },
    is_official: true,
    is_featured: false,
    usage_count: 450
  },
  {
    id: "vue-app",
    name: "vue-app",
    display_name: "Vue.js Application",
    description: "Modern Vue 3 application with Composition API, Vite build tool, TypeScript support, and Vuetify components.",
    category: "web",
    language: "typescript",
    framework: "vue",
    tags: ["vue3", "composition-api", "vite", "vuetify"],
    config: {
      template: "vue-developer",
      features: ["vue3", "composition-api", "vite", "typescript"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 780
  },
  {
    id: "python-api",
    name: "python-api",
    display_name: "FastAPI Backend",
    description: "High-performance Python API with FastAPI, async support, automatic OpenAPI documentation, and PostgreSQL integration.",
    category: "api",
    language: "python",
    framework: "fastapi",
    tags: ["fastapi", "async", "openapi", "postgresql", "uvicorn"],
    config: {
      template: "code-interpreter-v1",
      features: ["fastapi", "async", "openapi", "database"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 920
  },
  {
    id: "streamlit-dashboard",
    name: "streamlit-app",
    display_name: "Streamlit Dashboard",
    description: "Interactive data dashboard with Streamlit, Plotly charts, pandas data processing, and machine learning integration.",
    category: "data",
    language: "python",
    framework: "streamlit",
    tags: ["dashboard", "charts", "data-analysis", "ml", "plotly"],
    config: {
      template: "streamlit-developer",
      features: ["dashboard", "charts", "ml", "data-processing"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 650
  },
  {
    id: "landing-page",
    name: "landing-page",
    display_name: "Landing Page",
    description: "High-converting landing page with modern design, SEO optimization, analytics integration, and conversion tracking.",
    category: "marketing",
    language: "typescript",
    framework: "nextjs",
    tags: ["landing", "seo", "conversion", "analytics", "marketing"],
    config: {
      template: "nextjs-developer",
      features: ["landing", "seo", "conversion", "analytics"]
    },
    is_official: true,
    is_featured: false,
    usage_count: 380
  },
  {
    id: "mobile-app",
    name: "react-native-app",
    display_name: "React Native App",
    description: "Cross-platform mobile application with React Native, Expo, TypeScript, and native device integrations.",
    category: "mobile",
    language: "typescript",
    framework: "react-native",
    tags: ["mobile", "expo", "cross-platform", "ios", "android"],
    config: {
      template: "nextjs-developer", // Adapted for React Native
      features: ["expo", "navigation", "async-storage", "push-notifications"]
    },
    is_official: true,
    is_featured: false,
    usage_count: 290
  },
  {
    id: "fullstack-app",
    name: "fullstack-app",
    display_name: "Full-Stack Application",
    description: "Complete full-stack application with Next.js frontend, FastAPI backend, PostgreSQL database, and deployment ready.",
    category: "web",
    language: "typescript",
    framework: "nextjs",
    tags: ["fullstack", "nextjs", "fastapi", "postgresql", "deployment"],
    config: {
      template: "nextjs-developer",
      features: ["frontend", "backend", "database", "auth", "deployment"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 560
  }
];

export function ProjectTemplateSelector({ selectedTemplate, onTemplateSelect }: ProjectTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/project-templates");
      if (!response.ok) {
        throw new Error("Failed to load templates");
      }
      
      const { templates } = await response.json();
      setTemplates(templates || SAMPLE_TEMPLATES);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
      // Fallback to sample data
      setTemplates(SAMPLE_TEMPLATES);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = Array.from(new Set(templates.map(t => t.category)));
    return cats.sort();
  }, [templates]);

  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        template.framework.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Sort by featured, then by usage count
    return filtered.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return b.usage_count - a.usage_count;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId === selectedTemplate ? "" : templateId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium">Choose a Template</div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">Choose a Template (Optional)</div>
        <div className="text-xs text-muted-foreground">
          Start with a pre-configured template or create from scratch
        </div>
      </div>

      {error && (
        <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Category Tabs */}
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {categories.slice(0, 7).map(category => (
              <TabsTrigger key={category} value={category} className="text-xs capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Templates Grid */}
          <div className="max-h-96 overflow-y-auto">
            <TabsContent value="all" className="mt-0">
              <TemplateGrid />
            </TabsContent>
            {categories.map(category => (
              <TabsContent key={category} value={category} className="mt-0">
                <TemplateGrid />
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>

      {/* No Template Option */}
      <Card 
        className={`cursor-pointer transition-all ${
          !selectedTemplate ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"
        }`}
        onClick={() => onTemplateSelect("")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <Code className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium">Start from Scratch</div>
                <div className="text-sm text-muted-foreground">Create an empty project</div>
              </div>
            </div>
            {!selectedTemplate && <Check className="h-4 w-4 text-primary" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function TemplateGrid() {
    if (filteredTemplates.length === 0) {
      return (
        <div className="text-center py-8">
          <Code className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No templates found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id ? "ring-2 ring-primary bg-primary/5" : ""
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {TEMPLATE_ICONS[template.category] || <Code className="h-5 w-5" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{template.display_name}</h4>
                        {template.is_featured && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${FRAMEWORK_COLORS[template.framework] || "bg-gray-500 text-white"}`}
                        >
                          {template.framework}
                        </Badge>
                        {template.is_official && (
                          <Badge variant="outline" className="text-xs">
                            Official
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{template.usage_count.toLocaleString()} uses</span>
                  <div className="flex items-center gap-2">
                    {template.demo_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(template.demo_url, "_blank");
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Demo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}