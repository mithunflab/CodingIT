"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Figma, Loader2, ExternalLink, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FigmaImportModalProps {
  onImport: (figmaUrl: string, customPrompt?: string) => void
  isLoading?: boolean
}

export function FigmaImportModal({ onImport, isLoading = false }: FigmaImportModalProps) {
  const [open, setOpen] = useState(false)
  const [figmaUrl, setFigmaUrl] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")

  const handleImport = async () => {
    if (!figmaUrl.trim()) {
      setError("Please enter a Figma URL")
      return
    }

    if (!figmaUrl.includes("figma.com")) {
      setError("Please enter a valid Figma URL")
      return
    }

    setError("")
    setIsAnalyzing(true)

    try {
      await onImport(figmaUrl, customPrompt)
      setOpen(false)
      setFigmaUrl("")
      setCustomPrompt("")
    } catch (err) {
      setError("Failed to import Figma design. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUrlChange = (value: string) => {
    setFigmaUrl(value)
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rainbow-button-content flex items-center gap-2 px-4 py-2 transition-colors border-none"
          disabled={isLoading}
        >
          <Figma className="w-4 h-4" />
          <span className="text-xs">Import from Figma</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Figma className="w-5 h-5" />
            Import from Figma
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Enter a Figma file URL to automatically analyze and recreate the design as functional code.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="figma-url">Figma File URL</Label>
            <Input
              id="figma-url"
              placeholder="https://www.figma.com/file/abc123/My-Design"
              value={figmaUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Additional Instructions (Optional)</Label>
            <Textarea
              id="custom-prompt"
              placeholder="Any specific requirements or modifications you'd like..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-neutral-500">{customPrompt.length}/200 characters</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ExternalLink className="w-3 h-3" />
            <span>Make sure your Figma file is publicly accessible or shared with view permissions</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isAnalyzing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!figmaUrl.trim() || isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Import Design"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
