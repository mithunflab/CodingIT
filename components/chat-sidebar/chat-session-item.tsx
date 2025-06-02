"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useChatSidebarStore } from "@/lib/stores/chat-sidebar-stores"
import type { ChatSession } from "@/lib/types/chat-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MessageSquare, MoreHorizontal, FolderPlus, Trash2, Edit3, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ChatSessionItemProps {
  session: ChatSession
  onSelect: () => void
  onSaveAsProject: () => void
}

export function ChatSessionItem({ session, onSelect, onSaveAsProject }: ChatSessionItemProps) {
  const { selectedChatId, deleteChatSession, updateChatSession } = useChatSidebarStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title)

  const isSelected = selectedChatId === session.id
  const messageCount = session.messages.length
  const lastMessage = session.messages[session.messages.length - 1]
  const timeAgo = formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })

  const handleDelete = () => {
    deleteChatSession(session.id)
    setShowDeleteDialog(false)
  }

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      updateChatSession(session.id, { title: editTitle.trim() })
    }
    setIsEditing(false)
    setEditTitle(session.title)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle(session.title)
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(session.id)
  }

  return (
    <>
      <div
        className={cn(
          "group relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50",
          isSelected && "bg-accent border border-accent-foreground/20",
        )}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit()
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                  className="h-6 text-sm font-medium"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="font-medium text-sm truncate">{session.title}</h3>
              )}
              {session.isProject && (
                <Badge variant="secondary" className="text-xs">
                  Project
                </Badge>
              )}
            </div>

            {lastMessage && (
              <p className="text-xs text-muted-foreground truncate mb-2">
                {lastMessage.role === "user" ? "You: " : "AI: "}
                {lastMessage.content}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              <span>{messageCount} messages</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              {!session.isProject && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onSaveAsProject()
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Save as Project
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyId()
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteDialog(true)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {session.title}? This action cannot be undone.
              {session.isProject && " This will also remove the associated project."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
