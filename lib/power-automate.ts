"use server"

const POWER_AUTOMATE_URL =
  "https://prod-87.southeastasia.logic.azure.com:443/workflows/d9dc3a8d32eb4b39b4ef9dd3cc4fb8b7/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0-uuOAjU1qoXXnsQ_cZ6ZKnw-7RkIL8kYhR6EV19z54"

export interface PowerAutomateRequest {
  description: string
}

export interface PowerAutomateTask {
  task_type: string
  action_details: string
  result: string
  status: string
}

export interface PowerAutomateResponse {
  success: boolean
  message?: string
  error?: string
  statusCode?: number
  retryAfter?: number
  trackingId?: string
  isTemporary?: boolean
  isProcessing?: boolean
  tasks?: PowerAutomateTask[] // New field for task results
  flowSummary?: string // New field for flow summary
}

// Retry configuration - reduced for Logic Apps
const MAX_RETRIES = 2
const RETRY_DELAY = 2000 // 2 seconds
const TIMEOUT = 15000 // 15 seconds (Logic Apps can be slow)

// Helper function to wait
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Helper function to make HTTP request with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Parse Power Automate task results into readable format
function parseTaskResults(tasks: PowerAutomateTask[]): string {
  if (!tasks || tasks.length === 0) {
    return "ไม่มีงานที่ดำเนินการ"
  }

  let summary = "🔄 **การดำเนินงาน Power Automate:**\n\n"

  tasks.forEach((task, index) => {
    const taskNumber = index + 1
    const statusIcon = task.status === "success" ? "✅" : "❌"

    let taskDescription = ""
    let taskResult = ""

    try {
      const actionDetails = JSON.parse(task.action_details)

      switch (task.task_type) {
        case "create_meeting":
          taskDescription = `📅 **สร้างการประชุม**`
          if (actionDetails.time) {
            taskDescription += ` เวลา ${actionDetails.time}`
          }
          if (actionDetails.description) {
            taskDescription += `: ${actionDetails.description}`
          }

          if (task.result && task.status === "success") {
            try {
              const meetingResult = JSON.parse(task.result)
              taskResult = `   📋 หัวข้อ: ${meetingResult.subject}\n`
              taskResult += `   🕐 เวลา: ${new Date(meetingResult.startWithTimeZone).toLocaleString("th-TH")}\n`
              taskResult += `   🔗 ลิงก์: ${meetingResult.webLink ? "สร้างแล้ว" : "ไม่มี"}`
            } catch {
              taskResult = `   ✅ สร้างการประชุมสำเร็จ`
            }
          }
          break

        case "send_email":
          taskDescription = `📧 **ส่ง Email**`
          if (actionDetails.recipients && Array.isArray(actionDetails.recipients)) {
            taskDescription += ` ถึง ${actionDetails.recipients.length} คน`
          }
          if (actionDetails.description) {
            taskDescription += `: ${actionDetails.description}`
          }

          if (task.status === "success") {
            taskResult = `   ✅ ส่ง Email สำเร็จ`
            if (actionDetails.recipients) {
              taskResult += `\n   👥 ผู้รับ: ${actionDetails.recipients.join(", ")}`
            }
          }
          break

        case "post_message":
          taskDescription = `💬 **โพสข้อความ**`
          if (actionDetails.platform) {
            taskDescription += ` ใน ${actionDetails.platform}`
          }
          if (actionDetails.time) {
            taskDescription += ` เวลา ${actionDetails.time}`
          }
          if (actionDetails.description) {
            taskDescription += `: ${actionDetails.description}`
          }

          if (task.result && task.status === "success") {
            try {
              const postResult = JSON.parse(task.result)
              taskResult = `   ✅ โพสข้อความสำเร็จ\n`
              taskResult += `   🔗 ลิงก์: ${postResult.messageLink ? "สร้างแล้ว" : "ไม่มี"}`
            } catch {
              taskResult = `   ✅ โพสข้อความสำเร็จ`
            }
          }
          break

        default:
          taskDescription = `⚙️ **${task.task_type}**`
          if (task.status === "success") {
            taskResult = `   ✅ ดำเนินการสำเร็จ`
          }
      }
    } catch {
      taskDescription = `⚙️ **${task.task_type}**`
      if (task.status === "success") {
        taskResult = `   ✅ ดำเนินการสำเร็จ`
      }
    }

    summary += `**${taskNumber}.** ${statusIcon} ${taskDescription}\n`
    if (taskResult) {
      summary += `${taskResult}\n`
    }

    if (task.status !== "success") {
      summary += `   ❌ เกิดข้อผิดพลาด\n`
    }

    summary += "\n"
  })

  const successCount = tasks.filter((t) => t.status === "success").length
  const totalCount = tasks.length

  summary += `📊 **สรุป**: สำเร็จ ${successCount}/${totalCount} งาน`

  return summary
}

