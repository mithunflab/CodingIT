"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ProjectInstructionsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectId?: string;
  initialInstructions?: string;
  onSave?: (instructions: string) => void;
}

export function ProjectInstructionsModal({ 
  isOpen, 
  onOpenChange, 
  projectId,
  initialInstructions = "",
  onSave
}: ProjectInstructionsModalProps) {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInstructions(initialInstructions);
    }
  }, [isOpen, initialInstructions]);

  const handleSave = async () => {
    if (!instructions.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(instructions.trim());
      } else if (projectId) {
        // Save to API
        const response = await fetch(`/api/projects/${projectId}/instructions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ instructions: instructions.trim() }),
        });

        if (!response.ok) {
          throw new Error('Failed to save instructions');
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save instructions:", error);
      alert("Failed to save instructions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setInstructions(initialInstructions);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="bg-background rounded-lg">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold">
              Set project instructions
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Provide Claude with relevant instructions and information for chats within new project. 
              This will work alongside user preferences and the selected style in a chat.
            </p>
          </DialogHeader>
          
          <div className="p-6">
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Think step by step and show reasoning for complex problems. Use specific examples."
              className="min-h-[200px] resize-none"
              disabled={isSaving}
            />
          </div>
          
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!instructions.trim() || isSaving}
            >
              {isSaving ? "Saving..." : "Save instructions"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}