import { CodeView } from './code-view'
import { Button } from './ui/button'
import { CopyButton } from './ui/copy-button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FileTree, FileSystemNode } from './file-tree'
import { ScrollArea } from './ui/scroll-area'

export function FragmentCode() {
  const [fileTree, setFileTree] = useState<FileSystemNode[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    async function fetchFileTree() {
      try {
        const response = await fetch('/api/files')
        const data = await response.json()
        setFileTree(data)
      } catch (error) {
        console.error('Error fetching file tree:', error)
      }
    }
    fetchFileTree()
  }, [])

  async function handleSelectFile(path: string) {
    try {
      const response = await fetch(`/api/files/content?path=${path}`)
      const content = await response.text()
      setCode(content)
      setSelectedFile(path)
    } catch (error) {
      console.error('Error fetching file content:', error)
    }
  }

  async function handleSave(content: string) {
    if (!selectedFile) return

    try {
      await fetch('/api/files/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: selectedFile, content }),
      })
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="flex h-full">
      <ScrollArea className="w-1/4 border-r">
        <FileTree files={fileTree} onSelectFile={handleSelectFile} />
      </ScrollArea>
      <div className="flex flex-col flex-1 overflow-x-auto">
        {selectedFile && (
          <div className="flex items-center justify-end px-2 pt-1 gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <CopyButton
                    content={code}
                    className="text-muted-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">Copy</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => download(selectedFile, code)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Download</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <CodeView
          code={code}
          lang={selectedFile?.split('.').pop() || ''}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
