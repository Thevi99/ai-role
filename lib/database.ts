"use server"

import { getContainers, isCosmosAvailable } from "./cosmos"
import {
  createConversationInMemory,
  getConversationsInMemory,
  updateConversationInMemory,
  deleteConversationInMemory,
  saveMessageInMemory,
  getMessagesInMemory,
} from "./memory-storage"

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
  lastMessage?: string
}

export interface Message {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

// Conversation operations
export async function createConversation(userId: string, title: string): Promise<Conversation> {
  if (!isCosmosAvailable()) {
    return await createConversationInMemory(userId, title)
  }

  const { conversationsContainer } = await getContainers()
  if (!conversationsContainer) {
    return await createConversationInMemory(userId, title)
  }

  const conversation: Conversation = {
    id: crypto.randomUUID(),
    userId,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  try {
    const { resource } = await conversationsContainer.items.create(conversation)
    return resource!
  } catch (error) {
    console.error("Failed to create conversation in Cosmos DB, using memory:", error)
    return await createConversationInMemory(userId, title)
  }
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (!isCosmosAvailable()) {
    return await getConversationsInMemory(userId)
  }

  const { conversationsContainer } = await getContainers()
  if (!conversationsContainer) {
    return await getConversationsInMemory(userId)
  }

  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC",
      parameters: [{ name: "@userId", value: userId }],
    }

    const { resources } = await conversationsContainer.items.query(querySpec).fetchAll()
    return resources
  } catch (error) {
    console.error("Failed to get conversations from Cosmos DB, using memory:", error)
    return await getConversationsInMemory(userId)
  }
}

export async function updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
  if (!isCosmosAvailable()) {
    return await updateConversationInMemory(conversationId, updates)
  }

  const { conversationsContainer } = await getContainers()
  if (!conversationsContainer) {
    return await updateConversationInMemory(conversationId, updates)
  }

  try {
    const { resource: conversation } = await conversationsContainer.item(conversationId, updates.userId).read()
    if (conversation) {
      const updatedConversation = {
        ...conversation,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      await conversationsContainer.item(conversationId, updates.userId).replace(updatedConversation)
    }
  } catch (error) {
    console.error("Failed to update conversation in Cosmos DB, using memory:", error)
    await updateConversationInMemory(conversationId, updates)
  }
}

export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  if (!isCosmosAvailable()) {
    return await deleteConversationInMemory(conversationId)
  }

  const { conversationsContainer, messagesContainer } = await getContainers()
  if (!conversationsContainer || !messagesContainer) {
    return await deleteConversationInMemory(conversationId)
  }

  try {
    // Delete all messages in the conversation
    const messageQuery = {
      query: "SELECT c.id FROM c WHERE c.conversationId = @conversationId",
      parameters: [{ name: "@conversationId", value: conversationId }],
    }

    const { resources: messages } = await messagesContainer.items.query(messageQuery).fetchAll()

    for (const message of messages) {
      await messagesContainer.item(message.id, conversationId).delete()
    }

    // Delete the conversation
    await conversationsContainer.item(conversationId, userId).delete()
  } catch (error) {
    console.error("Failed to delete conversation from Cosmos DB, using memory:", error)
    await deleteConversationInMemory(conversationId)
  }
}

// Message operations
export async function saveMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message> {
  if (!isCosmosAvailable()) {
    return await saveMessageInMemory(message)
  }

  const { messagesContainer } = await getContainers()
  if (!messagesContainer) {
    return await saveMessageInMemory(message)
  }

  const newMessage: Message = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }

  try {
    const { resource } = await messagesContainer.items.create(newMessage)

    // Update conversation's last message and timestamp
    await updateConversation(message.conversationId, {
      lastMessage: message.content.substring(0, 100),
      updatedAt: new Date().toISOString(),
    })

    return resource!
  } catch (error) {
    console.error("Failed to save message to Cosmos DB, using memory:", error)
    return await saveMessageInMemory(message)
  }
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (!isCosmosAvailable()) {
    return await getMessagesInMemory(conversationId)
  }

  const { messagesContainer } = await getContainers()
  if (!messagesContainer) {
    return await getMessagesInMemory(conversationId)
  }

  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.conversationId = @conversationId ORDER BY c.timestamp ASC",
      parameters: [{ name: "@conversationId", value: conversationId }],
    }

    const { resources } = await messagesContainer.items.query(querySpec).fetchAll()
    return resources
  } catch (error) {
    console.error("Failed to get messages from Cosmos DB, using memory:", error)
    return await getMessagesInMemory(conversationId)
  }
}
