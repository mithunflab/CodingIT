'use client'

import { useState, useEffect } from 'react'
import { FileTree, FileSystemNode } from '@/components/file-tree'
import { CodeView } from '@/components/code-view'
import { useAuth } from '@/lib/auth'
import Spinner from './ui/spinner'

export function IDE() {
  const { session, loading } = useAuth(() => {}, () => {})
  const [files, setFiles] = useState<FileSystemNode[]>([])
  const [selectedFile, setSelectedFile] = useState<{
    path: string
    content: string
  } | null>(null)

  async function fetchFiles() {
    if (!session) return
    try {
      const response = await fetch(`/api/files?sessionID=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      } else {
        console.error('Failed to fetch files')
        setFiles([])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setFiles([])
    }
  }

  useEffect(() => {
    if (session) {
      fetchFiles()
    }
  }, [session])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  async function handleSelectFile(path: string) {
    if (!session) return
    const response = await fetch(`/api/files/content?sessionID=${session.user.id}&path=${path}`)
    const { content } = await response.json()
    setSelectedFile({ path, content })
  }

  async function handleSaveFile(path: string, content: string) {
    if (!session) return
    await fetch('/api/files/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionID: session.user.id, path, content }),
    })
  }

  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r overflow-auto">
        <div className="p-2 border-b">
          <button
            onClick={fetchFiles}
            className="w-full p-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Refresh Files
          </button>
        </div>
        <FileTree files={files} onSelectFile={handleSelectFile} />
      </div>
      <div className="w-3/4">
        {selectedFile ? (
          <CodeView
            key={selectedFile.path}
            code={selectedFile.content}
            lang="typescript" // TODO: Detect language from file extension
            onSave={(content) => handleSaveFile(selectedFile.path, content)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Select a file to view its content</p>
          </div>
        )}
      </div>
    </div>
  )
}
