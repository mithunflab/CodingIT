import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  Folder,
} from 'lucide-react'

export interface FileSystemNode {
  name: string
  isDirectory: boolean
  children?: FileSystemNode[]
}

interface FileTreeProps {
  files: FileSystemNode[]
  onSelectFile: (path: string) => void
}

export function FileTree({ files, onSelectFile }: FileTreeProps) {
  return (
    <div className="p-2">
      {files.map(file => (
        <FileTreeNode key={file.name} node={file} onSelectFile={onSelectFile} />
      ))}
    </div>
  )
}

interface FileTreeNodeProps {
  node: FileSystemNode
  onSelectFile: (path: string) => void
  level?: number
}

function FileTreeNode({
  node,
  onSelectFile,
  level = 0,
  path = '',
}: FileTreeNodeProps & { path?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  const isDirectory = node.isDirectory
  const hasChildren = node.children && node.children.length > 0
  const newPath = `${path}/${node.name}`

  const handleToggle = () => {
    if (isDirectory) {
      setIsOpen(!isOpen)
    } else {
      onSelectFile(newPath)
    }
  }

  return (
    <div>
      <div
        className="flex items-center cursor-pointer"
        style={{ paddingLeft: level * 16 }}
        onClick={handleToggle}
      >
        {isDirectory ? (
          <>
            {isOpen ? (
              <ChevronDown size={16} className="mr-1" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )}
            <Folder size={16} className="mr-1" />
          </>
        ) : (
          <FileIcon size={16} className="mr-1" />
        )}
        <span>{node.name}</span>
      </div>
      {isOpen &&
        hasChildren &&
        node.children?.map(child => (
          <FileTreeNode
            key={child.name}
            node={child}
            onSelectFile={onSelectFile}
            level={level + 1}
            path={newPath}
          />
        ))}
    </div>
  )
}
