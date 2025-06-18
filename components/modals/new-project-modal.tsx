"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectTemplateSelector } from "@/components/projects/project-template-selector";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectStore } from "@/lib/stores/projects"; // Assuming a createProject function exists here
import { Loader2, PlusCircle } from "lucide-react";

interface NewProjectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewProjectModal({ isOpen, onOpenChange }: NewProjectModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  // Assuming createProject is added to useProjectStore or a similar store/hook
  // const { createProject, loading: isCreating } = useProjectStore(); 
  const [isCreating, setIsCreating] = useState(false); // Placeholder for actual loading state
  
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert("Project name is required.");
      return;
    }
    if (!user) {
      alert("You must be logged in to create a project.");
      return;
    }

    setIsCreating(true);
    try {
      // Placeholder for actual project creation logic
      console.log("Creating project:", {
        name: projectName,
        description: projectDescription,
        template: selectedTemplate || "blank", // Default to 'blank' if no template selected
        userId: user.id,
      });

      // Example: const newProject = await createProject({
      //   name: projectName,
      //   description: projectDescription,
      //   template: selectedTemplate || "blank",
      //   visibility: "private", // Default visibility
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After successful creation:
      // router.push(`/project/${newProject.id}`); // Or refresh list
      alert(`Project "${projectName}" created successfully! (Simulated)`);
      setProjectName("");
      setProjectDescription("");
      setSelectedTemplate("");
      onOpenChange(false);
      // Potentially call fetchProjects() from useProjectStore if it's passed or available globally
    } catch (error) {
      console.error("Failed to create project:", error);
      alert(`Failed to create project: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setProjectName("");
      setProjectDescription("");
      setSelectedTemplate("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Start a new project from scratch or choose a template to get started quickly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome App"
              disabled={isCreating}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="projectDescription">Description (Optional)</Label>
            <Textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="A brief description of your project."
              className="min-h-[80px]"
              disabled={isCreating}
            />
          </div>

          <div>
            <ProjectTemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateSelect={setSelectedTemplate}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject} disabled={isCreating || !projectName.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
