"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Code2,
  Search,
  FileText,
  Save,
  Zap,
  Bug,
  RefreshCw,
  Copy,
  Settings,
  Terminal,
  GitBranch,
  Upload,
  MessageSquare,
  Eye,
  Split,
  Maximize2,
  Bot,
  Sparkles,
  Keyboard,
  HelpCircle,
  ChevronRight,
  Hash,
  AtSign,
  Plus,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandAction {
  id: string
  title: string
  description?: string
  category: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void | Promise<void>
  keywords?: string[]
  priority?: number
  disabled?: boolean
  destructive?: boolean
}

interface EditorCommandPaletteProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  files: Array<{ name: string; path: string; language?: string }>
  activeFile?: string
  onFileSelect?: (file: string) => void
  onActionExecute?: (actionId: string, params?: any) => void
  className?: string
}

export function EditorCommandPalette({
  isOpen,
  onOpenChange,
  files,
  activeFile,
  onFileSelect,
  onActionExecute,
  className
}: EditorCommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mode, setMode] = useState<'command' | 'file' | 'symbol' | 'ai'>('command')

  // Categorized commands
  const commands: CommandAction[] = useMemo(() => [
    // File Operations
    {
      id: 'save-file',
      title: 'Save File',
      description: 'Save the current file',
      category: 'File',
      icon: <Save className="w-4 h-4" />,
      shortcut: 'Ctrl+S',
      action: () => onActionExecute?.('save-file'),
      keywords: ['save', 'write', 'commit'],
      priority: 10
    },
    {
      id: 'save-all',
      title: 'Save All Files',
      description: 'Save all modified files',
      category: 'File',
      icon: <Save className="w-4 h-4" />,
      shortcut: 'Ctrl+Shift+S',
      action: () => onActionExecute?.('save-all'),
      keywords: ['save', 'all', 'write'],
      priority: 8
    },
    {
      id: 'new-file',
      title: 'New File',
      description: 'Create a new file',
      category: 'File',
      icon: <Plus className="w-4 h-4" />,
      shortcut: 'Ctrl+N',
      action: () => onActionExecute?.('new-file'),
      keywords: ['new', 'create', 'file'],
      priority: 9
    },
    {
      id: 'close-file',
      title: 'Close File',
      description: 'Close the current file',
      category: 'File',
      icon: <X className="w-4 h-4" />,
      shortcut: 'Ctrl+W',
      action: () => onActionExecute?.('close-file'),
      keywords: ['close', 'exit'],
      priority: 7
    },

    // Edit Operations
    {
      id: 'find',
      title: 'Find in File',
      description: 'Search for text in the current file',
      category: 'Edit',
      icon: <Search className="w-4 h-4" />,
      shortcut: 'Ctrl+F',
      action: () => onActionExecute?.('find'),
      keywords: ['find', 'search', 'locate'],
      priority: 10
    },
    {
      id: 'replace',
      title: 'Find and Replace',
      description: 'Find and replace text in the current file',
      category: 'Edit',
      icon: <RefreshCw className="w-4 h-4" />,
      shortcut: 'Ctrl+H',
      action: () => onActionExecute?.('replace'),
      keywords: ['replace', 'substitute', 'change'],
      priority: 8
    },
    {
      id: 'format-document',
      title: 'Format Document',
      description: 'Format the current document',
      category: 'Edit',
      icon: <Code2 className="w-4 h-4" />,
      shortcut: 'Shift+Alt+F',
      action: () => onActionExecute?.('format-document'),
      keywords: ['format', 'prettier', 'beautify'],
      priority: 9
    },
    {
      id: 'copy-line',
      title: 'Copy Line',
      description: 'Copy the current line',
      category: 'Edit',
      icon: <Copy className="w-4 h-4" />,
      shortcut: 'Ctrl+C',
      action: () => onActionExecute?.('copy-line'),
      keywords: ['copy', 'duplicate'],
      priority: 6
    },

    // AI-Powered Commands
    {
      id: 'ai-explain',
      title: 'AI: Explain Code',
      description: 'Get AI explanation of the selected code',
      category: 'AI',
      icon: <Bot className="w-4 h-4" />,
      shortcut: 'Ctrl+K E',
      action: () => onActionExecute?.('ai-explain'),
      keywords: ['ai', 'explain', 'understand', 'help'],
      priority: 10
    },
    {
      id: 'ai-optimize',
      title: 'AI: Optimize Code',
      description: 'Get AI suggestions for code optimization',
      category: 'AI',
      icon: <Zap className="w-4 h-4" />,
      shortcut: 'Ctrl+K O',
      action: () => onActionExecute?.('ai-optimize'),
      keywords: ['ai', 'optimize', 'improve', 'performance'],
      priority: 9
    },
    {
      id: 'ai-debug',
      title: 'AI: Debug Code',
      description: 'Get AI help for debugging',
      category: 'AI',
      icon: <Bug className="w-4 h-4" />,
      shortcut: 'Ctrl+K D',
      action: () => onActionExecute?.('ai-debug'),
      keywords: ['ai', 'debug', 'fix', 'error'],
      priority: 9
    },
    {
      id: 'ai-refactor',
      title: 'AI: Refactor Code',
      description: 'Get AI suggestions for refactoring',
      category: 'AI',
      icon: <RefreshCw className="w-4 h-4" />,
      shortcut: 'Ctrl+K R',
      action: () => onActionExecute?.('ai-refactor'),
      keywords: ['ai', 'refactor', 'clean', 'restructure'],
      priority: 8
    },
    {
      id: 'ai-generate',
      title: 'AI: Generate Code',
      description: 'Generate code using AI',
      category: 'AI',
      icon: <Sparkles className="w-4 h-4" />,
      shortcut: 'Ctrl+K G',
      action: () => onActionExecute?.('ai-generate'),
      keywords: ['ai', 'generate', 'create', 'write'],
      priority: 10
    },
    {
      id: 'ai-chat',
      title: 'AI: Open Chat',
      description: 'Open AI chat assistant',
      category: 'AI',
      icon: <MessageSquare className="w-4 h-4" />,
      shortcut: 'Ctrl+/',
      action: () => onActionExecute?.('ai-chat'),
      keywords: ['ai', 'chat', 'assistant', 'help'],
      priority: 9
    },

    // View Commands
    {
      id: 'toggle-sidebar',
      title: 'Toggle Sidebar',
      description: 'Show or hide the sidebar',
      category: 'View',
      icon: <Split className="w-4 h-4" />,
      shortcut: 'Ctrl+B',
      action: () => onActionExecute?.('toggle-sidebar'),
      keywords: ['sidebar', 'panel', 'toggle'],
      priority: 7
    },
    {
      id: 'split-editor',
      title: 'Split Editor',
      description: 'Split the editor view',
      category: 'View',
      icon: <Split className="w-4 h-4" />,
      shortcut: 'Ctrl+\\',
      action: () => onActionExecute?.('split-editor'),
      keywords: ['split', 'divide', 'editor'],
      priority: 6
    },
    {
      id: 'toggle-fullscreen',
      title: 'Toggle Fullscreen',
      description: 'Enter or exit fullscreen mode',
      category: 'View',
      icon: <Maximize2 className="w-4 h-4" />,
      shortcut: 'F11',
      action: () => onActionExecute?.('toggle-fullscreen'),
      keywords: ['fullscreen', 'maximize', 'expand'],
      priority: 5
    },
    {
      id: 'toggle-minimap',
      title: 'Toggle Minimap',
      description: 'Show or hide the code minimap',
      category: 'View',
      icon: <Eye className="w-4 h-4" />,
      action: () => onActionExecute?.('toggle-minimap'),
      keywords: ['minimap', 'overview', 'navigation'],
      priority: 4
    },

    // Terminal Commands
    {
      id: 'open-terminal',
      title: 'Open Terminal',
      description: 'Open integrated terminal',
      category: 'Terminal',
      icon: <Terminal className="w-4 h-4" />,
      shortcut: 'Ctrl+`',
      action: () => onActionExecute?.('open-terminal'),
      keywords: ['terminal', 'console', 'shell'],
      priority: 8
    },
    {
      id: 'run-task',
      title: 'Run Task',
      description: 'Run a predefined task',
      category: 'Terminal',
      icon: <Zap className="w-4 h-4" />,
      shortcut: 'Ctrl+Shift+P',
      action: () => onActionExecute?.('run-task'),
      keywords: ['task', 'run', 'execute', 'build'],
      priority: 7
    },

    // Git Commands
    {
      id: 'git-commit',
      title: 'Git: Commit',
      description: 'Commit changes to git',
      category: 'Git',
      icon: <GitBranch className="w-4 h-4" />,
      action: () => onActionExecute?.('git-commit'),
      keywords: ['git', 'commit', 'save', 'version'],
      priority: 6
    },
    {
      id: 'git-push',
      title: 'Git: Push',
      description: 'Push changes to remote',
      category: 'Git',
      icon: <Upload className="w-4 h-4" />,
      action: () => onActionExecute?.('git-push'),
      keywords: ['git', 'push', 'upload', 'remote'],
      priority: 5
    },

    // Settings
    {
      id: 'open-settings',
      title: 'Open Settings',
      description: 'Open editor settings',
      category: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      shortcut: 'Ctrl+,',
      action: () => onActionExecute?.('open-settings'),
      keywords: ['settings', 'preferences', 'config'],
      priority: 5
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      category: 'Help',
      icon: <Keyboard className="w-4 h-4" />,
      shortcut: 'Ctrl+K Ctrl+S',
      action: () => onActionExecute?.('keyboard-shortcuts'),
      keywords: ['shortcuts', 'hotkeys', 'keys'],
      priority: 4
    },
    {
      id: 'help',
      title: 'Help',
      description: 'Open help documentation',
      category: 'Help',
      icon: <HelpCircle className="w-4 h-4" />,
      shortcut: 'F1',
      action: () => onActionExecute?.('help'),
      keywords: ['help', 'documentation', 'support'],
      priority: 3
    }
  ], [onActionExecute])

  // Filter commands based on search and mode
  const filteredItems = useMemo(() => {
    let items: any[] = []

    if (mode === 'file' || searchQuery.startsWith('@')) {
      // File mode
      const query = searchQuery.replace('@', '').toLowerCase()
      items = files
        .filter(file => file.name.toLowerCase().includes(query))
        .map(file => ({
          id: `file-${file.name}`,
          title: file.name,
          description: file.path,
          category: 'Files',
          icon: <FileText className="w-4 h-4" />,
          action: () => {
            onFileSelect?.(file.name)
            onOpenChange(false)
          },
          keywords: [file.name, file.path, file.language || '']
        }))
    } else if (mode === 'symbol' || searchQuery.startsWith('#')) {
      // Symbol mode - placeholder for now
      const query = searchQuery.replace('#', '').toLowerCase()
      items = [
        {
          id: 'symbol-placeholder',
          title: 'Symbol search coming soon...',
          description: 'Navigate to functions, classes, and variables',
          category: 'Symbols',
          icon: <Hash className="w-4 h-4" />,
          action: () => {},
          disabled: true
        }
      ]
    } else if (mode === 'ai' || searchQuery.startsWith('/')) {
      // AI mode
      const query = searchQuery.replace('>', '').toLowerCase()
      items = commands
        .filter(cmd => cmd.category === 'AI')
        .filter(cmd => {
          if (!query) return true
          return (
            cmd.title.toLowerCase().includes(query) ||
            cmd.description?.toLowerCase().includes(query) ||
            cmd.keywords?.some(k => k.includes(query))
          )
        })
    } else {
      // Command mode
      const query = searchQuery.toLowerCase()
      items = commands.filter(cmd => {
        if (!query) return true
        return (
          cmd.title.toLowerCase().includes(query) ||
          cmd.description?.toLowerCase().includes(query) ||
          cmd.keywords?.some(k => k.includes(query)) ||
          cmd.shortcut?.toLowerCase().includes(query)
        )
      })
    }

    return items.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }, [searchQuery, mode, commands, files, onFileSelect, onOpenChange])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }, [filteredItems])

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setSelectedIndex(0)

    // Auto-detect mode based on query prefix
    if (value.startsWith('@')) {
      setMode('file')
    } else if (value.startsWith('#')) {
      setMode('symbol')
    } else if (value.startsWith('/')) {
      setMode('ai')
    } else {
      setMode('command')
    }
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        const selectedItem = filteredItems[selectedIndex]
        if (selectedItem && !selectedItem.disabled) {
          selectedItem.action()
          onOpenChange(false)
        }
        break
      case 'Escape':
        onOpenChange(false)
        break
    }
  }, [filteredItems, selectedIndex, onOpenChange])

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedIndex(0)
      setMode('command')
    }
  }, [isOpen])

  const getModeIcon = () => {
    switch (mode) {
      case 'file': return <FileText className="w-4 h-4" />
      case 'symbol': return <Hash className="w-4 h-4" />
      case 'ai': return <Bot className="w-4 h-4" />
      default: return <Command className="w-4 h-4" />
    }
  }

  const getModeDescription = () => {
    switch (mode) {
      case 'file': return 'Type @ to search files'
      case 'symbol': return 'Type # to search symbols'
      case 'ai': return 'Type / for AI commands'
      default: return 'Type a command or use @ # > prefixes'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl p-0", className)}>
        <Command className="rounded-lg border-none shadow-none">
          <div className="flex items-center border-b px-3">
            {getModeIcon()}
            <CommandInput
              placeholder={getModeDescription()}
              value={searchQuery}
              onValueChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {mode}
              </Badge>
              <span>ESC to close</span>
            </div>
          </div>

          <CommandList className="max-h-[400px]">
            <CommandEmpty>
              <div className="py-6 text-center text-sm text-muted-foreground">
                No commands found.
                <div className="mt-2 text-xs">
                  Try using @ for files, # for symbols, or / for AI commands
                </div>
              </div>
            </CommandEmpty>

            {Object.entries(groupedItems).map(([category, items], categoryIndex) => (
              <CommandGroup key={category} heading={category}>
                {items.map((item, itemIndex) => {
                  const globalIndex = Object.entries(groupedItems)
                    .slice(0, categoryIndex)
                    .reduce((acc, [, catItems]) => acc + catItems.length, 0) + itemIndex

                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => {
                        if (!item.disabled) {
                          item.action()
                          onOpenChange(false)
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2",
                        globalIndex === selectedIndex && "bg-accent",
                        item.disabled && "opacity-50 cursor-not-allowed",
                        item.destructive && "text-destructive"
                      )}
                      disabled={item.disabled}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {item.icon}
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {item.shortcut && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          {item.shortcut}
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}

            {/* Quick Tips */}
            {!searchQuery && (
              <CommandGroup heading="Tips">
                <div className="px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <AtSign className="w-3 h-3" />
                    <span>Type @ to search files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    <span>Type # to search symbols</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    <span>Type / for AI commands</span>
                  </div>
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}