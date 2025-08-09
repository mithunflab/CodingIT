'use client'

import React, { useState, useCallback, useRef } from 'react'
import { FragmentSchema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ComponentLibrary } from './component-library'
import { FragmentPreview } from './fragment-preview'
import { CodeEditor } from './code-editor'
import { 
  Code, 
  Eye, 
  Save, 
  Play, 
  Settings, 
  Plus, 
  Layers,
  Palette,
  FileText,
  Zap
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface FragmentComposerProps {
  template: keyof Templates
  initialFragment?: Partial<FragmentSchema>
  onFragmentUpdate: (fragment: Partial<FragmentSchema>) => void
  onExecute: (fragment: Partial<FragmentSchema>) => void
  onSave: (fragment: Partial<FragmentSchema>) => void
}

export function FragmentComposer({
  template,
  initialFragment,
  onFragmentUpdate,
  onExecute,
  onSave
}: FragmentComposerProps) {
  const [fragment, setFragment] = useState<Partial<FragmentSchema>>(
    initialFragment || {
      template,
      code: '',
      title: '',
      description: ''
    }
  )
  const [activeTab, setActiveTab] = useState('compose')
  const [isExecuting, setIsExecuting] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState<any>(null)
  const [dropzones, setDropzones] = useState<any[]>([])
  const codeEditorRef = useRef<any>(null)

  const handleFragmentUpdate = useCallback((updates: Partial<FragmentSchema>) => {
    const updatedFragment = { ...fragment, ...updates }
    setFragment(updatedFragment)
    onFragmentUpdate(updatedFragment)
  }, [fragment, onFragmentUpdate])

  const handleCodeChange = useCallback((code: string) => {
    handleFragmentUpdate({ code })
  }, [handleFragmentUpdate])

  const handleDragStart = useCallback((component: any, event: React.DragEvent) => {
    setDraggedComponent(component)
    event.dataTransfer.setData('application/json', JSON.stringify(component))
    event.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback((event: React.DragEvent, dropzone: string) => {
    event.preventDefault()
    
    if (!draggedComponent) return

    const insertPosition = codeEditorRef.current?.getInsertPosition?.() || 0
    const componentCode = generateComponentCode(draggedComponent, template)
    
    const currentCode = fragment.code || ''
    const newCode = insertCodeAtPosition(currentCode, componentCode, insertPosition)
    
    handleFragmentUpdate({ code: newCode })
    setDraggedComponent(null)
    
    toast({
      title: "Component Added",
      description: `${draggedComponent.name} has been added to your fragment.`,
    })
  }, [draggedComponent, fragment.code, handleFragmentUpdate, template])

  const handleExecute = async () => {
    if (!fragment.code) {
      toast({
        title: "No Code to Execute",
        description: "Please add some code to execute.",
        variant: "destructive",
      })
      return
    }

    setIsExecuting(true)
    try {
      await onExecute(fragment)
      toast({
        title: "Fragment Executed",
        description: "Your fragment has been executed successfully.",
      })
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "An error occurred during execution.",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSave = () => {
    if (!fragment.title) {
      toast({
        title: "Title Required",
        description: "Please add a title to your fragment.",
        variant: "destructive",
      })
      return
    }

    onSave(fragment)
    toast({
      title: "Fragment Saved",
      description: "Your fragment has been saved successfully.",
    })
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Component Library Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <ComponentLibrary
          template={template}
          onComponentDragStart={handleDragStart}
          onComponentSelect={(component) => {
            const componentCode = generateComponentCode(component, template)
            const currentCode = fragment.code || ''
            const newCode = currentCode + '\n\n' + componentCode
            handleFragmentUpdate({ code: newCode })
          }}
        />
      </div>

      {/* Main Composer Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              <h1 className="text-lg font-semibold">Fragment Composer</h1>
              <Badge variant="outline">{template}</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('preview')}
                className="gap-1"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="gap-1"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              
              <Button
                onClick={handleExecute}
                disabled={isExecuting}
                className="gap-1"
              >
                {isExecuting ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="compose" className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Visual Composer */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Visual Composer
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div 
                    className="h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 relative"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'visual')}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Drag components here to compose your fragment</p>
                      </div>
                    </div>
                    
                    {/* Render dropped components */}
                    <div className="relative z-10">
                      {/* Component visualization would go here */}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Properties Panel */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fragment-title">Title</Label>
                        <Input
                          id="fragment-title"
                          value={fragment.title || ''}
                          onChange={(e) => handleFragmentUpdate({ title: e.target.value })}
                          placeholder="Enter fragment title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fragment-description">Description</Label>
                        <Textarea
                          id="fragment-description"
                          value={fragment.description || ''}
                          onChange={(e) => handleFragmentUpdate({ description: e.target.value })}
                          placeholder="Enter fragment description"
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{fragment.template}</Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getTemplateDescription(fragment.template as keyof Templates | undefined)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Code Lines</Label>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {fragment.code?.split('\n').length || 0} lines
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 p-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <CodeEditor
                  ref={codeEditorRef}
                  value={fragment.code || ''}
                  onChange={handleCodeChange}
                  language={getLanguageFromTemplate(template)}
                  template={template}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'code')}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 p-4">
            <FragmentPreview
              fragment={fragment}
              template={template}
            />
          </TabsContent>

          <TabsContent value="settings" className="flex-1 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Fragment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Auto-save</Label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Automatically save changes</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Syntax Highlighting</Label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Enable syntax highlighting</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Auto-completion</Label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Enable auto-completion</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Helper functions
function generateComponentCode(component: any, template: keyof Templates): string {
  switch (template) {
    case 'streamlit-developer':
      return generateStreamlitComponent(component)
    case 'nextjs-developer':
      return generateNextjsComponent(component)
    case 'vue-developer':
      return generateVueComponent(component)
    case 'gradio-developer':
      return generateGradioComponent(component)
    case 'code-interpreter-v1':
      return generatePythonComponent(component)
    default:
      return `# ${component.name}\n${component.code || ''}`
  }
}

function generateStreamlitComponent(component: any): string {
  switch (component.type) {
    case 'text':
      return `st.text("${component.props?.text || 'Hello World'}")`
    case 'title':
      return `st.title("${component.props?.title || 'Title'}")`
    case 'chart':
      return `st.line_chart(${component.props?.data || 'data'})`
    case 'input':
      return `${component.props?.variable || 'user_input'} = st.text_input("${component.props?.label || 'Enter text'}")`
    default:
      return component.code || ''
  }
}

function generateNextjsComponent(component: any): string {
  switch (component.type) {
    case 'div':
      return `<div className="${component.props?.className || ''}">\n  ${component.props?.children || ''}\n</div>`
    case 'button':
      return `<button onClick={${component.props?.onClick || '() => {}'}}>
  ${component.props?.children || 'Click me'}
</button>`
    case 'input':
      return `<input 
  type="${component.props?.type || 'text'}" 
  placeholder="${component.props?.placeholder || ''}"
  value={${component.props?.value || 'value'}}
  onChange={${component.props?.onChange || '() => {}'}}
/>`
    default:
      return component.code || ''
  }
}

function generateVueComponent(component: any): string {
  switch (component.type) {
    case 'div':
      return `<div class="${component.props?.class || ''}">\n  ${component.props?.children || ''}\n</div>`
    case 'button':
      return `<button @click="${component.props?.onClick || 'handleClick'}">
  ${component.props?.children || 'Click me'}
</button>`
    case 'input':
      return `<input 
  type="${component.props?.type || 'text'}" 
  placeholder="${component.props?.placeholder || ''}"
  v-model="${component.props?.model || 'inputValue'}"
/>`
    default:
      return component.code || ''
  }
}

function generateGradioComponent(component: any): string {
  switch (component.type) {
    case 'textbox':
      return `gr.Textbox(label="${component.props?.label || 'Input'}", placeholder="${component.props?.placeholder || ''}")`
    case 'button':
      return `gr.Button("${component.props?.label || 'Submit'}")`
    case 'image':
      return `gr.Image(label="${component.props?.label || 'Image'}")`
    case 'slider':
      return `gr.Slider(minimum=${component.props?.min || 0}, maximum=${component.props?.max || 100}, label="${component.props?.label || 'Slider'}")`
    default:
      return component.code || ''
  }
}

function generatePythonComponent(component: any): string {
  switch (component.type) {
    case 'import':
      return `import ${component.props?.module || 'module'}`
    case 'function':
      return `def ${component.props?.name || 'my_function'}():
    """${component.props?.docstring || 'Function description'}"""
    pass`
    case 'class':
      return `class ${component.props?.name || 'MyClass'}:
    """${component.props?.docstring || 'Class description'}"""
    
    def __init__(self):
        pass`
    case 'plot':
      return `plt.figure(figsize=(10, 6))
plt.plot(${component.props?.data || 'data'})
plt.title("${component.props?.title || 'Plot'}")
plt.show()`
    default:
      return component.code || ''
  }
}

function insertCodeAtPosition(currentCode: string, newCode: string, position: number): string {
  const lines = currentCode.split('\n')
  const insertLine = Math.min(position, lines.length)
  
  lines.splice(insertLine, 0, newCode)
  return lines.join('\n')
}

function getLanguageFromTemplate(template: keyof Templates): string {
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

function getTemplateDescription(template: keyof Templates | undefined): string {
  switch (template) {
    case 'streamlit-developer':
      return 'Interactive data applications'
    case 'nextjs-developer':
      return 'React web applications'
    case 'vue-developer':
      return 'Vue.js web applications'
    case 'gradio-developer':
      return 'Machine learning interfaces'
    case 'code-interpreter-v1':
      return 'Python code execution'
    default:
      return 'Unknown template'
  }
}