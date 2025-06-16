"use server"

import type { Conversation, Message } from "./database"

// In-memory storage (for development/demo purposes)
let conversations: Conversation[] = []
let messages: Message[] = []

export async function createConversationInMemory(userId: string, title: string): Promise<Conversation> {
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    userId,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  conversations.unshift(conversation)
  return conversation
}

export async function getConversationsInMemory(userId: string): Promise<Conversation[]> {
  return conversations
    .filter((conv) => conv.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function updateConversationInMemory(
  conversationId: string,
  updates: Partial<Conversation>,
): Promise<void> {
  const index = conversations.findIndex((conv) => conv.id === conversationId)
  if (index !== -1) {
    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function deleteConversationInMemory(conversationId: string): Promise<void> {
  conversations = conversations.filter((conv) => conv.id !== conversationId)
  messages = messages.filter((msg) => msg.conversationId !== conversationId)
}

export async function saveMessageInMemory(message: Omit<Message, "id" | "timestamp">): Promise<Message> {
  const newMessage: Message = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }

  messages.push(newMessage)

  // Update conversation's last message and timestamp
  await updateConversationInMemory(message.conversationId, {
    lastMessage: message.content.substring(0, 100),
    updatedAt: new Date().toISOString(),
  })

  return newMessage
}

export async function getMessagesInMemory(conversationId: string): Promise<Message[]> {
  return messages
    .filter((msg) => msg.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}
