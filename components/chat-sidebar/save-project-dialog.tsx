"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useChatSidebarStore } from "@/lib/stores/chat-sidebar-stores"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface SaveProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatId: string | null
}

export function SaveProjectDialog({ open, onOpenChange, chatId }: SaveProjectDialogProps) {
  const { getChatSession, saveAsProject } = useChatSidebarStore()
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const chatSession = chatId ? getChatSession(chatId) : null

  useEffect(() => {
    if (open && chatSession) {
      // Auto-generate project name from chat title
      setProjectName(chatSession.title)
      setDescription("")
      setTags([])
      setTagInput("")
    }
  }, [open, chatSession])

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = async () => {
    if (!chatId || !projectName.trim()) return

    setIsLoading(true)
    try {
      saveAsProject(chatId, projectName.trim(), description.trim() || undefined)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!chatSession) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Project</DialogTitle>
          <DialogDescription>Save this chat session as a project for easy access later.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name..."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this project..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <div className="space-y-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tags (press Enter or comma to add)..."
                maxLength={20}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 ml-1 hover:bg-transparent"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{tags.length}/5 tags added</p>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Chat Session Info</p>
            <p className="text-xs text-muted-foreground">
              {chatSession.messages.length} messages • Created {new Date(chatSession.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!projectName.trim() || isLoading}>
            {isLoading ? "Saving..." : "Save Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
