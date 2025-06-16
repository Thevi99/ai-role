"use server"

import type { WorkflowPlan } from "./workflow-planner"

export interface WorkflowUpdate {
  workflowId: string
  stepId?: string
  status: string
  progress?: number
  message?: string
  timestamp: string
  data?: any
}

// Simulate real-time updates from Power Automate
export async function trackWorkflowProgress(workflowId: string): Promise<WorkflowUpdate[]> {
  // In a real implementation, this would connect to Power Automate webhooks
  // or poll the Power Automate API for status updates

  console.log(`🔍 Tracking workflow progress: ${workflowId}`)

  // Simulate getting updates from Power Automate
  const updates: WorkflowUpdate[] = []

  // Simulate some progress updates
  if (Math.random() > 0.3) {
    updates.push({
      workflowId,
      status: "step_completed",
      message: "Meeting created successfully",
      timestamp: new Date().toISOString(),
      data: {
        meetingId: "meeting_" + Math.random().toString(36).substr(2, 9),
        meetingUrl: "https://teams.microsoft.com/l/meetup-join/...",
      },
    })
  }

  if (Math.random() > 0.5) {
    updates.push({
      workflowId,
      status: "step_in_progress",
      message: "Sending emails...",
      progress: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
    })
  }

  return updates
}

// Get workflow status from Power Automate
export async function getWorkflowStatus(workflowId: string): Promise<WorkflowPlan | null> {
  try {
    // In a real implementation, this would query Power Automate API
    console.log(`📊 Getting workflow status: ${workflowId}`)

    // For now, return null to indicate no updates available
    return null
  } catch (error) {
    console.error("Failed to get workflow status:", error)
    return null
  }
}

// Subscribe to workflow updates (WebSocket simulation)
export async function subscribeToWorkflowUpdates(
  workflowId: string,
  callback: (update: WorkflowUpdate) => void,
): Promise<() => void> {
  console.log(`🔔 Subscribing to workflow updates: ${workflowId}`)

  // Simulate real-time updates
  const interval = setInterval(async () => {
    const updates = await trackWorkflowProgress(workflowId)
    updates.forEach(callback)
  }, 5000) // Check every 5 seconds

  // Return unsubscribe function
  return () => {
    console.log(`🔕 Unsubscribing from workflow updates: ${workflowId}`)
    clearInterval(interval)
  }
}

// Parse Power Automate webhook data
export function parsePowerAutomateWebhook(webhookData: any): WorkflowUpdate | null {
  try {
    // Parse webhook data from Power Automate
    if (webhookData?.status && webhookData?.workflowId) {
      return {
        workflowId: webhookData.workflowId,
        stepId: webhookData.stepId,
        status: webhookData.status,
        progress: webhookData.progress,
        message: webhookData.message,
        timestamp: webhookData.timestamp || new Date().toISOString(),
        data: webhookData.data,
      }
    }
    return null
  } catch (error) {
    console.error("Failed to parse Power Automate webhook:", error)
    return null
  }
}

// Update workflow with real-time data - FIXED VERSION
export function updateWorkflowWithTracking(workflow: WorkflowPlan, updates: WorkflowUpdate[]): WorkflowPlan {
  // Safety check: ensure workflow exists and has required properties
  if (!workflow) {
    console.warn("Workflow is undefined, cannot update")
    return {
      id: "unknown",
      title: "Unknown Workflow",
      description: "Workflow data not available",
      steps: [],
      status: "pending",
      priority: "medium",
      estimatedDuration: 0,
      progress: { completed: 0, total: 0, percentage: 0 },
    }
  }

  // Ensure workflow has steps array
  if (!Array.isArray(workflow.steps)) {
    console.warn("Workflow steps is not an array, initializing empty array")
    workflow.steps = []
  }

  // Ensure updates is an array
  if (!Array.isArray(updates)) {
    console.warn("Updates is not an array, skipping update")
    return workflow
  }

  const updatedWorkflow = {
    ...workflow,
    steps: [...(workflow.steps || [])], // Ensure steps is always an array
  }

  updates.forEach((update) => {
    try {
      if (update?.stepId && updatedWorkflow.steps) {
        // Update specific step
        const stepIndex = updatedWorkflow.steps.findIndex((s) => s?.id === update.stepId)
        if (stepIndex !== -1 && updatedWorkflow.steps[stepIndex]) {
          const step = { ...updatedWorkflow.steps[stepIndex] }

          switch (update.status) {
            case "step_in_progress":
              step.status = "in_progress"
              step.startTime = update.timestamp
              break
            case "step_completed":
              step.status = "completed"
              step.endTime = update.timestamp
              step.result = update.data
              break
            case "step_failed":
              step.status = "failed"
              step.error = update.message
              step.endTime = update.timestamp
              break
          }

          updatedWorkflow.steps[stepIndex] = step
        }
      } else {
        // Update overall workflow
        switch (update.status) {
          case "workflow_executing":
            updatedWorkflow.status = "executing"
            updatedWorkflow.startedAt = update.timestamp
            break
          case "workflow_completed":
            updatedWorkflow.status = "completed"
            updatedWorkflow.completedAt = update.timestamp
            break
          case "workflow_failed":
            updatedWorkflow.status = "failed"
            updatedWorkflow.completedAt = update.timestamp
            break
        }
      }
    } catch (error) {
      console.error("Error processing workflow update:", error, update)
    }
  })

  // Recalculate progress safely
  try {
    const steps = updatedWorkflow.steps || []
    const completedSteps = steps.filter((s) => s?.status === "completed").length
    const totalSteps = steps.length || 1 // Avoid division by zero

    updatedWorkflow.progress = {
      completed: completedSteps,
      total: totalSteps,
      percentage: Math.round((completedSteps / totalSteps) * 100),
    }
  } catch (error) {
    console.error("Error calculating workflow progress:", error)
    updatedWorkflow.progress = { completed: 0, total: 0, percentage: 0 }
  }

  return updatedWorkflow
}

// Safe workflow validation
export function validateWorkflow(workflow: any): WorkflowPlan | null {
  try {
    if (!workflow || typeof workflow !== "object") {
      return null
    }

    return {
      id: workflow.id || "unknown",
      title: workflow.title || "Untitled Workflow",
      description: workflow.description || "",
      steps: Array.isArray(workflow.steps) ? workflow.steps : [],
      status: workflow.status || "pending",
      priority: workflow.priority || "medium",
      estimatedDuration: workflow.estimatedDuration || 0,
      progress: workflow.progress || { completed: 0, total: 0, percentage: 0 },
      startedAt: workflow.startedAt,
      completedAt: workflow.completedAt,
    }
  } catch (error) {
    console.error("Error validating workflow:", error)
    return null
  }
}

// Create default workflow when none exists
export function createDefaultWorkflow(): WorkflowPlan {
  return {
    id: "default-" + Date.now(),
    title: "Sample Workflow",
    description: "This is a sample workflow for demonstration",
    steps: [
      {
        id: "step-1",
        title: "Initialize Process",
        description: "Setting up the workflow",
        status: "pending",
        type: "action",
        estimatedDuration: 30,
      },
      {
        id: "step-2",
        title: "Process Data",
        description: "Processing the input data",
        status: "pending",
        type: "action",
        estimatedDuration: 60,
      },
      {
        id: "step-3",
        title: "Generate Output",
        description: "Creating the final output",
        status: "pending",
        type: "action",
        estimatedDuration: 45,
      },
    ],
    status: "pending",
    priority: "medium",
    estimatedDuration: 135,
    progress: { completed: 0, total: 3, percentage: 0 },
  }
}
