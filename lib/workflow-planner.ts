"use server"

export interface WorkflowStep {
  id: string
  type: "meeting" | "email" | "post" | "reminder" | "task" | "analysis"
  title: string
  description: string
  dependencies: string[] // IDs of steps that must complete first
  estimatedDuration: number // in minutes
  priority: "high" | "medium" | "low"
  parameters: Record<string, any>
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped"
  result?: any
  startTime?: string
  endTime?: string
  error?: string
}

export interface WorkflowPlan {
  id: string
  title: string
  description: string
  steps: WorkflowStep[]
  totalEstimatedDuration: number
  status: "planning" | "executing" | "completed" | "failed" | "paused"
  createdAt: string
  startedAt?: string
  completedAt?: string
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

// AI-powered workflow planning
export async function planWorkflow(userRequest: string): Promise<WorkflowPlan> {
  console.log("🧠 Planning workflow for:", userRequest.substring(0, 100))

  // Analyze the request and extract tasks
  const analysis = analyzeUserRequest(userRequest)

  const workflowId = crypto.randomUUID()
  const steps: WorkflowStep[] = []

  // Generate workflow steps based on analysis
  if (analysis.hasMeeting) {
    steps.push({
      id: crypto.randomUUID(),
      type: "meeting",
      title: "สร้างการประชุม",
      description: `สร้างการประชุม: ${analysis.meetingDetails.title}`,
      dependencies: [],
      estimatedDuration: 2,
      priority: "high",
      parameters: {
        time: analysis.meetingDetails.time,
        title: analysis.meetingDetails.title,
        description: analysis.meetingDetails.description,
        attendees: analysis.meetingDetails.attendees,
      },
      status: "pending",
    })
  }

  if (analysis.hasEmail) {
    const meetingStepId = steps.find((s) => s.type === "meeting")?.id
    steps.push({
      id: crypto.randomUUID(),
      type: "email",
      title: "ส่ง Email แจ้งเตือน",
      description: `ส่ง email ถึง ${analysis.emailDetails.recipients.length} คน`,
      dependencies: meetingStepId ? [meetingStepId] : [],
      estimatedDuration: 1,
      priority: "high",
      parameters: {
        recipients: analysis.emailDetails.recipients,
        subject: analysis.emailDetails.subject,
        body: analysis.emailDetails.body,
        includeCalendarInvite: analysis.hasMeeting,
      },
      status: "pending",
    })
  }

  if (analysis.hasPost) {
    const emailStepId = steps.find((s) => s.type === "email")?.id
    steps.push({
      id: crypto.randomUUID(),
      type: "post",
      title: "โพสข้อความใน Team",
      description: `โพสข้อความเกี่ยวกับ ${analysis.postDetails.topic}`,
      dependencies: emailStepId ? [emailStepId] : [],
      estimatedDuration: 1,
      priority: "medium",
      parameters: {
        platform: analysis.postDetails.platform,
        message: analysis.postDetails.message,
        scheduledTime: analysis.postDetails.scheduledTime,
      },
      status: "pending",
    })
  }

  // Add follow-up tasks
  if (analysis.hasMeeting || analysis.hasEmail) {
    steps.push({
      id: crypto.randomUUID(),
      type: "reminder",
      title: "ตั้งการแจ้งเตือน",
      description: "ตั้งการแจ้งเตือนสำหรับติดตามผล",
      dependencies: steps.map((s) => s.id),
      estimatedDuration: 1,
      priority: "low",
      parameters: {
        reminderTime: "1 hour before",
        message: "ติดตามผลการประชุมและ feedback",
      },
      status: "pending",
    })
  }

  const totalDuration = steps.reduce((sum, step) => sum + step.estimatedDuration, 0)

  const workflow: WorkflowPlan = {
    id: workflowId,
    title: generateWorkflowTitle(analysis),
    description: userRequest,
    steps,
    totalEstimatedDuration: totalDuration,
    status: "planning",
    createdAt: new Date().toISOString(),
    progress: {
      completed: 0,
      total: steps.length,
      percentage: 0,
    },
  }

  console.log(`📋 Generated workflow with ${steps.length} steps, estimated ${totalDuration} minutes`)
  return workflow
}

// Analyze user request to extract actionable items
function analyzeUserRequest(request: string) {
  const lowerRequest = request.toLowerCase()

  // Meeting detection
  const hasMeeting = /ประชุม|meeting|นัดหมาย|appointment/.test(lowerRequest)
  const timeMatch = request.match(/(\d{1,2})\s*(?:โมง|:00|am|pm)/i)
  const meetingTime = timeMatch ? timeMatch[1] + ":00" : "09:00"

  // Email detection
  const hasEmail = /email|ส่ง|แจ้ง/.test(lowerRequest)
  const emailMatches = request.match(/[\w.-]+@[\w.-]+\.\w+/g) || []

  // Post detection
  const hasPost = /โพส|post|team|แชร์|share/.test(lowerRequest)
  const postTimeMatch = request.match(/บ่าย|afternoon|(\d{1,2})\s*โมงเย็น/i)
  const postTime = postTimeMatch ? "13:00" : undefined

  return {
    hasMeeting,
    meetingDetails: {
      time: meetingTime,
      title: hasMeeting ? extractMeetingTitle(request) : "",
      description: hasMeeting ? request : "",
      attendees: emailMatches,
    },
    hasEmail,
    emailDetails: {
      recipients: emailMatches,
      subject: hasMeeting ? `การประชุม: ${extractMeetingTitle(request)}` : "แจ้งเตือนจากระบบ",
      body: generateEmailBody(request),
    },
    hasPost,
    postDetails: {
      platform: "Microsoft Teams",
      message: generatePostMessage(request),
      topic: extractMainTopic(request),
      scheduledTime: postTime,
    },
  }
}

function extractMeetingTitle(request: string): string {
  if (request.includes("ประชุมทีม")) return "ประชุมทีม"
  if (request.includes("ประชุม")) return "ประชุมงาน"
  if (request.includes("meeting")) return "Team Meeting"
  return "การประชุม"
}

function extractMainTopic(request: string): string {
  if (request.includes("ประชุม")) return "การประชุม"
  if (request.includes("โครงการ")) return "โครงการ"
  if (request.includes("งาน")) return "งาน"
  return "หัวข้อทั่วไป"
}

function generateEmailBody(request: string): string {
  return `สวัสดีครับ/ค่ะ

ขอแจ้งให้ทราบเกี่ยวกับ: ${request}

รายละเอียดเพิ่มเติมจะแจ้งให้ทราบอีกครั้ง

ขอบคุณครับ/ค่ะ`
}

function generatePostMessage(request: string): string {
  return `📢 อัพเดท: ${request}

#TeamUpdate #Meeting`
}

function generateWorkflowTitle(analysis: any): string {
  const components = []
  if (analysis.hasMeeting) components.push("การประชุม")
  if (analysis.hasEmail) components.push("Email")
  if (analysis.hasPost) components.push("Team Post")

  return `Workflow: ${components.join(" + ")}`
}

// Execute workflow step by step
export async function executeWorkflow(workflow: WorkflowPlan): Promise<WorkflowPlan> {
  console.log(`🚀 Starting workflow execution: ${workflow.title}`)

  const updatedWorkflow = { ...workflow }
  updatedWorkflow.status = "executing"
  updatedWorkflow.startedAt = new Date().toISOString()

  // Execute steps in dependency order
  const executionOrder = getExecutionOrder(workflow.steps)

  for (const stepId of executionOrder) {
    const step = updatedWorkflow.steps.find((s) => s.id === stepId)
    if (!step) continue

    console.log(`⚡ Executing step: ${step.title}`)
    step.status = "in_progress"
    step.startTime = new Date().toISOString()

    try {
      const result = await executeStep(step)
      step.status = "completed"
      step.result = result
      step.endTime = new Date().toISOString()

      // Update progress
      updatedWorkflow.progress.completed++
      updatedWorkflow.progress.percentage = Math.round(
        (updatedWorkflow.progress.completed / updatedWorkflow.progress.total) * 100,
      )

      console.log(`✅ Step completed: ${step.title}`)
    } catch (error) {
      step.status = "failed"
      step.error = error instanceof Error ? error.message : "Unknown error"
      step.endTime = new Date().toISOString()

      console.error(`❌ Step failed: ${step.title}`, error)

      // Decide whether to continue or stop
      if (step.priority === "high") {
        updatedWorkflow.status = "failed"
        break
      } else {
        step.status = "skipped"
        console.log(`⏭️ Skipping non-critical step: ${step.title}`)
      }
    }

    // Small delay between steps
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Finalize workflow
  if (updatedWorkflow.status === "executing") {
    updatedWorkflow.status = "completed"
  }
  updatedWorkflow.completedAt = new Date().toISOString()

  console.log(`🏁 Workflow ${updatedWorkflow.status}: ${workflow.title}`)
  return updatedWorkflow
}

// Get execution order based on dependencies
function getExecutionOrder(steps: WorkflowStep[]): string[] {
  const order: string[] = []
  const visited = new Set<string>()

  function visit(stepId: string) {
    if (visited.has(stepId)) return

    const step = steps.find((s) => s.id === stepId)
    if (!step) return

    // Visit dependencies first
    for (const depId of step.dependencies) {
      visit(depId)
    }

    visited.add(stepId)
    order.push(stepId)
  }

  // Visit all steps
  for (const step of steps) {
    visit(step.id)
  }

  return order
}

// Execute individual step
async function executeStep(step: WorkflowStep): Promise<any> {
  // Import Power Automate functions
  const { triggerPowerAutomate } = await import("./power-automate")

  const stepDescription = `${step.title}: ${step.description}`

  switch (step.type) {
    case "meeting":
      return await triggerPowerAutomate(`สร้างการประชุม: ${step.parameters.title} เวลา ${step.parameters.time}`, false)

    case "email":
      return await triggerPowerAutomate(
        `ส่ง email ถึง ${step.parameters.recipients.join(", ")} เรื่อง: ${step.parameters.subject}`,
        false,
      )

    case "post":
      return await triggerPowerAutomate(`โพสข้อความใน ${step.parameters.platform}: ${step.parameters.message}`, false)

    case "reminder":
      return await triggerPowerAutomate(`ตั้งการแจ้งเตือน: ${step.parameters.message}`, false)

    case "analysis":
      // Simulate analysis step
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return { analysis: "completed", insights: ["Task completed successfully"] }

    default:
      return await triggerPowerAutomate(stepDescription, false)
  }
}

// Format workflow for display
export function formatWorkflowDisplay(workflow: WorkflowPlan): string {
  const statusIcon = {
    planning: "📋",
    executing: "⚡",
    completed: "✅",
    failed: "❌",
    paused: "⏸️",
  }[workflow.status]

  const progressBar =
    "█".repeat(Math.floor(workflow.progress.percentage / 10)) +
    "░".repeat(10 - Math.floor(workflow.progress.percentage / 10))

  let display = `${statusIcon} **${workflow.title}**\n\n`
  display += `📊 **ความคืบหน้า**: ${workflow.progress.percentage}% [${progressBar}]\n`
  display += `⏱️ **เวลาประมาณ**: ${workflow.totalEstimatedDuration} นาที\n\n`

  display += `🔄 **ขั้นตอนการทำงาน**:\n\n`

  workflow.steps.forEach((step, index) => {
    const stepIcon = {
      pending: "⏳",
      in_progress: "⚡",
      completed: "✅",
      failed: "❌",
      skipped: "⏭️",
    }[step.status]

    const priorityIcon = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    }[step.priority]

    display += `**${index + 1}.** ${stepIcon} ${priorityIcon} **${step.title}**\n`
    display += `   ${step.description}\n`

    if (step.dependencies.length > 0) {
      const depNumbers = step.dependencies.map((depId) => {
        const depIndex = workflow.steps.findIndex((s) => s.id === depId)
        return depIndex + 1
      })
      display += `   📎 รอขั้นตอน: ${depNumbers.join(", ")}\n`
    }

    if (step.status === "completed" && step.result) {
      display += `   ✅ สำเร็จ\n`
    } else if (step.status === "failed" && step.error) {
      display += `   ❌ ล้มเหลว: ${step.error}\n`
    } else if (step.status === "in_progress") {
      display += `   ⚡ กำลังดำเนินการ...\n`
    }

    display += "\n"
  })

  if (workflow.status === "completed") {
    const duration =
      workflow.completedAt && workflow.startedAt
        ? Math.round((new Date(workflow.completedAt).getTime() - new Date(workflow.startedAt).getTime()) / 1000)
        : 0
    display += `🎉 **เสร็จสิ้น** ใช้เวลา ${duration} วินาที\n`
  }

  return display
}
