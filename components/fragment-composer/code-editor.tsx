'use client'

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Templates } from '@/lib/templates'
import { Editor } from '@monaco-editor/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Code, 
  Copy, 
  Download, 
  Upload, 
  Settings, 
  Maximize2, 
  Minimize2,
  Play,
  Palette,
  Zap,
  Search
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useFeatureFlag, useFeatureValue } from '@/hooks/use-edge-flags'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  template: keyof Templates
  onDragOver: (event: React.DragEvent) => void
  onDrop: (event: React.DragEvent) => void
}

export const CodeEditor = forwardRef<any, CodeEditorProps>(({
  value,
  onChange,
  language,
  template,
  onDragOver,
  onDrop
}, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark')
  const [fontSize, setFontSize] = useState(14)
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on')
  const [showMinimap, setShowMinimap] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const editorRef = useRef<any>(null)
  
  // Feature flags
  const { enabled: isEnhancedEditorEnabled } = useFeatureFlag('enhanced-code-editor', false)
  const { value: themeMode } = useFeatureValue<'basic' | 'advanced' | 'custom'>('editor-theme-mode', 'basic')

  useImperativeHandle(ref, () => ({
    getInsertPosition: () => {
      const editor = editorRef.current
      if (!editor) return 0
      
      const position = editor.getPosition()
      return position ? position.lineNumber : 0
    },
    insertCode: (code: string) => {
      const editor = editorRef.current
      if (!editor) return
      
      const position = editor.getPosition()
      const selection = editor.getSelection()
      
      editor.executeEdits('', [{
        range: selection,
        text: code
      }])
    },
    formatCode: () => {
      const editor = editorRef.current
      if (!editor) return
      
      editor.getAction('editor.action.formatDocument').run()
    }
  }))

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    
    // Set up event listeners
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      })
    })
    
    // Enable drag and drop
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue())
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    toast({
      title: "Code Copied",
      description: "Code has been copied to clipboard.",
    })
  }

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fragment.${getFileExtension(language)}`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Code Downloaded",
      description: "Code has been downloaded as a file.",
    })
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onChange(content)
      toast({
        title: "Code Uploaded",
        description: "Code has been loaded from file.",
      })
    }
    reader.readAsText(file)
  }

  const handleFormat = () => {
    const editor = editorRef.current
    if (!editor) return
    
    editor.getAction('editor.action.formatDocument').run()
    toast({
      title: "Code Formatted",
      description: "Code has been formatted.",
    })
  }

  const getFileExtension = (lang: string): string => {
    switch (lang) {
      case 'python':
        return 'py'
      case 'typescript':
        return 'ts'
      case 'javascript':
        return 'js'
      case 'vue':
        return 'vue'
      case 'html':
        return 'html'
      case 'css':
        return 'css'
      default:
        return 'txt'
    }
  }

  const getLanguageIcon = (lang: string) => {
    switch (lang) {
      case 'python':
        return '🐍'
      case 'typescript':
        return '📘'
      case 'javascript':
        return '📜'
      case 'vue':
        return '💚'
      case 'html':
        return '🌐'
      case 'css':
        return '🎨'
      default:
        return '📄'
    }
  }

  const editorOptions = {
    fontSize,
    wordWrap,
    minimap: { enabled: isEnhancedEditorEnabled ? showMinimap : false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    renderWhitespace: isEnhancedEditorEnabled ? 'selection' : 'none',
    renderIndentGuides: isEnhancedEditorEnabled,
    cursorBlinking: "blink" as "blink",
    cursorSmoothCaretAnimation: isEnhancedEditorEnabled ? "on" : "off",
    smoothScrolling: isEnhancedEditorEnabled,
    contextmenu: true,
    mouseWheelZoom: isEnhancedEditorEnabled,
    quickSuggestions: isEnhancedEditorEnabled,
    suggestOnTriggerCharacters: isEnhancedEditorEnabled,
    acceptSuggestionOnEnter: isEnhancedEditorEnabled ? 'on' : 'off',
    snippetSuggestions: isEnhancedEditorEnabled ? 'top' : 'bottom',
    parameterHints: { enabled: isEnhancedEditorEnabled },
    hover: { enabled: isEnhancedEditorEnabled },
    folding: isEnhancedEditorEnabled,
    foldingStrategy: 'indentation',
    showFoldingControls: isEnhancedEditorEnabled ? 'always' : 'mouseover',
    formatOnPaste: isEnhancedEditorEnabled,
    formatOnType: isEnhancedEditorEnabled,
    dragAndDrop: true,
    links: isEnhancedEditorEnabled,
    colorDecorators: isEnhancedEditorEnabled,
    lightbulb: { enabled: isEnhancedEditorEnabled },
    codeActionsOnSave: isEnhancedEditorEnabled ? {
      'source.organizeImports': true
    } : undefined,
    // Enhanced features
    ...(isEnhancedEditorEnabled && {
      inlineSuggestions: { enabled: true },
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        bracketPairsHorizontal: true,
        highlightActiveBracketPair: true,
        indentation: true
      },
      unicodeHighlight: {
        ambiguousCharacters: true,
        invisibleCharacters: true
      },
      stickyScroll: { enabled: true }
    })
  }

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900'
    : 'h-full'

  return (
    <div className={containerClass}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="w-4 h-4" />
              Code Editor
              <Badge variant="outline" className="gap-1">
                {getLanguageIcon(language)}
                {language}
              </Badge>
              {isEnhancedEditorEnabled && (
                <Badge variant="default" className="gap-1">
                  <Zap className="w-3 h-3" />
                  Enhanced
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="gap-1"
              >
                <Download className="w-3 h-3" />
                Download
              </Button>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept={`.${getFileExtension(language)}`}
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  asChild
                >
                  <span>
                    <Upload className="w-3 h-3" />
                    Upload
                  </span>
                </Button>
              </label>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFormat}
                className="gap-1"
              >
                <Palette className="w-3 h-3" />
                Format
              </Button>
              
              {isEnhancedEditorEnabled && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const editor = editorRef.current
                      if (editor) {
                        editor.getAction('editor.action.quickCommand').run()
                      }
                    }}
                    className="gap-1"
                  >
                    <Search className="w-3 h-3" />
                    Commands
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Enhanced Features Active",
                        description: "IntelliSense, bracket matching, and advanced formatting enabled.",
                      })
                    }}
                    className="gap-1"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="gap-1"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <div 
            className="h-full relative"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <Editor
              value={value}
              language={language}
              theme={theme}
              onMount={handleEditorDidMount}
              onChange={(newValue) => onChange(newValue || '')}
            />
            
            {/* Status bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span>Line {cursorPosition.line}, Column {cursorPosition.column}</span>
                  <span>{value.split('\n').length} lines</span>
                  <span>{value.length} characters</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTheme(theme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
                    className="hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {theme === 'vs-dark' ? '🌙' : '☀️'}
                  </button>
                  
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="bg-transparent text-xs border-none outline-none"
                  >
                    <option value={12}>12px</option>
                    <option value={14}>14px</option>
                    <option value={16}>16px</option>
                    <option value={18}>18px</option>
                    {isEnhancedEditorEnabled && (
                      <>
                        <option value={20}>20px</option>
                        <option value={22}>22px</option>
                      </>
                    )}
                  </select>
                  
                  <button
                    onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
                    className="hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Wrap: {wordWrap}
                  </button>
                  
                  {isEnhancedEditorEnabled && (
                    <button
                      onClick={() => setShowMinimap(!showMinimap)}
                      className="hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Map: {showMinimap ? 'On' : 'Off'}
                    </button>
                  )}
                  
                  {isEnhancedEditorEnabled && (
                    <span className="text-green-600 font-medium">
                      ✨ Enhanced
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

CodeEditor.displayName = 'CodeEditor'