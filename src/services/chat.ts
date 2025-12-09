import { api } from '@/lib/api'

export interface Message {
  id: string
  conversationId: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  userId: string
  unitId: string | null
  title: string
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

export interface ConversationWithLastMessage extends Conversation {
  messages: Message[]
}

export interface SendMessageResponse {
  userMessage: Message
  assistantMessage: Message
}

export const chatService = {
  async getConversations(unitId?: string): Promise<ConversationWithLastMessage[]> {
    const params = unitId ? { unitId } : {}
    const response = await api.get<ConversationWithLastMessage[]>('/chat/conversations', { params })
    return response.data
  },

  async getConversation(id: string): Promise<Conversation & { messages: Message[] }> {
    const response = await api.get<Conversation & { messages: Message[] }>(`/chat/conversations/${id}`)
    return response.data
  },

  async createConversation(title?: string, unitId?: string): Promise<Conversation> {
    const response = await api.post<Conversation>('/chat/conversations', { title, unitId })
    return response.data
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/chat/conversations/${id}`)
  },

  async updateTitle(id: string, title: string): Promise<Conversation> {
    const response = await api.patch<Conversation>(`/chat/conversations/${id}/title`, { title })
    return response.data
  },

  async sendMessage(conversationId: string, content: string): Promise<SendMessageResponse> {
    const response = await api.post<SendMessageResponse>(`/chat/conversations/${conversationId}/messages`, { content })
    return response.data
  },
}

