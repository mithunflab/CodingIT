"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  Clock, 
  Globe, 
  Lock, 
  MoreHorizontal,
  ArrowLeft,
  Grid3X3,
  List,
  Trash2,
  Share,
  Edit,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProjectStore }  from "@/lib/stores/projects";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";


interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: "private" | "public";
  template?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
export default function ProjectsListingPage() {
  const router = useRouter();
  const { user, isLoading: authIsLoading, authError } = useAuth(); // Destructure isLoading and authError
  const { projects, loading: projectsLoading, fetchProjects, deleteProject, error: projectError } = useProjectStore(); // Rename loading to projectsLoading
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("last_edited");
  const [filterBy, setFilterBy] = useState("all_creators");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [, setShowUploadModal] = useState(false);
  const userId = user?.id; // Extract userId for stable dependency

  useEffect(() => {
    console.log('[ProjectsListingPage] AuthContext values - userId:', userId, 'authIsLoading:', authIsLoading, 'authError:', authError);
    if (userId && !authIsLoading) { // Ensure auth is not loading before fetching and user exists
      console.log('[ProjectsListingPage] User ID found and auth not loading, calling fetchProjects.');
      fetchProjects();
    } else if (authIsLoading) {
      console.log('[ProjectsListingPage] Waiting for auth to complete...');
    } else if (!userId) { // Check userId instead of user object
      console.log('[ProjectsListingPage] No user ID found, not calling fetchProjects.');
    }
  }, [userId, authIsLoading, authError, fetchProjects]); // Use userId in dependency array

  useEffect(() => {
    console.log('[ProjectsListingPage] ProjectStore values - projectsLoading:', projectsLoading, 'projectError:', projectError, 'projectsCount:', projects.length);
  }, [projectsLoading, projectError, projects]);

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
      await deleteProject(projectId);
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
      <CardContent className="p-4">
        {/* Project Preview */}
        <div className="h-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-md mb-4 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform cursor-pointer"
             onClick={() => router.push(`/project/${project.id}`)}>
          {getProjectIcon(project.template)}
        </div>
        
        {/* Project Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold truncate flex-1 cursor-pointer hover:text-primary"
                onClick={() => router.push(`/project/${project.id}`)}>
              {project.name}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/project/${project.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Open Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Share Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-2">
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
          
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Edited {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

  // Determine overall loading state
  const pageIsLoading = authIsLoading || projectsLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage and organize your CodinIT projects
            </p>
          </div>
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_edited">Last edited</SelectItem>
                <SelectItem value="created">Date created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_creators">All projects</SelectItem>
                <SelectItem value="my_projects">My projects</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
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

        {/* Content */}
        {pageIsLoading ? (
          <div className="space-y-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-32 bg-muted rounded-md mb-4"></div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            )}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No projects match "${searchQuery}"`
                : "Create your first project to get started with CodinIT"
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowUploadModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <ProjectTableRow key={project.id} project={project} />
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
