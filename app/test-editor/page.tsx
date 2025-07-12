'use client'

import { FragmentCode } from '@/components/fragment-code'

export default function TestCodeEditor() {
  return (
    <div className="h-screen bg-background">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Code Editor Test</h1>
        <p className="text-muted-foreground mb-4">
          Testing the enhanced code editor with file tree and syntax highlighting.
        </p>
      </div>
      <div className="h-[calc(100vh-120px)]">
        <FragmentCode />
      </div>
    </div>
  )
}