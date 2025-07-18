'use client'

import React, { useState, useEffect } from 'react'
import { FragmentSchema } from '@/lib/schema'
import type { TemplateId } from '@/lib/templates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Eye, 
  Code, 
  FileText, 
  Play, 
  RefreshCw, 
  ExternalLink,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FragmentPreviewProps {
  fragment: Partial<FragmentSchema>
  template: TemplateId
}

export function FragmentPreview({ fragment, template }: FragmentPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>({ valid: true, errors: [], warnings: [] })

  const validateFragment = React.useCallback(async () => {
    setIsValidating(true)
    
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!fragment.title) {
      errors.push('Fragment title is required')
    }
    
    if (!fragment.code) {
      errors.push('Fragment code is required')
    } else {
      // Template-specific validation
      if (template === 'streamlit-developer') {
        if (!fragment.code.includes('import streamlit')) {
          warnings.push('Consider importing streamlit for better functionality')
        }
      }
      
      if (template === 'nextjs-developer') {
        if (!fragment.code.includes('export default')) {
          warnings.push('Consider adding a default export')
        }
      }
      
      if (template === 'code-interpreter-v1') {
        if (!fragment.code.includes('import')) {
          warnings.push('Consider adding imports for better functionality')
        }
      }
    }
    
    setValidationResults({
      valid: errors.length === 0,
      errors,
      warnings
    })
    setIsValidating(false)
  }, [fragment, template])

  useEffect(() => {
    validateFragment()
  }, [validateFragment])

  const renderPreview = () => {
    switch (template) {
      case 'streamlit-developer':
        return renderStreamlitPreview()
      case 'nextjs-developer':
        return renderNextjsPreview()
      case 'vue-developer':
        return renderVuePreview()
      case 'gradio-developer':
        return renderGradioPreview()
      case 'code-interpreter-v1':
        return renderPythonPreview()
      default:
        return renderGenericPreview()
    }
  }

  const renderStreamlitPreview = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Streamlit App Preview</h3>
        <div className="space-y-3">
          {fragment.code?.split('\n').map((line, index) => {
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('st.title(')) {
              const title = trimmedLine.match(/st\.title\((.*?)\)/)?.[1]?.replace(/['"]/g, '')
              return (
                <div key={index} className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {title}
                </div>
              )
            }
            if (trimmedLine.startsWith('st.header(')) {
              const header = trimmedLine.match(/st\.header\((.*?)\)/)?.[1]?.replace(/['"]/g, '')
              return (
                <div key={index} className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {header}
                </div>
              )
            }
            if (trimmedLine.startsWith('st.text(')) {
              const text = trimmedLine.match(/st\.text\((.*?)\)/)?.[1]?.replace(/['"]/g, '')
              return (
                <div key={index} className="text-base text-gray-700 dark:text-gray-300">
                  {text}
                </div>
              )
            }
            if (trimmedLine.startsWith('st.text_input(')) {
              const label = trimmedLine.match(/st\.text_input\((.*?)\)/)?.[1]?.replace(/['"]/g, '')
              return (
                <div key={index} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    placeholder="Enter text..."
                  />
                </div>
              )
            }
            if (trimmedLine.startsWith('st.button(')) {
              const buttonText = trimmedLine.match(/st\.button\((.*?)\)/)?.[1]?.replace(/['"]/g, '')
              return (
                <Button key={index} className="w-full">
                  {buttonText}
                </Button>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )

  const renderNextjsPreview = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Next.js Component Preview</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2" />
            <p>Interactive preview would render here</p>
            <p className="text-sm mt-1">Component structure and styling preview</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderVuePreview = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Vue Component Preview</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Zap className="w-12 h-12 mx-auto mb-2" />
            <p>Vue component preview would render here</p>
            <p className="text-sm mt-1">Template, script, and style preview</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderGradioPreview = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Gradio Interface Preview</h3>
        <div className="space-y-3">
          {fragment.code?.split('\n').map((line, index) => {
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('gr.Textbox(')) {
              const match = trimmedLine.match(/label="(.*?)"/)
              const label = match ? match[1] : 'Input'
              return (
                <div key={index} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    placeholder="Enter text..."
                  />
                </div>
              )
            }
            if (trimmedLine.startsWith('gr.Button(')) {
              const buttonText = trimmedLine.match(/gr\.Button\((.*?)\)/)?.[1]?.replace(/['"]/g, '')
              return (
                <Button key={index} className="w-full">
                  {buttonText}
                </Button>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )

  const renderPythonPreview = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Python Code Analysis</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Lines of Code</h4>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {fragment.code?.split('\n').length || 0}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <h4 className="font-medium text-green-900 dark:text-green-100">Functions</h4>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {(fragment.code ?? '').split('def ').length - 1}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium mb-2">Code Structure</h4>
            <div className="space-y-1 text-sm">
              {fragment.code?.split('\n').map((line, index) => {
                const trimmedLine = line.trim()
                if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('from ')) {
                  return (
                    <div key={index} className="text-purple-600 dark:text-purple-400">
                      📦 {trimmedLine}
                    </div>
                  )
                }
                if (trimmedLine.startsWith('def ')) {
                  return (
                    <div key={index} className="text-blue-600 dark:text-blue-400">
                      🔧 {trimmedLine}
                    </div>
                  )
                }
                if (trimmedLine.startsWith('class ')) {
                  return (
                    <div key={index} className="text-green-600 dark:text-green-400">
                      🏗️ {trimmedLine}
                    </div>
                  )
                }
                return null
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderGenericPreview = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Code Preview</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Code className="w-12 h-12 mx-auto mb-2" />
            <p>Generic code preview</p>
            <p className="text-sm mt-1">Preview not available for this template</p>
          </div>
        </div>
      </div>
    </div>
  )

  const getLanguageFromTemplate = (template: TemplateId): string => {
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

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Fragment Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{template}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={validateFragment}
                disabled={isValidating}
                className="gap-1"
              >
                {isValidating ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                Validate
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pb-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="flex-1 px-6 pb-6">
              <ScrollArea className="h-full">
                {renderPreview()}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="code" className="flex-1 px-6 pb-6">
              <div className="h-full">
                <SyntaxHighlighter
                  language={getLanguageFromTemplate(template)}
                  style={vscDarkPlus}
                  className="h-full rounded-lg"
                >
                  {fragment.code || '// No code to preview'}
                </SyntaxHighlighter>
              </div>
            </TabsContent>

            <TabsContent value="info" className="flex-1 px-6 pb-6">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {/* Fragment Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Fragment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Title
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {fragment.title || 'No title'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {fragment.description || 'No description'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Template
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {fragment.template}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Code Length
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {fragment.code?.length || 0} characters, {fragment.code?.split('\n').length || 0} lines
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Validation Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        {validationResults.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        Validation Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {validationResults.errors.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                            Errors ({validationResults.errors.length})
                          </h4>
                          <div className="space-y-1">
                            {validationResults.errors.map((error, index) => (
                              <div key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {validationResults.warnings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                            Warnings ({validationResults.warnings.length})
                          </h4>
                          <div className="space-y-1">
                            {validationResults.warnings.map((warning, index) => (
                              <div key={index} className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                {warning}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {validationResults.valid && validationResults.warnings.length === 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" />
                          Fragment is valid and ready to execute
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