// Parse Azure Logic Apps error response
function parseLogicAppsError(errorData: any): {
  message: string
  isTemporary: boolean
  trackingId?: string
  isProcessing?: boolean
} {
  if (errorData?.error) {
    const { code, message } = errorData.error
    const trackingId = errorData.error.trackingId || "Unknown"

    switch (code) {
      case "NoResponse":
        return {
          message: "Workflow triggered but no immediate response (likely processing in background)",
          isTemporary: false, // Not really an error
          isProcessing: true,
          trackingId,
        }
      case "WorkflowRunInProgress":
        return {
          message: "Another workflow run is in progress",
          isTemporary: true,
          trackingId,
        }
      case "WorkflowRunTimeout":
        return {
          message: "Workflow execution timed out",
          isTemporary: true,
          trackingId,
        }
      case "TriggerNotFound":
        return {
          message: "Workflow trigger not found or disabled",
          isTemporary: false,
          trackingId,
        }
      case "Forbidden":
        return {
          message: "Access denied to workflow",
          isTemporary: false,
          trackingId,
        }
      default:
        return {
          message: `Logic Apps error: ${code} - ${message}`,
          isTemporary: code.includes("Timeout") || code.includes("NoResponse"),
          trackingId,
        }
    }
  }

  return {
    message: "Unknown Logic Apps error",
    isTemporary: true,
  }
}

// ปรับปรุงการจัดการ NoResponse ให้เป็น success สำหรับ Logic Apps
export async function triggerPowerAutomate(description: string, isTest = false): Promise<PowerAutomateResponse> {
  // Validate input
  if (!description || description.trim().length === 0) {
    return {
      success: false,
      error: "Description is required",
      isTemporary: false,
    }
  }

  // Truncate description if too long
  const truncatedDescription = description.length > 1500 ? description.substring(0, 1500) + "..." : description

  let lastError: Error | null = null
  let lastStatusCode: number | null = null
  let lastTrackingId: string | undefined

  // For test connections, we're more lenient with "NoResponse" errors
  const maxRetries = isTest ? 1 : MAX_RETRIES

  // Retry logic with shorter delays for Logic Apps
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Power Automate attempt ${attempt}/${maxRetries} (test: ${isTest})`)

      const requestBody = {
        description: truncatedDescription,
        timestamp: new Date().toISOString(),
        source: "Role-Chat-Interface",
        isTest: isTest,
      }

      console.log("Sending request to Power Automate:", {
        url: POWER_AUTOMATE_URL.substring(0, 100) + "...", // Don't log full URL with secrets
        bodyLength: JSON.stringify(requestBody).length,
        isTest,
      })

      const response = await fetchWithTimeout(
        POWER_AUTOMATE_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "Role-Chat-Interface/1.0",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(requestBody),
        },
        TIMEOUT,
      )

      lastStatusCode = response.status
      console.log(`Power Automate response status: ${response.status}`)

      // Handle successful responses
      if (response.ok) {
        try {
          const responseText = await response.text()
          console.log("Power Automate response received successfully")

          // Try to parse the response as task results
          let tasks: PowerAutomateTask[] = []
          let flowSummary = ""

          if (responseText && responseText.trim()) {
            try {
              const parsedResponse = JSON.parse(responseText)

              // Check if response is an array of tasks
              if (Array.isArray(parsedResponse)) {
                tasks = parsedResponse
                flowSummary = parseTaskResults(tasks)
              } else if (parsedResponse.tasks && Array.isArray(parsedResponse.tasks)) {
                tasks = parsedResponse.tasks
                flowSummary = parseTaskResults(tasks)
              } else {
                // Single task or other format
                flowSummary = "✅ Power Automate workflow ดำเนินการสำเร็จ"
              }
            } catch (parseError) {
              console.log("Could not parse response as JSON, treating as success")
              flowSummary = "✅ Power Automate workflow ดำเนินการสำเร็จ"
            }
          } else {
            flowSummary = "✅ Power Automate workflow ดำเนินการสำเร็จ"
          }

          return {
            success: true,
            message: isTest ? "Test connection successful" : "Power Automate workflow triggered successfully",
            statusCode: response.status,
            tasks: tasks,
            flowSummary: flowSummary,
          }
        } catch (error) {
          // Even if we can't parse the response, if status is OK, consider it successful
          return {
            success: true,
            message: isTest
              ? "Test connection successful (response parsing failed but request succeeded)"
              : "Power Automate workflow triggered (response parsing failed but request succeeded)",
            statusCode: response.status,
            flowSummary: "✅ Power Automate workflow ดำเนินการสำเร็จ",
          }
        }
      }

      // Handle error responses
      let errorData: any = null
      try {
        const errorText = await response.text()
        if (errorText) {
          errorData = JSON.parse(errorText)
        }
      } catch {
        // If we can't parse error response, use generic message
      }

      // Handle specific status codes
      if (response.status === 429) {
        // Rate limited
        const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "60")
        console.log(`Rate limited, retry after ${retryAfter} seconds`)

        if (attempt < maxRetries) {
          await wait(Math.min(retryAfter * 1000, 10000)) // Max 10 seconds wait
          continue
        }

        return {
          success: false,
          error: "Rate limited by Power Automate",
          statusCode: response.status,
          retryAfter,
          isTemporary: true,
        }
      } else if (response.status === 502) {
        // Bad Gateway - often temporary for Logic Apps
        const errorInfo = errorData
          ? parseLogicAppsError(errorData)
          : {
              message: "Bad Gateway",
              isTemporary: true,
              isProcessing: false,
            }
        lastTrackingId = errorInfo.trackingId

        console.log(`502 error on attempt ${attempt}:`, errorInfo.message)

        // For NoResponse errors, treat as SUCCESS (Logic Apps are processing)
        if (errorData?.error?.code === "NoResponse" || errorInfo.message.includes("no immediate response")) {
          return {
            success: true, // เปลี่ยนเป็น true เสมอสำหรับ NoResponse
            message: "Power Automate workflow triggered successfully (processing in background)",
            statusCode: response.status,
            trackingId: lastTrackingId,
            isTemporary: false,
            isProcessing: true,
            flowSummary:
              "✅ Power Automate workflow กำลังประมวลผลในเบื้องหลัง\n\n🔄 **สถานะ**: กำลังดำเนินการ\n📋 **คำขอ**: " +
              description +
              "\n⏱️ **เวลา**: " +
              new Date().toLocaleTimeString("th-TH") +
              "\n\n💡 **หมายเหตุ**: Logic App กำลังประมวลผลคำขอของคุณ ผลลัพธ์จะปรากฏเมื่อเสร็จสิ้น",
          }
        }

        if (attempt < maxRetries && errorInfo.isTemporary) {
          await wait(RETRY_DELAY * attempt)
          continue
        }

        return {
          success: false,
          error: errorInfo.message,
          statusCode: response.status,
          trackingId: lastTrackingId,
          isTemporary: errorInfo.isTemporary,
          isProcessing: errorInfo.isProcessing,
        }
      } else if (response.status >= 500) {
        // Other server errors
        const errorInfo = errorData
          ? parseLogicAppsError(errorData)
          : {
              message: "Server error",
              isTemporary: true,
              isProcessing: false,
            }
        lastError = new Error(errorInfo.message)
        lastTrackingId = errorInfo.trackingId

        console.error(`Server error on attempt ${attempt}:`, errorInfo.message)

        if (attempt < maxRetries && errorInfo.isTemporary) {
          await wait(RETRY_DELAY * attempt)
          continue
        }

        return {
          success: false,
          error: errorInfo.message,
          statusCode: response.status,
          trackingId: lastTrackingId,
          isTemporary: errorInfo.isTemporary,
          isProcessing: errorInfo.isProcessing,
        }
      } else {
        // Client errors (400-499) - don't retry
        const errorInfo = errorData
          ? parseLogicAppsError(errorData)
          : {
              message: "Client error",
              isTemporary: false,
              isProcessing: false,
            }

        return {
          success: false,
          error: errorInfo.message,
          statusCode: response.status,
          trackingId: errorInfo.trackingId,
          isTemporary: false,
          isProcessing: errorInfo.isProcessing,
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Network error on attempt ${attempt}:`, lastError.message)

      // Check if it's a timeout or network error
      if (lastError.name === "AbortError") {
        console.log("Request timed out")
      } else if (lastError.message.includes("fetch")) {
        console.log("Network connectivity error")
      }

      if (attempt < maxRetries) {
        await wait(RETRY_DELAY * attempt)
        continue
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || "All retry attempts failed",
    statusCode: lastStatusCode || undefined,
    trackingId: lastTrackingId,
    isTemporary: true, // Assume temporary if we couldn't determine
  }
}

