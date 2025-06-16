// Use a more secure approach for Cosmos DB initialization
const getCosmosConfig = () => {
  const endpoint = process.env.COSMOS_DB_ENDPOINT
  const key = process.env.COSMOS_DB_KEY

  // Validate configuration without using eval or dynamic code
  if (!endpoint || !key) {
    return null
  }

  // Simple URL validation without eval
  try {
    new URL(endpoint)
    return { endpoint, key }
  } catch {
    return null
  }
}

import { CosmosClient, type Database, type Container } from "@azure/cosmos"

const cosmosConfig = getCosmosConfig()
const databaseId = "RoleChatDB"
const conversationsContainerId = "Conversations"
const messagesContainerId = "Messages"

let client: CosmosClient | null = null
let database: Database | null = null
let conversationsContainer: Container | null = null
let messagesContainer: Container | null = null

// Initialize Cosmos client only if properly configured
if (cosmosConfig) {
  try {
    client = new CosmosClient({
      endpoint: cosmosConfig.endpoint,
      key: cosmosConfig.key,
      // Add explicit configuration to avoid any dynamic code execution
      connectionPolicy: {
        enableEndpointDiscovery: false,
        preferredLocations: [],
      },
    })
  } catch (error) {
    console.error("Failed to initialize Cosmos client:", error)
    client = null
  }
}

// Initialize database and containers
export async function initializeCosmosDB() {
  if (!client) {
    console.log("Cosmos DB not configured, using in-memory storage")
    return false
  }

  try {
    // Create database if it doesn't exist
    const { database: db } = await client.databases.createIfNotExists({
      id: databaseId,
    })
    database = db

    // Create conversations container
    const { container: convContainer } = await database.containers.createIfNotExists({
      id: conversationsContainerId,
      partitionKey: "/userId",
      // Add explicit indexing policy to avoid dynamic operations
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [
          {
            path: "/*",
          },
        ],
        excludedPaths: [
          {
            path: '/"_etag"/?',
          },
        ],
      },
    })
    conversationsContainer = convContainer

    // Create messages container
    const { container: msgContainer } = await database.containers.createIfNotExists({
      id: messagesContainerId,
      partitionKey: "/conversationId",
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [
          {
            path: "/*",
          },
        ],
        excludedPaths: [
          {
            path: '/"_etag"/?',
          },
        ],
      },
    })
    messagesContainer = msgContainer

    console.log("Cosmos DB initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error)
    return false
  }
}

// Get containers (initialize if needed)
export async function getContainers() {
  if (!client) {
    return { conversationsContainer: null, messagesContainer: null }
  }

  if (!conversationsContainer || !messagesContainer) {
    await initializeCosmosDB()
  }
  return { conversationsContainer, messagesContainer }
}

export function isCosmosAvailable(): boolean {
  return cosmosConfig !== null && client !== null
}
