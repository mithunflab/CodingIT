"use client"

import { shallow } from "zustand/shallow"
import { useChatSidebarStore } from "@/lib/stores/chat-sidebar-stores"
import React from "react" // Changed to value import
import { useLocalStorage } from "usehooks-ts" // Import useLocalStorage
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Download, Upload } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [autoSave, setAutoSave] = useLocalStorage("chatSidebar_autoSave", true)
  const [showTimestamps, setShowTimestamps] = useLocalStorage("chatSidebar_showTimestamps", true)
  const [compactView, setCompactView] = useLocalStorage("chatSidebar_compactView", false)

  // Select state individually. If chatSessions or projects can be large and cause re-renders
  // due to new array references from the store, consider using shallow equality with useStore if applicable,
  // or ensure the store itself provides stable references or memoized selectors.
  // For now, direct selection is used. The `shallow` import is kept if needed for other store patterns.
  const chatSessions = useChatSidebarStore((state) => state.chatSessions)
  const projects = useChatSidebarStore((state) => state.projects)
  const exportStoreData = useChatSidebarStore((state) => state.exportData)
  const importStoreData = useChatSidebarStore((state) => state.importData)
  const clearStoreData = useChatSidebarStore((state) => state.clearAll)
  
  // Defensive defaults and memoized calculations
  // Ensure chatSessions and projects are arrays before trying to use array methods.
  const safeChatSessions = React.useMemo(() => Array.isArray(chatSessions) ? chatSessions : [], [chatSessions])
  const safeProjects = React.useMemo(() => Array.isArray(projects) ? projects : [], [projects])

  const totalMessages = React.useMemo(() => 
    safeChatSessions.reduce((sum: number, session: any) => sum + (Array.isArray(session.messages) ? session.messages.length : 0), 0),
    [safeChatSessions]
  )
  
  const storageSize = React.useMemo(() =>
    JSON.stringify({ chatSessions: safeChatSessions, projects: safeProjects }).length,
    [safeChatSessions, safeProjects]
  )

  const handleExport = () => {
    const data = exportStoreData ? exportStoreData() : ""
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `codinit-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (importStoreData) {
        importStoreData(content)
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat Sidebar Settings</DialogTitle>
          <DialogDescription>Manage your chat history and project settings.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{safeChatSessions.length}</div>
                <div className="text-xs text-muted-foreground">Chat Sessions</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{safeProjects.length}</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{totalMessages}</div>
                <div className="text-xs text-muted-foreground">Total Messages</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{Math.round(storageSize / 1024)}KB</div>
                <div className="text-xs text-muted-foreground">Storage Used</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Display Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save" className="text-sm">
                  Auto-save conversations
                </Label>
                <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-timestamps" className="text-sm">
                  Show timestamps
                </Label>
                <Switch id="show-timestamps" checked={showTimestamps} onCheckedChange={setShowTimestamps} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-view" className="text-sm">
                  Compact view
                </Label>
                <Switch id="compact-view" checked={compactView} onCheckedChange={setCompactView} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Data Management</h4>
            <div className="space-y-2">
              <Button variant="outline" onClick={handleExport} className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>

              <Button variant="outline" asChild className="w-full justify-start">
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all chat sessions and projects. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (clearStoreData) {
                          clearStoreData()
                        }
                        onOpenChange(false) // Close dialog after clearing
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
