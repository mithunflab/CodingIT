"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Star, 
  Clock, 
  FolderOpen,
  Settings,
  ExternalLink,
  MoreHorizontal,
  BookOpen,
  Users,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Copy
} from "lucide-react";
import { useProjectStore } from "@/lib/stores/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectKnowledgeModal } from "@/components/modals/project-knowledge-modal";
import { ProjectTemplateSelector } from "@/components/projects/project-template-selector";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: "private" | "public";
  template?: string;
  status?: string;
  language?: string;
  framework?: string;
  tags: string[];
  file_count?: number;
  total_size?: number;
  last_activity_at?: string;
  deployed_url?: string;
  deployment_status?: string;
  is_public?: boolean;
  is_featured?: boolean;
  star_count?: number;
  created_at: string;
  updated_at: string;
}

type ViewMode = "grid" | "list";
type SortOption = "updated" | "created" | "name" | "stars";
type FilterOption = "all" | "private" | "public" | "shared";

export default function ProjectsPage() {
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject } = useProjectStore();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  
  // Form State
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    visibility: "private" as const,
    template: "",
    is_public: false
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter and sort projects
  const filteredProjects = React.useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply visibility filter
    if (filterBy !== "all") {
      filtered = filtered.filter(project => project.visibility === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "stars":
          return b.star_count - a.star_count;
        case "updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [projects, searchQuery, filterBy, sortBy]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      setCreateError("Project name is required");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await createProject({
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
        visibility: newProject.visibility,
        template: newProject.template || undefined
      });

      // Reset form
      setNewProject({
        name: "",
        description: "",
        visibility: "private",
        template: "",
        is_public: false
      });
      setShowCreateDialog(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProject(project.id);
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleOpenKnowledge = (project: Project) => {
    setSelectedProject(project);
    setShowKnowledgeModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6"> {/* Reduced mb */}
          <div className="flex items-center gap-4">
            <Link href="/" passHref>
              <Button variant="outline" size="icon" aria-label="Go back home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="text-muted-foreground text-sm mt-1"> {/* text-sm and reduced mt */}
                Create, manage, and deploy your applications with AI assistance.
              </p>
            </div>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 shrink-0"> {/* Added shrink-0 */}
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new project with AI assistance. Choose a template or start from scratch.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="My Awesome Project"
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={newProject.visibility}
                      onValueChange={(value) => setNewProject(prev => ({ ...prev, visibility: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4" />
                            Private - Only you can see this
                          </div>
                        </SelectItem>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Public - Anyone can view
                          </div>
                        </SelectItem>
                        <SelectItem value="shared">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Shared - Invite collaborators
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your project does..."
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <ProjectTemplateSelector
                  selectedTemplate={newProject.template}
                  onTemplateSelect={(template) => setNewProject(prev => ({ ...prev, template }))}
                />

                {createError && (
                  <Alert className="border-red-200 bg-red-50 text-red-800">
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={isCreating}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Controls - Search bar on top, filters/sort/view on the right */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="flex-grow w-full md:w-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full" // Ensure full width on mobile
            />
          </div>
          
          {/* Filters, Sort, and View Mode */}
          <div className="flex items-center gap-2 flex-shrink-0"> {/* flex-shrink-0 to prevent shrinking */}
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
              <SelectTrigger className="w-auto md:w-32"> {/* Adjusted width */}
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-auto md:w-32"> {/* Adjusted width */}
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Sort: Updated</SelectItem>
                <SelectItem value="created">Sort: Created</SelectItem>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="stars">Sort: Stars</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"} // Changed to secondary for active
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"} // Changed to secondary for active
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            {projects.length === 0 ? (
              <div className="space-y-4">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No projects yet</h3>
                  <p className="text-muted-foreground">Create your first project to get started with AI-powered development.</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">No projects found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Projects Grid/List */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                onDelete={() => handleDeleteProject(project)}
                onOpenKnowledge={() => handleOpenKnowledge(project)}
              />
            ))}
          </div>
        )}

        {/* Project Knowledge Modal */}
        {selectedProject && (
          <ProjectKnowledgeModal
            open={showKnowledgeModal}
            onOpenChange={setShowKnowledgeModal}
            project={selectedProject}
          />
        )}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  viewMode: ViewMode;
  onDelete: () => void;
  onOpenKnowledge: () => void;
}

function ProjectCard({ project, viewMode, onDelete, onOpenKnowledge }: ProjectCardProps) {
  const [isStarred, setIsStarred] = useState(false);

  const getProjectIcon = (framework?: string) => {
    switch (framework?.toLowerCase()) {
      case "nextjs":
      case "react":
        return "⚛️";
      case "vue":
        return "💚";
      case "python":
      case "fastapi":
      case "django":
        return "🐍";
      case "streamlit":
        return "📊";
      case "nodejs":
      case "node":
        return "🟢";
      case "typescript":
        return "🔷";
      case "javascript":
        return "🟨";
      case "angular":
        return "🅰️";
      case "svelte":
        return "🧡";
      case "flask":
        return "🌶️";
      case "express":
        return "🚂";
      case "laravel":
        return "🎵";
      case "spring":
        return "🍃";
      case "ruby":
      case "rails":
        return "💎";
      case "go":
      case "golang":
        return "🐹";
      case "rust":
        return "🦀";
      case "php":
        return "🐘";
      case "java":
        return "☕";
      case "c#":
      case "csharp":
        return "💜";
      case "swift":
        return "🦉";
      case "kotlin":
        return "🟠";
      default:
        return "📁";
    }
  };

  const handleToggleStar = async () => {
    setIsStarred(!isStarred);
    // In a real implementation, you'd update the star status
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "deployed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "deploying":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-2xl">{getProjectIcon(project.framework)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{project.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {project.visibility}
                </Badge>
                {project.deployment_status && (
                  <Badge className={`text-xs ${getStatusColor(project.deployment_status)}`}>
                    {project.deployment_status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {project.description || "No description"}
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>{project.framework}</span>
                <span>{project.file_count} files</span>
                <span>Updated {formatDate(project.updated_at)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenKnowledge}
              className="flex items-center gap-1"
            >
              <BookOpen className="h-4 w-4" />
              Knowledge
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{getProjectIcon(project.framework)}</div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{project.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {project.visibility}
                </Badge>
                {project.deployment_status && (
                  <Badge className={`text-xs ${getStatusColor(project.deployment_status)}`}>
                    {project.deployment_status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenKnowledge}>
                <BookOpen className="h-4 w-4 mr-2" />
                Knowledge Base
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <CardDescription className="line-clamp-2">
          {project.description || "No description provided"}
        </CardDescription>
        
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{project.framework || 'Unknown'}</span>
            <span>{project.file_count} files</span>
          </div>
          <div className="flex items-center gap-2">
            {project.star_count && project.star_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{project.star_count}</span>
              </div>
            )}
            <Clock className="h-3 w-3" />
            <span>{formatDate(project.updated_at)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenKnowledge}>
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStar}
            className={isStarred ? "text-yellow-500" : ""}
          >
            <Star className={`h-4 w-4 ${isStarred ? "fill-current" : ""}`} />
          </Button>
        </div>
      </CardContent> 
    </Card>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
