import { useEffect, useState } from 'react'
import { CodeEditor } from './code-editor'
import { Button } from './ui/button'

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

  useEffect(() => {
    setCode(initialCode)
  }, [initialCode])

  function handleSave() {
    onSave(code)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CodeEditor
          code={code}
          lang={lang}
          onChange={newCode => setCode(newCode || '')}
        />
      </div>
      <div className="p-2 flex justify-end">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}
