import { createClient } from '@/lib/supabase/server'
import { useProjectStore, Project } from '@/lib/stores/projects'
import { nanoid } from 'nanoid'
import { cookies } from 'next/headers' // Import cookies

export interface AutoProjectConfig {
  title?: string
  description?: string
  framework?: 'nextjs' | 'react' | 'vue' | 'streamlit' | 'gradio'
  isPublic?: boolean
}

export interface ProjectMetadata {
  id: string
  title: string
  description: string
  framework: string
  createdAt: string
  updatedAt: string
  userId: string
  isPublic: boolean
  chatSessionId?: string
  isAutoCreated: boolean
}

export class AutoProjectCreationService {
  private projectStore = useProjectStore.getState()

  /**
   * Detects if this is a first-time prompt in a new project context
   */
  async isFirstTimeProjectPrompt(chatSessionId: string): Promise<boolean> {
    try {
      const cookieStore = await cookies() // Get cookies in request scope
      const supabase = createClient(cookieStore) // Initialize client here
      // Check if there's already a project associated with this chat session
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('chat_session_id', chatSessionId)
        .single()

      return !existingProject
    } catch (error) {
      // If no project found, this is likely a first-time prompt
      return true
    }
  }

  /**
   * Analyzes the user prompt to extract project details
   */
  analyzePromptForProjectDetails(prompt: string): AutoProjectConfig {
    const config: AutoProjectConfig = {
      isPublic: false
    }

    // Extract potential project title from prompt
    const titleMatch = prompt.match(/(?:create|build|make)\s+(?:a|an)?\s*([^.!?]+)/i)
    if (titleMatch) {
      config.title = titleMatch[1].trim().slice(0, 50) // Limit title length
    }

    // Detect framework mentions
    const frameworkKeywords = {
      nextjs: ['next.js', 'nextjs', 'next'],
      react: ['react', 'react app'],
      vue: ['vue', 'vue.js', 'vuejs'],
      streamlit: ['streamlit'],
      gradio: ['gradio']
    }

    for (const [framework, keywords] of Object.entries(frameworkKeywords)) {
      if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
        config.framework = framework as AutoProjectConfig['framework']
        break
      }
    }

    // Default framework if none detected
    if (!config.framework) {
      config.framework = 'nextjs'
    }

    // Generate title if not extracted
    if (!config.title) {
      config.title = `${config.framework.charAt(0).toUpperCase() + config.framework.slice(1)} Project`
    }

    // Generate description
    config.description = `Auto-created project based on: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"`

    return config
  }

  /**
   * Creates a new project automatically
   */
  async createAutoProject(
    prompt: string,
    chatSessionId: string,
    userId: string
  ): Promise<ProjectMetadata> {
    const config = this.analyzePromptForProjectDetails(prompt)
    const projectId = nanoid()
    const now = new Date().toISOString()

    const projectData: ProjectMetadata = {
      id: projectId,
      title: config.title || 'New Project',
      description: config.description || 'Auto-created project',
      framework: config.framework || 'nextjs',
      createdAt: now,
      updatedAt: now,
      userId,
      isPublic: config.isPublic || false,
      chatSessionId,
      isAutoCreated: true
    }

    try {
      const cookieStore = await cookies() // Get cookies in request scope
      const supabase = createClient(cookieStore) // Initialize client here
      // Insert project into database
      const { error: dbError } = await supabase
        .from('projects')
        .insert({
          id: projectData.id,
          title: projectData.title,
          description: projectData.description,
          framework: projectData.framework,
          created_at: projectData.createdAt,
          updated_at: projectData.updatedAt,
          user_id: projectData.userId,
          is_public: projectData.isPublic,
          chat_session_id: projectData.chatSessionId,
          is_auto_created: projectData.isAutoCreated,
          settings: {
            autoCreated: true,
            initialPrompt: prompt.slice(0, 500)
          }
        })

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      // Create a Project object that conforms to the Project interface
      const newProject: Project = {
        id: projectData.id,
        name: projectData.title, // Map title to name
        description: projectData.description,
        visibility: projectData.isPublic ? 'public' : 'private', // Default to private if not specified
        user_id: projectData.userId, // Map userId to user_id
        created_at: projectData.createdAt,
        updated_at: projectData.updatedAt,
        tags: [], // Initialize with empty array
        // template: undefined, // Optional, can be left undefined
      };

      // Update project store
      this.projectStore.projects.push(newProject) // Push the newProject object

      // Initialize project with basic structure
      await this.initializeProjectStructure(projectData)

      return projectData
    } catch (error) {
      console.error('Error creating auto project:', error)
      throw error
    }
  }

  /**
   * Initializes basic project structure in sandbox
   */
  private async initializeProjectStructure(project: ProjectMetadata): Promise<void> {
    try {
      const response = await fetch('/api/sandbox/init-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: project.id,
          framework: project.framework,
          autoCreated: true
        })
      })

      if (!response.ok) {
        console.warn('Failed to initialize project structure in sandbox')
      }
    } catch (error) {
      console.warn('Error initializing project structure:', error)
    }
  }

  /**
   * Main method to handle auto project creation flow
   */
  async handleFirstTimePrompt(
    prompt: string,
    chatSessionId: string,
    userId: string
  ): Promise<ProjectMetadata | null> {
    try {
      const isFirstTime = await this.isFirstTimeProjectPrompt(chatSessionId)
      
      if (!isFirstTime) {
        return null
      }

      // Only auto-create if the prompt seems to be requesting project creation
      if (this.shouldAutoCreateProject(prompt)) {
        return await this.createAutoProject(prompt, chatSessionId, userId)
      }

      return null
    } catch (error) {
      console.error('Error in auto project creation flow:', error)
      return null
    }
  }

  /**
   * Determines if a prompt warrants auto project creation
   */
  private shouldAutoCreateProject(prompt: string): boolean {
    const creationKeywords = [
      'create', 'build', 'make', 'develop', 'generate',
      'app', 'application', 'website', 'project', 'component',
      'dashboard', 'landing page', 'portfolio', 'blog'
    ]

    const lowercasePrompt = prompt.toLowerCase()
    
    // Check if prompt contains creation-related keywords
    const hasCreationIntent = creationKeywords.some(keyword => 
      lowercasePrompt.includes(keyword)
    )

    // Exclude simple questions or requests for information
    const isQuestion = lowercasePrompt.startsWith('what') || 
                      lowercasePrompt.startsWith('how') || 
                      lowercasePrompt.startsWith('why') ||
                      lowercasePrompt.includes('?')

    // Must have creation intent and not be a simple question
    return hasCreationIntent && !isQuestion && prompt.length > 10
  }
}

// Singleton instance
export const autoProjectCreation = new AutoProjectCreationService()

// Hook for React components
export function useAutoProjectCreation() {
  return {
    createAutoProject: autoProjectCreation.createAutoProject.bind(autoProjectCreation),
    handleFirstTimePrompt: autoProjectCreation.handleFirstTimePrompt.bind(autoProjectCreation),
    isFirstTimeProjectPrompt: autoProjectCreation.isFirstTimeProjectPrompt.bind(autoProjectCreation)
  }
}
