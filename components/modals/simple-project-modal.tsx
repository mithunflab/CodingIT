"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjectStore } from "@/lib/stores/projects";
import { useAuth } from "@/contexts/AuthContext";

interface SimpleProjectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SimpleProjectModal({ isOpen, onOpenChange }: SimpleProjectModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { createProject } = useProjectStore();
  
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      return;
    }
    
    if (!user) {
      alert("You must be logged in to create a project.");
      return;
    }

    setIsCreating(true);
    try {
      const newProject = await createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        visibility: "private",
        template: "blank"
      });

      // Reset form
      setProjectName("");
      setProjectDescription("");
      onOpenChange(false);
      
      // Navigate to the new project
      router.push(`/project/${newProject.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setProjectName("");
    setProjectDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="bg-background rounded-lg">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              Create a personal project
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateProject} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">What are you working on?</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Name your project"
                className="w-full"
                disabled={isCreating}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">What are you trying to achieve?</label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project, goals, subject, etc..."
                className="min-h-[100px] resize-none"
                disabled={isCreating}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!projectName.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create project"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}