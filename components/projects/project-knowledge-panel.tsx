"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProjectInstructionsModal } from "@/components/modals/project-instructions-modal";
import { GitHubImportModal } from "@/components/modals/github-import-modal";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/stores/projects";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Upload, 
  FileText, 
  Github, 
  HardDrive,
  Info,
  ChevronRight
} from "lucide-react";

interface ProjectKnowledgePanelProps {
  projectId?: string;
  hasKnowledge?: boolean;
  onFileUpload?: (files: FileList) => void;
  onAddTextContent?: () => void;
  onConnectGitHub?: () => void;
  onConnectGoogleDrive?: () => void;
}

export function ProjectKnowledgePanel({
  projectId,
  hasKnowledge = false,
  onFileUpload,
  onAddTextContent,
  onConnectGitHub,
  onConnectGoogleDrive
}: ProjectKnowledgePanelProps) {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const { toast } = useToast();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showGitHubImport, setShowGitHubImport] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && onFileUpload) {
      onFileUpload(files);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setShowUploadMenu(false);
  };

  const handleGitHubImport = () => {
    setShowGitHubImport(true);
    setShowUploadMenu(false);
  };

  // Handle GitHub repository import and create project
  const handleGitHubRepoImport = async (files: File[], analysis: any, repositoryInfo: { owner: string; repo: string }) => {
    setIsCreatingProject(true);
    
    try {
      // Create a new project from the GitHub repository
      const projectData = {
        name: repositoryInfo.repo,
        description: `Imported from GitHub: ${repositoryInfo.owner}/${repositoryInfo.repo}`,
        visibility: "private" as const,
        template: analysis?.structure?.architecture?.type || "custom",
        github_repo: `${repositoryInfo.owner}/${repositoryInfo.repo}`,
        github_owner: repositoryInfo.owner
      };

      const newProject = await createProject(projectData);

      // Upload the files to the project's knowledge base
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        
        // Add repository metadata
        formData.append('github_repo', `${repositoryInfo.owner}/${repositoryInfo.repo}`);
        formData.append('analysis', JSON.stringify(analysis));

        const response = await fetch(`/api/projects/${newProject.id}/github-import`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload repository files to project');
        }
      }

      toast({
        title: "GitHub Repository Imported",
        description: `Successfully created project "${repositoryInfo.repo}" with ${files.length} files from GitHub.`,
      });

      // Navigate to the new project
      router.push(`/project/${newProject.id}`);

    } catch (error) {
      console.error('Failed to create project from GitHub repository:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to create project from GitHub repository.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const uploadOptions = [
    {
      icon: Upload,
      label: "Upload from device",
      onClick: handleUploadClick
    },
    {
      icon: FileText,
      label: "Add text content",
      onClick: () => {
        onAddTextContent?.();
        setShowUploadMenu(false);
      }
    },
    {
      icon: Github,
      label: "Import from GitHub",
      onClick: handleGitHubImport,
      badge: "Create Project"
    },
    {
      icon: HardDrive,
      label: "Google Drive",
      onClick: () => {
        onConnectGoogleDrive?.();
        setShowUploadMenu(false);
      },
      hasChevron: true
    }
  ];

  return (
    <div className="w-80 bg-background border-l">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.xml,.yaml,.yml,.js,.ts,.jsx,.tsx,.py,.html,.css,.scss,.less"
      />

      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Project knowledge</h3>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowUploadMenu(!showUploadMenu)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            {/* Upload menu dropdown */}
            {showUploadMenu && (
              <div className="absolute right-0 top-9 z-50 w-56 bg-background border rounded-md shadow-md">
                {uploadOptions.map((option, index) => (
                  <div key={option.label}>
                    <button
                      onClick={option.onClick}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted text-left"
                    >
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                        {option.badge && (
                          <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.hasChevron && <ChevronRight className="h-4 w-4" />}
                    </button>
                    {index < uploadOptions.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Set project instructions</span>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => setShowInstructions(true)}
        >
          Set instructions
        </Button>
      </div>

      {/* Knowledge Status */}
      <div className="p-4">
        {hasKnowledge ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Knowledge base</p>
            {/* This would show the actual knowledge items */}
            <div className="space-y-2">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Project documentation</span>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No knowledge added yet. Add PDFs, documents, GitHub repositories, or other text to the project knowledge base that Claude will reference in every project conversation.
            </p>
          </div>
        )}
      </div>

      {/* GitHub Import Modal */}
      <GitHubImportModal
        open={showGitHubImport}
        onOpenChange={setShowGitHubImport}
        onImport={handleGitHubRepoImport}
        isLoading={isCreatingProject}
      />

      {/* Project Instructions Modal */}
      <ProjectInstructionsModal
        isOpen={showInstructions}
        onOpenChange={setShowInstructions}
        projectId={projectId}
      />
    </div>
  );
}