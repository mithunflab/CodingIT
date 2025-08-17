import { s3Storage, S3Utils } from './s3-storage'
import { v4 as uuidv4 } from 'uuid'

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  model?: string
  template?: string
  metadata?: {
    userID?: string
    teamID?: string
    executionTime?: number
    tokenCount?: number
    cost?: number
  }
}

export interface ChatSession {
  sessionId: string
  userId: string
  teamId?: string
  createdAt: string
  lastActivity: string
  messageCount: number
  title?: string
  tags?: string[]
  model?: string
  template?: string
  status: 'active' | 'archived' | 'deleted'
}

export interface UserChatSummary {
  userId: string
  totalSessions: number
  totalMessages: number
  lastActivity: string
  favoriteModels: string[]
  favoriteTemplates: string[]
  totalTokensUsed?: number
  totalCost?: number
}

export class ChatPersistence {
  /**
   * Create a new chat session
   */
  static async createSession(
    userId: string,
    teamId?: string,
    initialMessage?: Omit<ChatMessage, 'sessionId' | 'id' | 'timestamp'>
  ): Promise<ChatSession> {
    const sessionId = uuidv4()
    const now = new Date().toISOString()

    const session: ChatSession = {
      sessionId,
      userId,
      teamId,
      createdAt: now,
      lastActivity: now,
      messageCount: initialMessage ? 1 : 0,
      title: initialMessage?.content.slice(0, 50) + (initialMessage?.content && initialMessage.content.length > 50 ? '...' : '') || 'New Chat',
      model: initialMessage?.model,
      template: initialMessage?.template,
      status: 'active',
    }

    // Save session metadata
    const metadataKey = S3Utils.getUserSessionMetadataKey(userId, sessionId)
    await s3Storage.uploadJSON(metadataKey, session)

    // Save initial message if provided
    if (initialMessage) {
      const message: ChatMessage = {
        ...initialMessage,
        id: uuidv4(),
        sessionId,
        timestamp: now,
      }
      
      const messagesKey = S3Utils.getUserSessionKey(userId, sessionId)
      await s3Storage.uploadJSON(messagesKey, [message])
    }

    return session
  }

  /**
   * Add a message to an existing session
   */
  static async addMessage(
    userId: string,
    sessionId: string,
    message: Omit<ChatMessage, 'sessionId' | 'id' | 'timestamp'>
  ): Promise<ChatMessage> {
    const now = new Date().toISOString()
    const newMessage: ChatMessage = {
      ...message,
      id: uuidv4(),
      sessionId,
      timestamp: now,
    }

    // Get existing messages
    const messagesKey = S3Utils.getUserSessionKey(userId, sessionId)
    const existingMessages = await s3Storage.downloadJSON<ChatMessage[]>(messagesKey) || []

    // Add new message
    existingMessages.push(newMessage)

    // Save updated messages
    await s3Storage.uploadJSON(messagesKey, existingMessages)

    // Update session metadata
    await this.updateSessionActivity(userId, sessionId, existingMessages.length)

    return newMessage
  }

  /**
   * Get all messages for a session
   */
  static async getSessionMessages(userId: string, sessionId: string): Promise<ChatMessage[]> {
    const messagesKey = S3Utils.getUserSessionKey(userId, sessionId)
    return await s3Storage.downloadJSON<ChatMessage[]>(messagesKey) || []
  }

  /**
   * Get session metadata
   */
  static async getSession(userId: string, sessionId: string): Promise<ChatSession | null> {
    const metadataKey = S3Utils.getUserSessionMetadataKey(userId, sessionId)
    return await s3Storage.downloadJSON<ChatSession>(metadataKey)
  }

  /**
   * List all sessions for a user
   */
  static async getUserSessions(userId: string, limit = 50): Promise<ChatSession[]> {
    const prefix = S3Utils.getUserSessionsKey(userId)
    const keys = await s3Storage.listObjects(prefix)

    // Filter for metadata files only
    const metadataKeys = keys.filter(key => key.endsWith('/metadata.json'))

    // Get all session metadata
    const sessions: ChatSession[] = []
    for (const key of metadataKeys.slice(0, limit)) {
      try {
        const session = await s3Storage.downloadJSON<ChatSession>(key)
        if (session && session.status !== 'deleted') {
          sessions.push(session)
        }
      } catch (error) {
        console.error(`Error loading session metadata from ${key}:`, error)
      }
    }

    // Sort by last activity (most recent first)
    return sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
  }

  /**
   * Update session activity and message count
   */
  static async updateSessionActivity(userId: string, sessionId: string, messageCount?: number): Promise<void> {
    const metadataKey = S3Utils.getUserSessionMetadataKey(userId, sessionId)
    const session = await s3Storage.downloadJSON<ChatSession>(metadataKey)

    if (session) {
      session.lastActivity = new Date().toISOString()
      if (messageCount !== undefined) {
        session.messageCount = messageCount
      }

      await s3Storage.uploadJSON(metadataKey, session)
    }
  }

  /**
   * Update session title
   */
  static async updateSessionTitle(userId: string, sessionId: string, title: string): Promise<void> {
    const metadataKey = S3Utils.getUserSessionMetadataKey(userId, sessionId)
    const session = await s3Storage.downloadJSON<ChatSession>(metadataKey)

    if (session) {
      session.title = title
      await s3Storage.uploadJSON(metadataKey, session)
    }
  }

