'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import templatesData from '@/lib/templates.json'
import { validateTemplateSelection } from '@/lib/schema'

interface TemplateDebuggerProps {
  selectedTemplate: string
  onTemplateChange: (template: string) => void
}

export function TemplateDebugger({ selectedTemplate, onTemplateChange }: TemplateDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const validation = validateTemplateSelection(selectedTemplate)
    const templateConfig = templatesData[selectedTemplate as keyof typeof templatesData]
    
    setDebugInfo({
      selectedTemplate,
      isValid: validation.isValid,
      validationReason: validation.reason,
      availableTemplates: Object.keys(templatesData),
      templateConfig,
      schemaEnumValues: Object.keys(templatesData),
      timestamp: new Date().toISOString()
    })
  }, [selectedTemplate])

  const testTemplateGeneration = async (template: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Create a simple hello world app' }],
          selectedTemplate: template,
          config: { model: 'claude-3-5-sonnet-20241022', temperature: 0.1 }
        })
      })
      
      const data = await response.json()
      console.log(`Template ${template} test:`, data)
      return { success: response.ok, data }
    } catch (error) {
      console.error(`Template ${template} test failed:`, error)
      return { success: false, error }
    }
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          🔧 Debug Templates
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Template Debugger</CardTitle>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {debugInfo && (
            <>
              {/* Current Selection */}
              <div>
                <div className="font-semibold">Current Selection:</div>
                <div className="flex items-center gap-2">
                  <Badge variant={debugInfo.isValid ? "default" : "destructive"}>
                    {debugInfo.selectedTemplate}
                  </Badge>
                  {debugInfo.isValid ? "✅" : "❌"}
                </div>
                {!debugInfo.isValid && (
                  <div className="text-red-600 text-xs mt-1">
                    {debugInfo.validationReason}
                  </div>
                )}
              </div>

              {/* Available Templates */}
              <div>
                <div className="font-semibold mb-1">Available Templates:</div>
                <div className="grid grid-cols-2 gap-1">
                  {debugInfo.availableTemplates.map((template: string) => (
                    <Button
                      key={template}
                      onClick={() => onTemplateChange(template)}
                      variant={template === selectedTemplate ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-6"
                    >
                      {template.replace('-developer', '')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Template Config */}
              <div>
                <div className="font-semibold">Template Config:</div>
                <div className="bg-muted p-2 rounded text-xs max-h-20 overflow-y-auto">
                  <pre>{JSON.stringify(debugInfo.templateConfig, null, 2)}</pre>
                </div>
              </div>

              {/* Quick Tests */}
              <div>
                <div className="font-semibold mb-1">Quick Tests:</div>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    onClick={() => testTemplateGeneration(selectedTemplate)}
                    size="sm"
                    className="text-xs h-6"
                  >
                    Test Current
                  </Button>
                  <Button
                    onClick={() => {
                      debugInfo.availableTemplates.forEach((template: string) => {
                        setTimeout(() => testTemplateGeneration(template), Math.random() * 1000)
                      })
                    }}
                    size="sm"
                    variant="outline"
                    className="text-xs h-6"
                  >
                    Test All
                  </Button>
                </div>
              </div>

              {/* Schema Validation */}
              <div>
                <div className="font-semibold">Schema Enum Values:</div>
                <div className="text-xs text-muted-foreground">
                  {debugInfo.schemaEnumValues.join(', ')}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}