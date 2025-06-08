export interface ChatSession {
  id: string
  title: string
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }>
  createdAt: Date
  updatedAt: Date
  isProject?: boolean
  projectName?: string
  tags?: string[]
}

export interface Project {
  id: string
  name: string
  description?: string
  chatSessionId: string
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  isStarred?: boolean
}

export interface ChatSidebarState {
  isOpen: boolean
  activeTab: "chats" | "projects"
  searchQuery: string
  selectedChatId: string | null
  isLoading: boolean
  error: string | null
}