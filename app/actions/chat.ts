"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import {
  saveMessage,
  getMessages,
  createConversation,
  getConversations,
  type Message,
  type Conversation,
} from "../../lib/database"
import { planWorkflow, executeWorkflow, formatWorkflowDisplay, type WorkflowPlan } from "../../lib/workflow-planner"
import {
  shouldTriggerPowerAutomate,
  testPowerAutomateConnection,
  checkPowerAutomateHealth,
  type PowerAutomateResponse,
} from "../../lib/power-automate"

export type { Message, Conversation }

export interface SendMessageResult {
  userMessage: Message
  assistantMessage: Message
  powerAutomateTriggered: boolean
  powerAutomateSuccess: boolean
  powerAutomateError?: string
  powerAutomateStatusCode?: number
  powerAutomateTrackingId?: string
  powerAutomateIsTemporary?: boolean
  powerAutomateIsProcessing?: boolean
  workflowPlan?: WorkflowPlan
  workflowDisplay?: string
}

// Check if OpenAI API key is available
function isOpenAIAvailable(): boolean {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0)
}

// Generate a fallback response when OpenAI is not available
function generateFallbackResponse(content: string): string {
  const isThaiMessage = /[\u0E00-\u0E7F]/.test(content)

  let response = ""

  if (isThaiMessage) {
    response = "ขอบคุณสำหรับข้อความของคุณ ฉันได้รับข้อมูลแล้ว"

    // Add specific responses for common tasks
    if (content.includes("ประชุม") || content.includes("meeting")) {
      response += "\n\nเกี่ยวกับการประชุมที่คุณกล่าวถึง ระบบได้บันทึกข้อมูลไว้แล้ว"
    }
    if (content.includes("email")) {
      response += "\n\nข้อมูลการส่ง email ได้ถูกส่งไปประมวลผลแล้ว"
    }
    if (content.includes("team") || content.includes("โพส")) {
      response += "\n\nข้อมูลการโพสใน Team ได้ถูกบันทึกไว้แล้ว"
    }
    if (content.includes("กำหนด") || content.includes("schedule") || content.includes("นัดหมาย")) {
      response += "\n\nข้อมูลการกำหนดตารางงานได้ถูกบันทึกไว้แล้ว"
    }
  } else {
    response = "Thank you for your message. I have received your information."

    // Add specific responses for common tasks
    if (content.toLowerCase().includes("meeting")) {
      response += "\n\nRegarding the meeting you mentioned, the information has been recorded."
    }
    if (content.toLowerCase().includes("email")) {
      response += "\n\nThe email information has been sent for processing."
    }
    if (content.toLowerCase().includes("team") || content.toLowerCase().includes("post")) {
      response += "\n\nThe Team posting information has been recorded."
    }
    if (content.toLowerCase().includes("schedule") || content.toLowerCase().includes("appointment")) {
      response += "\n\nThe scheduling information has been recorded."
    }
  }

  return response
}

