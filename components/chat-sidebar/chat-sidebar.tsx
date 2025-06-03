"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useChatSidebarStore } from "@/lib/stores/chat-sidebar-stores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  MessageSquare,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download,
  Upload,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { ChatSessionItem } from "./chat-session-item"
import { ProjectItem } from "./project-item"
import { SaveProjectDialog } from "./save-project-dialog"
import { SettingsDialog } from "./settings-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatSession {
  id: string
  title: string
  createdAt: Date // Changed from number to Date
  updatedAt: Date // Changed from number to Date
  messages: any[] // TODO: Define Message type
}

// Removed unused Project interface

interface ChatSidebarProps {
  className?: string
  onChatSelect?: (chatId: string) => void
  onNewChat?: () => void
}

export function ChatSidebar({ className, onChatSelect, onNewChat }: ChatSidebarProps) {
  const {
    isOpen,
    activeTab,
    searchQuery,
    chatSessions,
    // projects, // Removed unused variable
    isLoading,
    error,
    // setIsOpen, // Commented out as we will force sidebar to be closed
    setActiveTab,
    setSearchQuery,
    getFilteredChats,
    getFilteredProjects,
    clearAll,
    exportData,
    importData,
  } = useChatSidebarStore()

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  // const [showSaveDialog, setShowSaveDialog] = useState(false) // Not needed if sidebar is hidden
  // const [showSettingsDialog, setShowSettingsDialog] = useState(false) // Not needed if sidebar is hidden
  // const [selectedChatForProject, setSelectedChatForProject] = useState<string | null>(null) // Not needed if sidebar is hidden

  // const filteredChats = getFilteredChats() // Not needed if sidebar is hidden
  // const filteredProjects = getFilteredProjects() // Not needed if sidebar is hidden

  // const handleSaveAsProject = (chatId: string) => { // Not needed if sidebar is hidden
  //   setSelectedChatForProject(chatId)
  //   setShowSaveDialog(true)
  // }

  // const handleExport = () => { // Not needed if sidebar is hidden
  //   const data = exportData()
  //   const blob = new Blob([data], { type: "application/json" })
  //   const url = URL.createObjectURL(blob)
  //   const a = document.createElement("a")
  //   a.href = url
  //   a.download = `chat-history-${new Date().toISOString().split("T")[0]}.json`
  //   document.body.appendChild(a)
  //   a.click()
  //   document.body.removeChild(a)
  //   URL.revokeObjectURL(url)
  // }

  // const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => { // Not needed if sidebar is hidden
  //   const file = event.target.files?.[0]
  //   if (!file) return

  //   const reader = new FileReader()
  //   reader.onload = (e) => {
  //     const content = e.target?.result as string
  //     importData(content)
  //   }
  //   reader.readAsText(file)
  //   event.target.value = "" // Reset input
  // }

  // Sidebar is always hidden
  return null

  // Original code for reference if we need to restore:
  /*
  if (!isOpen) {
    return (
      <div className={cn("flex flex-col h-full w-10 border-r bg-background", className)}>
        <div className="p-1">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="w-8 h-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full w-80 border-r bg-background", className)}>
      // Header
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h2 className="font-semibold text-lg">Chat History</h2>
          <Badge variant="secondary" className="text-xs">
            {chatSessions.length}
          </Badge>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={onNewChat} className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <label className="flex items-center cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearAll} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      // Search
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats and projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      // Tabs
      <div className="flex border-b">
        <Button
          variant={activeTab === "chats" ? "default" : "ghost"}
          onClick={() => setActiveTab("chats")}
          className="flex-1 rounded-none border-0"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chats ({filteredChats.length})
        </Button>
        <Button
          variant={activeTab === "projects" ? "default" : "ghost"}
          onClick={() => setActiveTab("projects")}
          className="flex-1 rounded-none border-0"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Projects ({filteredProjects.length})
        </Button>
      </div>

      // Content
      <ScrollArea className="flex-1">
        <div className="p-4">
          {error && <div className="p-3 mb-2 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === "chats" ? (
            <div className="space-y-1">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No chats found</p>
                  {searchQuery && <p className="text-xs mt-1">Try adjusting your search</p>}
                </div>
              ) : (
                filteredChats.map((chat: ChatSession) => (
                  <ChatSessionItem
                    key={chat.id}
                    session={chat}
                    onSelect={() => onChatSelect?.(chat.id)}
                    onSaveAsProject={() => handleSaveAsProject(chat.id)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects found</p>
                  {searchQuery ? (
                    <p className="text-xs mt-1">Try adjusting your search</p>
                  ) : (
                    <p className="text-xs mt-1">Save a chat as a project to get started</p>
                  )}
                </div>
              ) : (
                filteredProjects.map((project: any) => (
                  <ProjectItem
                    key={project.id}
                    project={project as any} // TODO: Define Project type
                    onSelect={() => onChatSelect?.(project.chatSessionId)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      // Dialogs
      <SaveProjectDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} chatId={selectedChatForProject} />

      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
    </div>
  )
  */
}
