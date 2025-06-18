import { create } from "zustand";

interface Project {
  [x: string]: any;
  tags: any;
  id: string;
  name: string;
  description?: string;
  visibility: "private" | "public";
  template?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  
  fetchProjects: () => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    visibility: "private" | "public";
    template?: string;
  }) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {};
  
  // Use the shared Supabase client
  const { supabase } = await import('@/lib/supabase'); 
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('[getAuthHeaders] Supabase getSession result - session:', session?.user?.id, 'error:', sessionError);
  
  if (sessionError) {
    console.error('[getAuthHeaders] Error getting session:', sessionError.message);
    throw new Error('Failed to get session for auth headers');
  }
  
  if (!session?.access_token) {
    console.warn('[getAuthHeaders] No access token in session. Throwing "Not authenticated".');
    throw new Error('Not authenticated');
  }
  
  console.log('[getAuthHeaders] Access token found, returning auth headers.');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    console.log('[ProjectStore] fetchProjects started.');
    set({ loading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      console.log('[ProjectStore] fetchProjects - auth headers obtained:', headers ? Object.keys(headers) : 'null');
      
      const response = await fetch('/api/projects', { headers });
      console.log('[ProjectStore] fetchProjects - API response status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ProjectStore] fetchProjects - API error response text:', errorText);
        throw new Error(`Failed to fetch projects. Status: ${response.status}. Message: ${response.statusText}. Details: ${errorText.substring(0, 200)}`);
      }
      
      const responseData = await response.json();
      console.log('[ProjectStore] fetchProjects - API response data:', responseData);
      const projects = responseData.projects; // Assuming API returns { projects: [] }
      set({ projects, loading: false });
      console.log('[ProjectStore] fetchProjects successful, projects count:', projects?.length);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('[ProjectStore] fetchProjects error:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const { project } = await response.json();

      set((state) => ({
        projects: [project, ...state.projects],
        loading: false,
      }));

      return project;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('[ProjectStore] createProject error:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    console.log(`[ProjectStore] updateProject started for ID: ${id}`);
    set({ loading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const { project } = await response.json();

      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? project : p
        ),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`[ProjectStore] updateProject error for ID ${id}:`, errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteProject: async (id) => {
    console.log(`[ProjectStore] deleteProject started for ID: ${id}`);
    set({ loading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`[ProjectStore] deleteProject error for ID ${id}:`, errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));

// Log store changes for debugging
if (typeof window !== 'undefined') { // Ensure this only runs on the client
  const unsub = useProjectStore.subscribe(
    (state, prevState) => {
      console.log('[ProjectStore] State changed:', {
        loadingChanged: state.loading !== prevState.loading ? `${prevState.loading} -> ${state.loading}` : undefined,
        errorChanged: state.error !== prevState.error ? `${prevState.error} -> ${state.error}` : undefined,
        projectsCountChanged: state.projects.length !== prevState.projects.length ? `${prevState.projects.length} -> ${state.projects.length}` : undefined,
        newLoadingState: state.loading,
        newErrorState: state.error,
        newProjectsCount: state.projects.length,
      });
    }
  );
  // console.log('[ProjectStore] Subscribed to state changes.');
  // Consider unsubscribing if component unmounts, though for a global store it might not be necessary
  // or could be handled differently if this store was tied to a React component lifecycle.
}
