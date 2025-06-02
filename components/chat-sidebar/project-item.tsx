"use client"

import type React from "react"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useChatSidebarStore } from "@/lib/stores/chat-sidebar-stores"
import type { Project } from "@/lib/types/chat-sidebar"
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
import { FolderOpen, MoreHorizontal, Star, StarOff, Trash2, Edit3, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ProjectItemProps {
  project: Project
  onSelect: () => void
}

export function ProjectItem({ project, onSelect }: ProjectItemProps) {
  const { selectedChatId, deleteProject, updateProject, toggleProjectStar, getChatSession } = useChatSidebarStore()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)

  const chatSession = getChatSession(project.chatSessionId)
  const isSelected = selectedChatId === project.chatSessionId
  const timeAgo = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })

  const handleDelete = () => {
    deleteProject(project.id)
    setShowDeleteDialog(false)
  }

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== project.name) {
      updateProject(project.id, { name: editName.trim() })
    }
    setIsEditing(false)
    setEditName(project.name)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(project.name)
  }

  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleProjectStar(project.id)
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(project.id)
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
              <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                <h3 className="font-medium text-sm truncate">{project.name}</h3>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={handleToggleStar}
              >
                {project.isStarred ? (
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Button>
            </div>

            {project.description && (
              <p className="text-xs text-muted-foreground truncate mb-2">{project.description}</p>
            )}

            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{project.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              {chatSession && <span>{chatSession.messages.length} messages</span>}
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
              <DropdownMenuItem onClick={handleToggleStar}>
                {project.isStarred ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Unstar
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Star
                  </>
                )}
              </DropdownMenuItem>
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
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete the project "${project.name}"? This will not delete the associated chat
              session, only remove it from your projects.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
