import Editor, { Monaco } from '@monaco-editor/react'
import { useState, useRef } from 'react'
import { GenerateCodeDialog } from './generate-code-dialog'
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'
import { useTheme } from 'next-themes'

export function CodeEditor({
  code,
  lang,
  onChange,
}: {
  code: string
  lang: string
  onChange: (value: string | undefined) => void
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { theme } = useTheme()
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  )

  function handleEditorDidMount(
    editor: monacoEditor.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) {
    editorRef.current = editor
    
    // Enhanced keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      setIsDialogOpen(true)
    })
    
    // Quick save shortcut (Ctrl/Cmd + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Trigger save event - the parent component should handle this
      const currentCode = editor.getValue()
      onChange(currentCode)
    })
    
    // Find and replace (Ctrl/Cmd + H) - Monaco has this built-in but let's ensure it's enabled
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      editor.trigger('', 'editor.action.startFindReplaceAction', {})
    })
    
    // Format document (Alt + Shift + F)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.trigger('', 'editor.action.formatDocument', {})
    })
  }

  async function handleGenerateCode(prompt: string) {
    if (!editorRef.current) return

    const editor = editorRef.current
    const selection = editor.getSelection()
    if (!selection) return

    const selectedCode = editor.getModel()?.getValueInRange(selection) || ''

    const response = await fetch('/api/generate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: selectedCode,
        prompt,
      }),
    })

    if (!response.body) {
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let newCode = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      newCode += decoder.decode(value)
      editor.executeEdits('ai-replace', [
        {
          range: selection,
          text: newCode,
        },
      ])
    }

    setIsDialogOpen(false)
  }

  return (
    <>
      <Editor
        height="100%"
        language={lang}
        value={code}
        onChange={onChange}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        onMount={handleEditorDidMount}
        options={{
          minimap: {
            enabled: false,
          },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, SF Mono, Monaco, Inconsolata, Fira Code, Droid Sans Mono, Consolas, monospace',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          renderWhitespace: 'selection',
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          lineNumbers: 'on',
          glyphMargin: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          // Enable find widget
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'always',
          },
        }}
      />
      <GenerateCodeDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleGenerateCode}
      />
    </>
  )
}
