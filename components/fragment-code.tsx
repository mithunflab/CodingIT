import { CodeView } from './code-view'
import { Button } from './ui/button'
import { CopyButton } from './ui/copy-button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Download, File as FileIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FileTree, FileSystemNode } from './file-tree'

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

  async function handleCreateFile(path: string, isDirectory: boolean) {
    try {
      // For directories, we just update the local state
      // For files, we create an empty file
      if (!isDirectory) {
        await fetch('/api/files/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: `/${path}`, content: '' }),
        })
        // Refresh file tree
        const response = await fetch('/api/files')
        const data = await response.json()
        setFileTree(data)
      }
    } catch (error) {
      console.error('Error creating file:', error)
    }
  }

  async function handleDeleteFile(path: string) {
    try {
      await fetch(`/api/files/content?path=${path}`, {
        method: 'DELETE',
      })
      // Refresh file tree
      const response = await fetch('/api/files')
      const data = await response.json()
      setFileTree(data)
      // Clear editor if deleted file was selected
      if (selectedFile === path) {
        setSelectedFile(null)
        setCode('')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
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
    <div className="flex h-full w-full">
      <div className="w-full sm:w-1/4 lg:w-1/5 xl:w-1/6 border-r min-w-[200px] max-w-[300px]">
        <FileTree 
          files={fileTree} 
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {selectedFile && (
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">{selectedFile.split('/').pop()}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {selectedFile}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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
          </div>
        )}
        <div className="flex-1 relative">
          {selectedFile ? (
            <CodeView
              code={code}
              lang={selectedFile?.split('.').pop() || ''}
              onSave={handleSave}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No file selected</p>
                <p className="text-sm">Select a file from the tree to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
