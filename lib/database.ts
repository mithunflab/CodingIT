import { supabase } from './supabase'
import { Message } from './messages'

export interface Project {
  id: string
  user_id: string
  title: string
  description?: string
  template_id?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  metadata?: Record<string, any>
}

export interface DbMessage {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content: Message['content']
  object_data?: any
  result_data?: any
  created_at: string
  sequence_number: number
}

// Project operations
export async function createProject(title: string, templateId?: string): Promise<Project | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      title,
      template_id: templateId,
      metadata: {}
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    return null
  }

  return data
}

export async function getProjects(): Promise<Project[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data || []
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<boolean> {
  if (!supabase) return false
  
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating project:', error)
    return false
  }

  return true
}

export async function deleteProject(id: string): Promise<boolean> {
  if (!supabase) return false
  
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting project:', error)
    return false
  }

  return true
}

// Message operations
export async function saveMessage(projectId: string, message: Message, sequenceNumber: number): Promise<boolean> {
  if (!supabase) return false
  
  const { error } = await supabase
    .from('messages')
    .insert({
      project_id: projectId,
      role: message.role,
      content: message.content,
      object_data: message.object,
      result_data: message.result,
      sequence_number: sequenceNumber
    })

  if (error) {
    console.error('Error saving message:', error)
    return false
  }

  // Update project's updated_at timestamp
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)

  return true
}

export async function getProjectMessages(projectId: string): Promise<Message[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('sequence_number', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data?.map((msg: DbMessage) => ({
    role: msg.role,
    content: msg.content,
    object: msg.object_data,
    result: msg.result_data,
  })) || []
}

export async function generateProjectTitle(firstMessage: string): Promise<string> {
  const words = firstMessage.trim().split(' ').slice(0, 6)
  return words.join(' ') + (firstMessage.split(' ').length > 6 ? '...' : '')
}