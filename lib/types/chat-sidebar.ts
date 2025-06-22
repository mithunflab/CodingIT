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
  projectId?: string // Added to link chat sessions to projects
  lastMessage?: string // Added to store a snippet of the last message
  timestamp: Date // Added to store the timestamp of the last message
  isActive?: boolean // Added to indicate if the chat session is active
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
