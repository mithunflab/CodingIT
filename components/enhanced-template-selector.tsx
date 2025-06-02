"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Code, Smartphone, Monitor, Server, Database, Zap, TestTube, FileText, Sparkles } from "lucide-react"
import type { EnhancedTemplate } from "@/lib/templates"

interface EnhancedTemplateSelectorProps {
  templates: EnhancedTemplate[]
  selectedTemplate: string
  onTemplateSelect: (templateId: string) => void
  onCreateCustom?: () => void
}

const categoryIcons = {
  web: <Monitor className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  desktop: <Monitor className="h-4 w-4" />,
  api: <Server className="h-4 w-4" />,
  data: <Database className="h-4 w-4" />,
  ai: <Brain className="h-4 w-4" />,
  devops: <Zap className="h-4 w-4" />,
}

const complexityColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
}

export function EnhancedTemplateSelector({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onCreateCustom,
}: EnhancedTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", ...new Set(templates.map((t) => t.category))]
  const filteredTemplates =
    selectedCategory === "all" ? templates : templates.filter((t) => t.category === selectedCategory)

  const getAICapabilityIcon = (type: string) => {
    const icons = {
      analysis: <Code className="h-3 w-3" />,
      generation: <Sparkles className="h-3 w-3" />,
      optimization: <Zap className="h-3 w-3" />,
      debugging: <TestTube className="h-3 w-3" />,
      testing: <TestTube className="h-3 w-3" />,
      documentation: <FileText className="h-3 w-3" />,
    }
    return icons[type as keyof typeof icons] || <Brain className="h-3 w-3" />
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Enhanced AI Templates
        </CardTitle>
        <CardDescription>Choose from AI-powered templates with comprehensive development capabilities</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.slice(1).map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {categoryIcons[category as keyof typeof categoryIcons]}
                <span className="ml-1 hidden sm:inline">{category}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <ScrollArea className="h-[60vh]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => onTemplateSelect(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {categoryIcons[template.category as keyof typeof categoryIcons]}
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <Badge className={complexityColors[template.complexity]}>{template.complexity}</Badge>
                      </div>
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Technologies */}
                      <div>
                        <h4 className="text-xs font-medium mb-1">Technologies</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.technologies.slice(0, 3).map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {template.technologies.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.technologies.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* AI Capabilities */}
                      <div>
                        <h4 className="text-xs font-medium mb-1">AI Capabilities</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.aiCapabilities
                            .filter((cap) => cap.enabled)
                            .slice(0, 4)
                            .map((capability) => (
                              <Badge
                                key={capability.type}
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                              >
                                {getAICapabilityIcon(capability.type)}
                                {capability.type}
                              </Badge>
                            ))}
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <h4 className="text-xs font-medium mb-1">Features</h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {template.features.slice(0, 3).map((feature) => (
                            <li key={feature} className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-current rounded-full" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Architecture Pattern */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Architecture:</span>
                          <Badge variant="outline" className="text-xs">
                            {template.architecture.pattern}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Custom Template Card */}
                {onCreateCustom && (
                  <Card
                    className="cursor-pointer transition-all hover:shadow-md border-dashed border-2"
                    onClick={onCreateCustom}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                      <CardTitle className="text-lg mb-2">Create Custom Template</CardTitle>
                      <CardDescription>
                        Let AI create a custom template based on your specific requirements
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}