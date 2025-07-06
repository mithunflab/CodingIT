import Editor, { Monaco } from '@monaco-editor/react'
import { useState, useRef } from 'react'
import { GenerateCodeDialog } from './generate-code-dialog'
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'

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
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  )

  function handleEditorDidMount(
    editor: monacoEditor.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) {
    editorRef.current = editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      setIsDialogOpen(true)
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
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: {
            enabled: false,
          },
          fontSize: 12,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
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
