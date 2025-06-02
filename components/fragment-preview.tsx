import React, { useState, useMemo } from 'react'
import { ChevronRightIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import { 
  File, 
  Folder, 
  FolderOpen,
  FileText,
  FileCode,
  Image,
  Settings,
  Database,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface FileItem {
  name: string
  content: string
  path: string
}

interface TreeNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: TreeNode[]
  content?: string
}

interface FileTreeCodeViewerProps {
  files: FileItem[]
  onDownload?: (filename: string, content: string) => void
}

export function FileTreeCodeViewer({ files, onDownload }: FileTreeCodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string>(files[0]?.path || '')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))

  // Build tree structure from files
  const fileTree = useMemo(() => {
    const root: TreeNode = { name: 'root', type: 'folder', path: '/', children: [] }
    
    files.forEach(file => {
      const pathParts = file.path.split('/').filter(Boolean)
      let currentNode = root
      
      // Create folder structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i]
        const folderPath = '/' + pathParts.slice(0, i + 1).join('/')
        
        let folderNode = currentNode.children?.find(
          child => child.name === folderName && child.type === 'folder'
        )
        
        if (!folderNode) {
          folderNode = {
            name: folderName,
            type: 'folder',
            path: folderPath,
            children: []
          }
          currentNode.children = currentNode.children || []
          currentNode.children.push(folderNode)
        }
        
        currentNode = folderNode
      }
      
      // Add file
      const fileName = pathParts[pathParts.length - 1] || file.name
      currentNode.children = currentNode.children || []
      currentNode.children.push({
        name: fileName,
        type: 'file',
        path: file.path,
        content: file.content
      })
    })
    
    // Sort children: folders first, then files
    const sortChildren = (node: TreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })
        node.children.forEach(sortChildren)
      }
    }
    
    sortChildren(root)
    return root.children || []
  }, [files])

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'tsx':
      case 'jsx':
      case 'ts':
      case 'js':
        return <FileCode className="h-4 w-4 text-blue-500" />
      case 'html':
        return <Globe className="h-4 w-4 text-orange-500" />
      case 'css':
      case 'scss':
      case 'sass':
        return <FileCode className="h-4 w-4 text-purple-500" />
      case 'json':
        return <Settings className="h-4 w-4 text-yellow-500" />
      case 'md':
        return <FileText className="h-4 w-4 text-gray-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        // eslint-disable-next-line jsx-a11y/alt-text
        return <Image className="h-4 w-4 text-green-500" />
      case 'sql':
        return <Database className="h-4 w-4 text-blue-600" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderTreeNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFile === node.path
    
    return (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-accent/50 transition-colors",
            isSelected && "bg-accent text-accent-foreground"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path)
            } else {
              setSelectedFile(node.path)
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )}
            </>
          ) : (
            <>
              <div className="w-4" /> {/* Spacer for alignment */}
              {getFileIcon(node.name)}
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const selectedFileContent = useMemo(() => {
    const findFileByPath = (nodes: TreeNode[], path: string): TreeNode | null => {
      for (const node of nodes) {
        if (node.path === path && node.type === 'file') {
          return node
        }
        if (node.children) {
          const found = findFileByPath(node.children, path)
          if (found) return found
        }
      }
      return null
    }
    
    return findFileByPath(fileTree, selectedFile)
  }, [fileTree, selectedFile])

  const downloadFile = (filename: string, content: string) => {
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

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No files to display
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* File Tree Sidebar */}
      <div className="w-80 border-r bg-muted/20">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="text-sm font-medium text-foreground">Project Files</h3>
        </div>
        <ScrollArea className="h-full">
          <div className="p-1">
            {fileTree.map(node => renderTreeNode(node))}
          </div>
        </ScrollArea>
      </div>

      {/* Code Content */}
      <div className="flex-1 flex flex-col">
        {selectedFileContent ? (
          <>
            {/* File Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedFileContent.name)}
                <span className="text-sm font-medium">{selectedFileContent.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedFileContent.content || '')}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy to clipboard</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(selectedFileContent.name, selectedFileContent.content || '')}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download file</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Code Content */}
            <ScrollArea className="flex-1 p-4">
              <pre className="text-sm bg-muted/30 rounded-lg p-4 overflow-x-auto">
                <code className="text-foreground font-mono whitespace-pre">
                  {selectedFileContent.content}
                </code>
              </pre>
            </ScrollArea>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a file to view its content
          </div>
        )}
      </div>
    </div>
  )
}