  /**
   * Archive a session (soft delete)
   */
  static async archiveSession(userId: string, sessionId: string): Promise<void> {
    const metadataKey = S3Utils.getUserSessionMetadataKey(userId, sessionId)
    const session = await s3Storage.downloadJSON<ChatSession>(metadataKey)

    if (session) {
      session.status = 'archived'
      await s3Storage.uploadJSON(metadataKey, session)
    }
  }

  /**
   * Delete a session permanently
   */
  static async deleteSession(userId: string, sessionId: string): Promise<void> {
    const metadataKey = S3Utils.getUserSessionMetadataKey(userId, sessionId)
    const messagesKey = S3Utils.getUserSessionKey(userId, sessionId)

    try {
      await Promise.all([
        s3Storage.deleteObject(metadataKey),
        s3Storage.deleteObject(messagesKey)
      ])
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error)
      throw error
    }
  }

  /**
   * Search messages across user's sessions
   */
  static async searchMessages(userId: string, query: string, limit = 50): Promise<{ message: ChatMessage; session: ChatSession }[]> {
    const sessions = await this.getUserSessions(userId)
    const results: { message: ChatMessage; session: ChatSession }[] = []

    for (const session of sessions) {
      if (results.length >= limit) break

      const messages = await this.getSessionMessages(userId, session.sessionId)
      const matchingMessages = messages.filter(msg =>
        msg.content.toLowerCase().includes(query.toLowerCase())
      )

      for (const message of matchingMessages) {
        if (results.length >= limit) break
        results.push({ message, session })
      }
    }

    return results
  }

  /**
   * Get user chat statistics
   */
  static async getUserSummary(userId: string): Promise<UserChatSummary> {
    const sessions = await this.getUserSessions(userId, 1000) // Get all sessions for stats

    const summary: UserChatSummary = {
      userId,
      totalSessions: sessions.length,
      totalMessages: sessions.reduce((sum, session) => sum + session.messageCount, 0),
      lastActivity: sessions.length > 0 ? sessions[0].lastActivity : new Date().toISOString(),
      favoriteModels: [],
      favoriteTemplates: [],
    }

    // Calculate favorite models and templates
    const modelCounts: Record<string, number> = {}
    const templateCounts: Record<string, number> = {}

    sessions.forEach(session => {
      if (session.model) {
        modelCounts[session.model] = (modelCounts[session.model] || 0) + 1
      }
      if (session.template) {
        templateCounts[session.template] = (templateCounts[session.template] || 0) + 1
      }
    })

    summary.favoriteModels = Object.entries(modelCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([model]) => model)

    summary.favoriteTemplates = Object.entries(templateCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([template]) => template)

    return summary
  }

  /**
   * Clean up old sessions (for maintenance)
   */
  static async cleanupOldSessions(userId: string, daysOld = 90): Promise<number> {
    const sessions = await this.getUserSessions(userId, 1000)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    let deletedCount = 0
    for (const session of sessions) {
      const sessionDate = new Date(session.lastActivity)
      if (sessionDate < cutoffDate && session.status !== 'active') {
        try {
          await this.deleteSession(userId, session.sessionId)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete old session ${session.sessionId}:`, error)
        }
      }
    }

    return deletedCount
  }

  /**
   * Export user's chat history
   */
  static async exportUserData(userId: string): Promise<{ sessions: ChatSession[]; messages: Record<string, ChatMessage[]> }> {
    const sessions = await this.getUserSessions(userId, 1000)
    const messages: Record<string, ChatMessage[]> = {}

    for (const session of sessions) {
      try {
        messages[session.sessionId] = await this.getSessionMessages(userId, session.sessionId)
      } catch (error) {
        console.error(`Failed to export messages for session ${session.sessionId}:`, error)
        messages[session.sessionId] = []
      }
    }

    return { sessions, messages }
  }
}

// Utility functions for common operations
export const ChatUtils = {
  /**
   * Generate a session title from the first message
   */
  generateSessionTitle(firstMessage: string): string {
    const cleaned = firstMessage.trim().replace(/\n+/g, ' ')
    if (cleaned.length <= 50) return cleaned
    return cleaned.slice(0, 47) + '...'
  },

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4)
  },

  /**
   * Calculate message statistics
   */
  calculateMessageStats(messages: ChatMessage[]): {
    totalTokens: number
    userMessages: number
    assistantMessages: number
    averageResponseTime?: number
  } {
    let totalTokens = 0
    let userMessages = 0
    let assistantMessages = 0

    messages.forEach(msg => {
      totalTokens += this.estimateTokenCount(msg.content)
      if (msg.role === 'user') userMessages++
      if (msg.role === 'assistant') assistantMessages++
    })

    return {
      totalTokens,
      userMessages,
      assistantMessages,
    }
  },

  /**
   * Format session for display
   */
  formatSessionForDisplay(session: ChatSession): {
    id: string
    title: string
    lastActivity: string
    messageCount: number
    model?: string
    template?: string
  } {
    return {
      id: session.sessionId,
      title: session.title || 'Untitled Chat',
      lastActivity: new Date(session.lastActivity).toLocaleDateString(),
      messageCount: session.messageCount,
      model: session.model,
      template: session.template,
    }
  },
}