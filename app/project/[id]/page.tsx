"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectPageLayout } from "@/components/projects/projects-page-layout";
import { useProjectStore } from "@/lib/stores/projects";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: "private" | "public";
  template?: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectPage({ params }: any) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { projects, fetchProjects } = useProjectStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id;

  useEffect(() => {
    const loadProject = async () => {
      if (!user && !authLoading) {
        router.push('/auth/signin');
        return;
      }

      if (authLoading) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let foundProject = projects.find(p => p.id === projectId);

        if (!foundProject) {
          await fetchProjects();
          foundProject = projects.find(p => p.id === projectId);
        }

        if (!foundProject) {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          
          const response = await fetch(`/api/projects/${projectId}`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token || ''}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status === 404) {
              setError('Project not found');
              return;
            }
            if (response.status === 403) {
              setError('You do not have access to this project');
              return;
            }
            throw new Error(`Failed to fetch project: ${response.statusText}`);
          }

          const data = await response.json();
          foundProject = data.project;
        }

        if (foundProject) {
          setProject(foundProject);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, user, authLoading, projects, fetchProjects, router]);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-4xl mb-4">😞</div>
          <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/projects')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              All Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The project you are looking for does not exist or you do not have access to it.
          </p>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Render the project page
  return <ProjectPageLayout project={project} />;
}
