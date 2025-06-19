"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Clock, 
  ArrowLeft,
  Globe,
  Lock,
  MoreHorizontal,
  Eye,
  Edit,
  Share,
  Trash2,
  RefreshCw
} from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// New Components
import { SimpleProjectModal } from "@/components/modals/simple-project-modal";
import { LoadingAnimation, ProjectCardsLoader } from "@/components/ui/loading-animation";

// Hooks and Stores
import { useProjectStore } from "@/lib/stores/projects";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: "private" | "public";
  template?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

type ViewMode = "grid" | "list";
type SortOption = "last_edited" | "created" | "name";
type FilterOption = "all" | "my_projects" | "public" | "private";

export default function ProjectsPage() {
  const router = useRouter();
  const { user, isLoading: authIsLoading, authError } = useAuth();
  const { projects, loading: projectsLoading, error: projectError, fetchProjects, deleteProject } = useProjectStore();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("last_edited");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const userId = user?.id;

  // Fetch projects when user is available
  useEffect(() => {
    if (userId && !authIsLoading && !authError) {
      console.log('[ProjectsPage] Fetching projects for user:', userId);
      fetchProjects();
    } else if (authIsLoading) {
      console.log('[ProjectsPage] Waiting for auth to complete...');
    } else if (!userId) { 
      console.log('[ProjectsPage] No user ID found, not calling fetchProjects.');
    }
  }, [userId, authIsLoading, authError, fetchProjects]); 

  useEffect(() => {
    console.log('[ProjectsPage] ProjectStore values - projectsLoading:', projectsLoading, 'projectError:', projectError, 'projectsCount:', projects.length);
  }, [projectsLoading, projectError, projects]);

  // Filter and sort projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterBy === "my_projects") {
      return matchesSearch && project.user_id === user?.id;
    }
    if (filterBy === "public") {
      return matchesSearch && project.visibility === "public";
    }
    if (filterBy === "private") {
      return matchesSearch && project.visibility === "private";
    }
    
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "last_edited") {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    if (sortBy === "created") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  // Helper functions
  const getProjectIcon = (template?: string) => {
    switch (template) {
      case "nextjs-developer":
        return "⚛️";
      case "vue-developer":
        return "💚";
      case "streamlit-developer":
        return "🐍";
      case "code-interpreter-v1":
        return "📊";
      default:
        return "🚀";
    }
  };

  const getTemplateLabel = (template?: string) => {
    switch (template) {
      case "nextjs-developer":
        return "Next.js";
      case "vue-developer":
        return "Vue.js";
      case "streamlit-developer":
        return "Streamlit";
      case "code-interpreter-v1":
        return "Python";
      default:
        return "Custom";
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  const handleRefresh = () => {
    fetchProjects();
  };

  // Project Card Component
  const ProjectCard = ({ project }: { project: Project }) => (
    <Card 
      className="group hover:shadow-md transition-all duration-200 cursor-pointer h-full hover:scale-[1.02] hover:border-blue-200 dark:hover:border-blue-800"
      onClick={() => router.push(`/project/${project.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl group-hover:scale-110 transition-transform">{getProjectIcon(project.template)}</span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {getTemplateLabel(project.template)}
                </Badge>
                <Badge variant={project.visibility === "public" ? "secondary" : "outline"} className="text-xs">
                  {project.visibility === "public" ? (
                    <><Globe className="w-3 h-3 mr-1" />Public</>
                  ) : (
                    <><Lock className="w-3 h-3 mr-1" />Private</>
                  )}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/project/${project.id}`); }}>
                <Eye className="h-4 w-4 mr-2" />
                Open Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Share className="h-4 w-4 mr-2" />
                Share Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Edited {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  // Project Table Row Component
  const ProjectTableRow = ({ project }: { project: Project }) => (
    <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/project/${project.id}`)}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getProjectIcon(project.template)}</span>
          <div>
            <div className="font-semibold">{project.name}</div>
            {project.description && (
              <div className="text-sm text-muted-foreground truncate max-w-xs">
                {project.description}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {getTemplateLabel(project.template)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={project.visibility === "public" ? "secondary" : "outline"} className="text-xs">
          {project.visibility === "public" ? (
            <><Globe className="w-3 h-3 mr-1" />Public</>
          ) : (
            <><Lock className="w-3 h-3 mr-1" />Private</>
          )}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/project/${project.id}`); }}>
              <Eye className="h-4 w-4 mr-2" />
              Open Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Share className="h-4 w-4 mr-2" />
              Share Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  const pageIsLoading = authIsLoading || projectsLoading;

  // Loading state with custom animations
  if (pageIsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-9 bg-muted rounded animate-pulse" />
            <div className="flex-1">
              <div className="h-8 bg-muted rounded w-32 mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-64 animate-pulse" />
            </div>
            <div className="w-28 h-10 bg-muted rounded animate-pulse" />
          </div>

          {/* Filters skeleton */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="w-32 h-10 bg-muted rounded animate-pulse" />
              <div className="w-32 h-10 bg-muted rounded animate-pulse" />
              <div className="w-20 h-10 bg-muted rounded animate-pulse" />
            </div>
          </div>

          {/* Main loading animation */}
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingAnimation variant="folder" />
          </div>

          {/* Project cards skeleton */}
          <ProjectCardsLoader />
        </div>
      </div>
    );
  }

  // Error state with custom animation
  if (projectError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <LoadingAnimation variant="circuit" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-destructive">Connection Error</h3>
              <p className="text-muted-foreground mb-6">{projectError}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => router.push('/')}>
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Projects
            </h1>
            <p className="text-muted-foreground">
              Manage and organize your CodinIT.dev projects
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="my_projects">My Projects</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_edited">Last Edited</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects Display */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <LoadingAnimation variant="dna" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery 
                ? `No projects match "${searchQuery}". Try adjusting your search or filters.`
                : "Create your first project to start building with AI assistance. Choose from templates or start from scratch."
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <ProjectTableRow key={project.id} project={project} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {/* Simple Project Creation Modal */}
        <SimpleProjectModal
          isOpen={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      </div>
    </div>
  );
}