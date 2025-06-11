import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ChatSession, Project, ChatSidebarState } from "@/lib/types/chat-sidebar"

interface ChatSidebarStore extends ChatSidebarState {
  // State
  isOpen: boolean
  activeTab: "chats" | "projects"
  searchQuery: string
  selectedChatId: string | null
  isLoading: boolean
  error: string | null
  chatSessions: ChatSession[]
  projects: Project[]

  // Actions
  setIsOpen: (isOpen: boolean) => void
  setActiveTab: (tab: "chats" | "projects") => void
  setSearchQuery: (query: string) => void
  setSelectedChatId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Chat Sessions
  addChatSession: (session: ChatSession) => void
  updateChatSession: (id: string, updates: Partial<ChatSession>) => void
  deleteChatSession: (id: string) => void
  getChatSession: (id: string) => ChatSession | undefined

  // Projects
  saveAsProject: (chatId: string, projectName: string, description?: string) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  toggleProjectStar: (id: string) => void

  // Search and Filter
  getFilteredChats: () => ChatSession[]
  getFilteredProjects: () => Project[]

  // Utilities
  clearAll: () => void
  exportData: () => string
  importData: (data: string) => void
}

export const useChatSidebarStore = create<ChatSidebarStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOpen: false, // Sidebar is now always hidden
      activeTab: "chats",
      searchQuery: "",
      selectedChatId: null,
      isLoading: false,
      error: null,
      chatSessions: [],
      projects: [],

      // Basic actions
      setIsOpen: () => {}, // No-op as sidebar is always hidden
      setActiveTab: (activeTab) => set({ activeTab }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedChatId: (selectedChatId) => set({ selectedChatId }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Chat session management
      addChatSession: (session) =>
        set((state) => ({
          chatSessions: [session, ...state.chatSessions],
        })),

      updateChatSession: (id, updates) =>
        set((state) => ({
          chatSessions: state.chatSessions.map((session) =>
            session.id === id ? { ...session, ...updates, updatedAt: new Date() } : session,
          ),
        })),

      deleteChatSession: (id) =>
        set((state) => ({
          chatSessions: state.chatSessions.filter((session) => session.id !== id),
          projects: state.projects.filter((project) => project.chatSessionId !== id),
          selectedChatId: state.selectedChatId === id ? null : state.selectedChatId,
        })),

      getChatSession: (id) => get().chatSessions.find((session) => session.id === id),

      // Project management
      saveAsProject: (chatId, projectName, description) => {
        const chatSession = get().getChatSession(chatId)
        if (!chatSession) return

        const project: Project = {
          id: `project_${crypto.randomUUID()}`,
          name: projectName,
          description,
          chatSessionId: chatId,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          isStarred: false,
        }

        set((state) => ({
          projects: [project, ...state.projects],
          chatSessions: state.chatSessions.map((session) =>
            session.id === chatId ? { ...session, isProject: true, projectName, updatedAt: new Date() } : session,
          ),
        }))
      },

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project,
          ),
        })),

      deleteProject: (id) => {
        const project = get().projects.find((p) => p.id === id)
        if (!project) return

        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          chatSessions: state.chatSessions.map((session) =>
            session.id === project.chatSessionId ? { ...session, isProject: false, projectName: undefined } : session,
          ),
        }))
      },

      toggleProjectStar: (id) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, isStarred: !project.isStarred } : project,
          ),
        })),

      // Search and filter
      getFilteredChats: () => {
        const { chatSessions, searchQuery } = get()
        if (!searchQuery.trim()) return chatSessions

        const query = searchQuery.toLowerCase()
        return chatSessions.filter(
          (session) =>
            session.title.toLowerCase().includes(query) ||
            session.messages.some((msg: any) => msg.content.toLowerCase().includes(query)),
        )
      },

      getFilteredProjects: () => {
        const { projects, searchQuery } = get()
        if (!searchQuery.trim()) return projects

        const query = searchQuery.toLowerCase()
        return projects.filter(
          (project) =>
            project.name.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query) ||
            project.tags?.some((tag: string) => tag.toLowerCase().includes(query)),
        )
      },

      // Utilities
      clearAll: () =>
        set({
          chatSessions: [],
          projects: [],
          selectedChatId: null,
          searchQuery: "",
          error: null,
        }),

      exportData: () => {
        const { chatSessions, projects } = get()
        return JSON.stringify({ chatSessions, projects, exportedAt: new Date() }, null, 2)
      },

      importData: (data) => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.chatSessions && parsed.projects) {
            set({
              chatSessions: parsed.chatSessions,
              projects: parsed.projects,
              error: null,
            })
          }
        } catch (error) {
          set({ error: "Failed to import data. Invalid format." })
        }
      },
    }),
    {
      name: "chat-sidebar-storage",
      partialize: (state) => ({
        // isOpen: state.isOpen, // No longer persisted as it's always effectively false
        activeTab: state.activeTab,
        chatSessions: state.chatSessions,
        projects: state.projects,
      }),
    },
  ),
)
