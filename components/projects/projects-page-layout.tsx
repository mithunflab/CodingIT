"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectKnowledgePanel } from "./project-knowledge-panel";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Star, 
  MoreHorizontal, 
  Send,
  Plus,
  Minimize2,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: "private" | "public";
  template?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectPageLayoutProps {
  project: Project;
}

export function ProjectPageLayout({ project }: ProjectPageLayoutProps) {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [hasKnowledge, setHasKnowledge] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    // Handle sending message
    console.log("Sending message:", chatInput);
    setChatInput("");
  };

  const handleFileUpload = (files: FileList) => {
    console.log("Uploading files:", Array.from(files).map(f => f.name));
    // Handle file upload
    setHasKnowledge(true);
  };

  const handleAddTextContent = () => {
    console.log("Adding text content");
    // Handle adding text content
  };

  const handleConnectGitHub = () => {
    console.log("Connecting to GitHub");
    // Handle GitHub connection
  };

  const handleConnectGoogleDrive = () => {
    console.log("Connecting to Google Drive");
    // Handle Google Drive connection
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/projects')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">All projects</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Project Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{project.name}</h1>
                <Badge variant="secondary" className="text-xs">
                  {project.visibility === 'private' ? 'Private' : 'Public'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Star className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit project</DropdownMenuItem>
                    <DropdownMenuItem>Share project</DropdownMenuItem>
                    <DropdownMenuItem>Export chat</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Delete project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col justify-center items-center p-6">
            <div className="text-center max-w-md">
              <p className="text-muted-foreground mb-6">
                Start a chat to keep conversations organized and re-use project knowledge.
              </p>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="relative">
              <div className="relative">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="How can I help you today?"
                  className="pr-20 py-3 min-h-[48px]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!chatInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Claude Sonnet 4</span>
                <span>⌘</span>
              </div>
            </form>
          </div>
        </div>

        {/* Project Knowledge Panel */}
        <ProjectKnowledgePanel
          projectId={project.id}
          hasKnowledge={hasKnowledge}
          onFileUpload={handleFileUpload}
          onAddTextContent={handleAddTextContent}
          onConnectGitHub={handleConnectGitHub}
          onConnectGoogleDrive={handleConnectGoogleDrive}
        />
      </div>
    </div>
  );
}