// Helper function to detect if a message should trigger Power Automate
export async function shouldTriggerPowerAutomate(message: string): Promise<boolean> {
  const triggers = [
    "ประชุม",
    "meeting",
    "email",
    "โพส",
    "post",
    "team",
    "ส่ง",
    "send",
    "แจ้ง",
    "notify",
    "reminder",
    "เตือน",
    "schedule",
    "กำหนด",
    "นัดหมาย",
    "appointment",
  ]

  const lowerMessage = message.toLowerCase()
  return triggers.some((trigger) => lowerMessage.includes(trigger.toLowerCase()))
}

// Function to test Power Automate connectivity with a simple payload
export async function testPowerAutomateConnection(): Promise<PowerAutomateResponse> {
  console.log("Testing Power Automate connection...")
  return await triggerPowerAutomate("Connection test from Role Chat Interface - " + new Date().toISOString(), true)
}

// Function to check if Power Automate endpoint is reachable
export async function checkPowerAutomateHealth(): Promise<PowerAutomateResponse> {
  try {
    console.log("Checking Power Automate health...")

    // Try a simple HEAD request first to check if the endpoint is reachable
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout for health check

    try {
      const response = await fetch(POWER_AUTOMATE_URL.split("?")[0], {
        method: "HEAD",
        headers: {
          "User-Agent": "Role-Chat-Interface/1.0",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      return {
        success: response.status < 500,
        message: `Health check returned ${response.status}`,
        statusCode: response.status,
        isTemporary: response.status >= 500,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  } catch (error) {
    console.error("Health check failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Health check failed",
      isTemporary: true,
    }
  }
}
