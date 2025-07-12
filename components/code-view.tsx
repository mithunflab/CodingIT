import { useEffect, useState } from 'react'
import { CodeEditor } from './code-editor'
import { Button } from './ui/button'
import { useToast } from './ui/use-toast'

export function CodeView({
  code: initialCode,
  lang,
  onSave,
}: {
  code: string
  lang: string
  onSave: (content: string) => void
}) {
  const [code, setCode] = useState(initialCode)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setCode(initialCode)
    setHasUnsavedChanges(false)
  }, [initialCode])

  function handleCodeChange(newCode: string | undefined) {
    setCode(newCode || '')
    setHasUnsavedChanges((newCode || '') !== initialCode)
  }

  function handleSave() {
    onSave(code)
    setHasUnsavedChanges(false)
    toast({
      title: 'File saved',
      description: 'Your changes have been saved successfully.',
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <CodeEditor
          code={code}
          lang={lang}
          onChange={handleCodeChange}
        />
      </div>
      <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
          <span>Language: {lang || 'text'}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-500">Unsaved changes</span>
          )}
          <Button 
            onClick={handleSave}
            size="sm"
            variant={hasUnsavedChanges ? 'default' : 'outline'}
          >
            Save {hasUnsavedChanges && '*'}
          </Button>
        </div>
      </div>
    </div>
  )
}
