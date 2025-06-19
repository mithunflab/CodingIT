"use client"

import { DeployDialog } from './deploy-dialog'
import { FragmentCode } from './fragment-code'
import { FragmentWeb } from './fragment-web'
import { CursorLikeEditor } from './live-code-editor'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult, ExecutionResultWeb } from '@/lib/types'
import { DeepPartial } from 'ai'
import { 
  ChevronsRight, 
  LoaderCircle, 
  Code, 
  Globe, 
  Edit3,
  Bot,
  Sparkles,
  Zap,
  Terminal,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Split,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { Dispatch, SetStateAction, useState, useCallback, useMemo } from 'react'

export function Preview({
  teamID,
  accessToken,
  selectedTab,
  onSelectedTabChange,
  isChatLoading,
  isPreviewLoading,
  fragment,
  result,
  onClose,
}: {
  teamID: string | undefined
  accessToken: string | undefined
  selectedTab: 'preview' | 'editor'
  onSelectedTabChange: Dispatch<SetStateAction<'preview' | 'editor'>>
  isChatLoading: boolean
  isPreviewLoading: boolean
  fragment?: DeepPartial<FragmentSchema>
  result?: ExecutionResult
  onClose: () => void
}) {
  const [isLiveEditorEnabled, setIsLiveEditorEnabled] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [editorLayout, setEditorLayout] = useState<'full' | 'split'>('full')
  const [showSidebar, setShowSidebar] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleFileUpdate = useCallback((filePath: string, content: string) => {
    console.log(`File updated: ${filePath}`)
    if (result && 'url' in result) {
      const iframe = document.querySelector('iframe[src*="' + new URL(result.url).hostname + '"]') as HTMLIFrameElement
      if (iframe) {
        iframe.src = iframe.src.split('?')[0] + '?_t=' + Date.now()
      }
    }
  }, [result])

  const handleAICodeRequest = useCallback(async (request: string, context?: any) => {
    // Handle AI code generation requests
    console.log('AI Code Request:', request, context)
    // This would integrate with the AI completion API
  }, [])

  // Enhanced tab configuration
  const tabConfig = useMemo(() => [
    {
      id: 'preview' as const,
      label: 'Live Preview',
      icon: <Globe className="w-4 h-4" />,
      description: 'See your app running live'
    },
    {
      id: 'editor' as const,
      label: 'Cursor Editor',
      icon: <Edit3 className="w-4 h-4" />,
      description: 'AI-powered code editing experience',
      badge: 'AI Enhanced'
    }
  ], [])

  const activeTabConfig = tabConfig.find(tab => tab.id === selectedTab)

  if (!fragment) {
    return null
  }

  const isLinkAvailable = result?.template !== 'code-interpreter-v1'

  const fragmentFiles = fragment.files?.map(file => {
    if (!file) return undefined
    return {
      name: file.file_name || file.file_path?.split('/').pop() || 'untitled',
      content: file.file_content || '',
      path: file.file_path || file.file_name || 'untitled'
    }
  }).filter((file): file is { name: string; content: string; path: string } => !!file && !!file.content && !file.content.includes('__pycache__'))

  const sandboxId = result && 'sbxId' in result ? result.sbxId : undefined

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ChevronsRight 
              className="w-5 h-5 cursor-pointer hover:text-primary transition-colors"
              onClick={onClose}
            />
            <h3 className="text-lg font-semibold">Code Preview</h3>
          </div>
          
          {activeTabConfig && (
            <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full">
              {activeTabConfig.icon}
              <span className="text-sm font-medium">{activeTabConfig.label}</span>
              {activeTabConfig.badge && (
                <Badge variant="secondary" className="text-xs">
                  {activeTabConfig.badge}
                </Badge>
              )}
            </div>
          )}

          {(isChatLoading || isPreviewLoading) && (
            <div className="flex items-center gap-2">
              <LoaderCircle className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {isChatLoading ? 'Generating...' : 'Loading preview...'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Editor-specific controls */}
          {selectedTab === 'editor' && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showSidebar ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowSidebar(!showSidebar)}
                    >
                      {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Sidebar</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={editorLayout === 'split' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEditorLayout(editorLayout === 'full' ? 'split' : 'full')}
                    >
                      <Split className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Split View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showAIAssistant ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowAIAssistant(!showAIAssistant)}
                      className="gap-1"
                    >
                      <Bot className="w-4 h-4" />
                      AI
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle AI Assistant</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          {/* Universal controls */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isLinkAvailable && result && 'url' in result && 'sbxId' in result && (
            <DeployDialog
              teamID={teamID}
              accessToken={accessToken}
              url={result.url}
              sbxId={result.sbxId}
            />
          )}
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <Tabs
        value={selectedTab}
        onValueChange={(value) => onSelectedTabChange(value as 'preview' | 'editor')}
        className="flex-1 flex flex-col"
      >
        <div className="border-b bg-muted/10">
          <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0">
            {tabConfig.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {tab.icon}
                <div className="flex flex-col items-start">
                  <span className="font-medium">{tab.label}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {tab.description}
                  </span>
                </div>
                {tab.badge && (
                  <Badge variant="outline" className="text-xs ml-2">
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="preview" className="h-full m-0">
            <FragmentWeb
              result={result as ExecutionResultWeb}
            />
          </TabsContent>

          <TabsContent value="editor" className="h-full m-0">
            <div className="h-full flex">
              {/* Enhanced Editor Layout */}
              {editorLayout === 'split' ? (
                <div className="flex w-full h-full">
                  <div className="flex-1">
                    <FragmentWeb
                      result={result as ExecutionResultWeb}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full">
                  <CursorLikeEditor
                    files={fragmentFiles || []}
                    sandboxId={sandboxId}
                    onFileUpdate={handleFileUpdate}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Floating Action Buttons for Editor Mode */}
      {selectedTab === 'editor' && !isFullscreen && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => setShowAIAssistant(true)}
                  className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">AI Assistant (Ctrl+K)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditorLayout(editorLayout === 'full' ? 'split' : 'full')}
                  className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
                >
                  {editorLayout === 'full' ? <Split className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {editorLayout === 'full' ? 'Split View' : 'Code Only'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Performance Indicators */}
      {selectedTab === 'editor' && (
        <div className="absolute top-20 right-4 z-30">
          <div className="bg-background/90 backdrop-blur border rounded-lg p-2 shadow-lg">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              {sandboxId && (
                <div className="flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  <span className="font-mono">{sandboxId.slice(0, 6)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