export async function sendMessage(conversationId: string, content: string, userId: string): Promise<SendMessageResult> {
  console.log("=== Starting sendMessage with Workflow Planning ===")
  console.log("Content:", content.substring(0, 100))

  try {
    // Save user message
    const userMessage = await saveMessage({
      conversationId,
      role: "user",
      content,
    })
    console.log("User message saved:", userMessage.id)

    // Check if we should trigger workflow planning
    const shouldTrigger = shouldTriggerPowerAutomate(content)
    console.log("Should trigger workflow:", shouldTrigger)

    let workflowPlan: WorkflowPlan | null = null
    let workflowDisplay = ""
    let workflowSuccess = false

    if (shouldTrigger) {
      console.log("🧠 Creating workflow plan...")

      try {
        // Step 1: Plan the workflow
        workflowPlan = await planWorkflow(content)
        console.log(`📋 Workflow planned with ${workflowPlan.steps.length} steps`)

        // Step 2: Execute the workflow
        console.log("🚀 Executing workflow...")
        const executedWorkflow = await executeWorkflow(workflowPlan)

        // Step 3: Format for display
        workflowDisplay = formatWorkflowDisplay(executedWorkflow)
        workflowSuccess = executedWorkflow.status === "completed"
        workflowPlan = executedWorkflow

        console.log(`✅ Workflow ${executedWorkflow.status}`)
      } catch (error) {
        console.error("Workflow execution failed:", error)
        workflowDisplay = `❌ **Workflow Error**\n\nเกิดข้อผิดพลาดในการดำเนินการ: ${error instanceof Error ? error.message : "Unknown error"}`
        workflowSuccess = false
      }
    }

    let aiResponse = ""

    // Check if OpenAI is available
    const openAIAvailable = isOpenAIAvailable()
    console.log("OpenAI available:", openAIAvailable)

    if (openAIAvailable) {
      try {
        console.log("Using OpenAI for response generation")

        // Get conversation history for context
        const messages = await getMessages(conversationId)

        // Format messages for AI context
        const contextMessages = messages
          .slice(-10)
          .map((msg) => {
            const role = msg.role === "user" ? "User" : "Assistant"
            return `${role}: ${msg.content}`
          })
          .join("\n")

        // Create system prompt with workflow awareness
        let systemPrompt = `You are Role, an intelligent AI assistant that acts as a Generative Agent with workflow planning capabilities.

When users request tasks involving meetings, emails, posts, or scheduling, you:
1. Analyze the request to identify actionable items
2. Create a structured workflow plan with dependencies
3. Execute the workflow step by step
4. Provide detailed progress updates

You can break down complex requests into manageable steps and execute them systematically.

Respond concisely and helpfully in the same language as the user. Support Thai language naturally.`

        if (workflowPlan) {
          if (workflowSuccess) {
            systemPrompt += `\n\nNote: A workflow was successfully planned and executed for this request. The user's tasks have been processed systematically.`
          } else {
            systemPrompt += `\n\nNote: A workflow was planned but encountered some issues during execution.`
          }
        }

        const userPrompt = contextMessages
          ? `Previous conversation:\n${contextMessages}\n\nUser: ${content}`
          : `User: ${content}`

        // Generate AI response
        const result = await generateText({
          model: openai("gpt-4o"),
          system: systemPrompt,
          prompt: userPrompt,
          maxTokens: 1000,
          temperature: 0.7,
        })

        aiResponse = result.text
        console.log("OpenAI response generated successfully")
      } catch (error) {
        console.error("OpenAI API error:", error)
        // Fall back to simple response if OpenAI fails
        aiResponse = generateFallbackResponse(content)
        console.log("Using fallback response due to OpenAI error")
      }
    } else {
      console.log("OpenAI API key not available, using fallback response")
      // Use fallback response when OpenAI is not available
      aiResponse = generateFallbackResponse(content)
    }

    // Add workflow display to AI response
    if (shouldTrigger && workflowDisplay) {
      aiResponse += "\n\n" + workflowDisplay
    }

    // Ensure we always have a response
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.log("No response generated, using default fallback")
      aiResponse = generateFallbackResponse(content)
    }

    console.log("Final AI response length:", aiResponse.length)

    // Save assistant message
    const assistantMessage = await saveMessage({
      conversationId,
      role: "assistant",
      content: aiResponse,
    })
    console.log("Assistant message saved:", assistantMessage.id)

    const result = {
      userMessage,
      assistantMessage,
      powerAutomateTriggered: shouldTrigger,
      powerAutomateSuccess: workflowSuccess,
      powerAutomateError: workflowPlan?.status === "failed" ? "Workflow execution failed" : undefined,
      powerAutomateStatusCode: workflowSuccess ? 200 : 500,
      powerAutomateTrackingId: workflowPlan?.id,
      powerAutomateIsTemporary: false,
      powerAutomateIsProcessing: false,
      workflowPlan: workflowPlan,
      workflowDisplay: workflowDisplay,
    }

    console.log("=== sendMessage completed successfully ===")
    return result
  } catch (error) {
    console.error("=== Error in sendMessage ===", error)

    // Create a more specific error message
    let errorContent = "ขอโทษครับ เกิดข้อผิดพลาดในการประมวลผลคำขอของคุณ"

    if (error instanceof Error && error.message.includes("OpenAI API key")) {
      errorContent = "ขณะนี้ระบบ AI ไม่พร้อมใช้งาน แต่ระบบ Workflow ยังคงทำงานได้ กรุณาตรวจสอบผลลัพธ์"
    } else {
      errorContent += " กรุณาลองใหม่อีกครั้ง"
    }

    const errorMessage = await saveMessage({
      conversationId,
      role: "assistant",
      content: errorContent,
    })

    return {
      userMessage: {
        id: crypto.randomUUID(),
        conversationId,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      },
      assistantMessage: errorMessage,
      powerAutomateTriggered: false,
      powerAutomateSuccess: false,
      powerAutomateError: error instanceof Error ? error.message : "Unknown error",
      powerAutomateIsTemporary: true,
    }
  }
}

export async function createNewConversation(userId: string, title?: string): Promise<Conversation> {
  const conversationTitle = title || `New Chat ${new Date().toLocaleDateString()}`
  return await createConversation(userId, conversationTitle)
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  return await getConversations(userId)
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  return await getMessages(conversationId)
}

export async function triggerPowerAutomateManually(description: string): Promise<PowerAutomateResponse> {
  try {
    // Use workflow planning for manual triggers too
    const workflow = await planWorkflow(description)
    const executedWorkflow = await executeWorkflow(workflow)

    return {
      success: executedWorkflow.status === "completed",
      message: formatWorkflowDisplay(executedWorkflow),
      flowSummary: formatWorkflowDisplay(executedWorkflow),
    }
  } catch (error) {
    console.error("Manual workflow trigger failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      isTemporary: true,
    }
  }
}

// Updated test function that handles NoResponse as success
export async function testPowerAutomateConnectionAction(): Promise<PowerAutomateResponse> {
  try {
    console.log("Starting Power Automate connection test...")

    // First do a health check
    const healthCheck = await checkPowerAutomateHealth()
    console.log("Health check result:", healthCheck)

    if (!healthCheck.success && healthCheck.statusCode && healthCheck.statusCode >= 500) {
      return {
        success: false,
        error: `Health check failed: ${healthCheck.error}`,
        statusCode: healthCheck.statusCode,
        isTemporary: true,
      }
    }

    // Then try the actual test
    const result = await testPowerAutomateConnection()
    console.log("Test connection result:", result)

    return result
  } catch (error) {
    console.error("Test connection failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
      isTemporary: true,
    }
  }
}

// Export the test function with the correct name
export { testPowerAutomateConnectionAction as testPowerAutomateConnection }
