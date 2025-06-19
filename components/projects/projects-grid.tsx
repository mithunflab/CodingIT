"use client";

import { useRouter } from "next/navigation";
import { 
  Clock, 
  Globe, 
  Lock, 
  MoreHorizontal,
  Plus,
  Trash2,
  Share,
  Edit,
  Eye,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

interface ProjectsGridProps {
  projects: Project[];
  loading?: boolean;
  showActions?: boolean;
  onCreateProject?: () => void;
  onDeleteProject?: (projectId: string) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  className?: string;
}

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

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

export function ProjectsGrid({
  projects,
  loading = false,
  showActions = true,
  onCreateProject,
  onDeleteProject,
  emptyStateTitle = "No projects yet",
  emptyStateDescription = "Create your first project to get started",
  className = ""
}: ProjectsGridProps) {
  const router = useRouter();

  const handleDeleteProject = async (projectId: string) => {
    if (onDeleteProject && confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      onDeleteProject(projectId);
    }
  };

  const ProjectCard = ({ project, isLoading = false }: { project?: Project; isLoading?: boolean }) => {
    if (isLoading) {
      return (
        <Card className="animate-pulse">
          <CardContent className="p-4">
            <div className="h-32 bg-muted rounded-md mb-4"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      );
    }

    if (!project) return null;

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
        <CardContent className="p-4">
          {/* Project Preview */}
          <div 
            className="h-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-md mb-4 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform cursor-pointer"
            onClick={() => router.push(`/project/${project.id}`)}
          >
            {getProjectIcon(project.template)}
          </div>
          
          {/* Project Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 
                className="font-semibold truncate flex-1 cursor-pointer hover:text-primary"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                {project.name}
              </h3>
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
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
                Edited {formatTimeAgo(project.updated_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCard key={i} isLoading />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🚀</div>
        <h3 className="text-lg font-semibold mb-2">{emptyStateTitle}</h3>
        <p className="text-muted-foreground mb-4">{emptyStateDescription}</p>
        {onCreateProject && (
          <Button onClick={onCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Project Setup
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// Community projects grid variant
export function CommunityProjectsGrid({ className = "" }: { className?: string }) {
  const router = useRouter();
  
  const communityProjects = [
    {
      id: "community-1",
      name: "AI Chat Assistant",
      description: "A modern chat interface with AI integration using OpenAI API",
      template: "nextjs-developer",
      author: "Community",
      stars: 24,
      tags: ["AI", "Chat", "TypeScript"]
    },
    {
      id: "community-2", 
      name: "Data Dashboard",
      description: "Interactive data visualization dashboard with real-time updates",
      template: "streamlit-developer",
      author: "Community",
      stars: 18,
      tags: ["Data", "Visualization", "Python"]
    },
    {
      id: "community-3",
      name: "Portfolio Website",
      description: "Clean and modern portfolio template with animations",
      template: "vue-developer",
      author: "Community",
      stars: 31,
      tags: ["Portfolio", "Vue", "Animation"]
    },
    {
      id: "community-4",
      name: "E-commerce Store",
      description: "Full-stack e-commerce solution with payment integration",
      template: "nextjs-developer", 
      author: "Community",
      stars: 45,
      tags: ["E-commerce", "Payments", "React"]
    },
    {
      id: "community-5",
      name: "ML Model Trainer",
      description: "Train and deploy machine learning models with ease",
      template: "code-interpreter-v1",
      author: "Community", 
      stars: 19,
      tags: ["ML", "Training", "Python"]
    },
    {
      id: "community-6",
      name: "Task Management",
      description: "Kanban-style task management application",
      template: "vue-developer",
      author: "Community",
      stars: 27,
      tags: ["Productivity", "Kanban", "Vue"]
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {communityProjects.map((project) => (
        <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-border">
          <CardContent className="p-4">
            <div className="h-32 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-green-900/20 rounded-md mb-4 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
              {getProjectIcon(project.template)}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold truncate flex-1">
                  {project.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {project.stars}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {getTemplateLabel(project.template)}
                </Badge>
                {project.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>by {project.author}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}