"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bot,
  User,
  Loader2,
  Zap,
  CheckCircle,
  AlertTriangle,
  Plus,
  Settings,
  Mic,
  MessageSquare,
  Clock,
  Send,
} from "lucide-react"

import { triggerPowerAutomate, shouldTriggerPowerAutomate, type PowerAutomateResponse } from "./lib/power-automate"
import ExpandablePowerAutomateFlow from "./components/expandable-power-automate-flow"
import type { WorkflowPlan } from "./lib/workflow-planner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  workflow?: WorkflowPlan
  powerAutomateResult?: PowerAutomateResponse
}

// ปรับปรุงการสร้าง workflow ให้รองรับสถานะ processing
function createWorkflowFromPowerAutomate(userInput: string, result: PowerAutomateResponse): WorkflowPlan {
  const workflowId = crypto.randomUUID()

  // วิเคราะห์คำขอเพื่อสร้าง steps ที่เหมาะสม
  const steps = analyzeUserRequestAndCreateSteps(userInput, result)

  const completedSteps = steps.filter((s) => s.status === "completed").length
  const processingSteps = steps.filter((s) => s.status === "in_progress").length

  // กำหนดสถานะ workflow
  let workflowStatus: "planning" | "executing" | "completed" | "failed" | "paused" = "completed"
  if (result.isProcessing) {
    workflowStatus = "executing"
  } else if (!result.success) {
    workflowStatus = "failed"
  }

  return {
    id: workflowId,
    title: generateWorkflowTitle(userInput),
    description: userInput,
    steps,
    totalEstimatedDuration: steps.length * 2,
    status: workflowStatus,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: workflowStatus === "completed" ? new Date().toISOString() : undefined,
    progress: {
      completed: completedSteps,
      total: steps.length,
      percentage: Math.round((completedSteps / steps.length) * 100),
    },
  }
}

// ฟังก์ชันใหม่: วิเคราะห์คำขอและสร้าง steps
function analyzeUserRequestAndCreateSteps(userInput: string, result: PowerAutomateResponse) {
  const steps = []

  // ตรวจสอบการประชุม
  if (userInput.includes("ประชุม") || userInput.includes("meeting")) {
    steps.push({
      id: crypto.randomUUID(),
      type: "meeting" as const,
      title: "สร้างการประชุมทีม",
      description: "สร้างการประชุมเวลา 8:00 น.",
      dependencies: [],
      estimatedDuration: 2,
      priority: "high" as const,
      parameters: { time: "08:00", title: "ประชุมทีม" },
      status: result.isProcessing
        ? ("in_progress" as const)
        : result.success
          ? ("completed" as const)
          : ("failed" as const),
      startTime: new Date().toISOString(),
      endTime: result.success && !result.isProcessing ? new Date().toISOString() : undefined,
    })
  }

  // ตรวจสอบ Email
  if (userInput.includes("email") || userInput.includes("ส่ง")) {
    const emailMatch = userInput.match(/[\w.-]+@[\w.-]+\.\w+/g) || []
    steps.push({
      id: crypto.randomUUID(),
      type: "email" as const,
      title: "ส่ง Email แจ้งเตือน",
      description: `ส่ง email ไปยัง ${emailMatch.length} ที่อยู่`,
      dependencies: steps.length > 0 ? [steps[0].id] : [],
      estimatedDuration: 1,
      priority: "high" as const,
      parameters: { recipients: emailMatch },
      status: result.isProcessing
        ? ("in_progress" as const)
        : result.success
          ? ("completed" as const)
          : ("failed" as const),
      startTime: new Date().toISOString(),
      endTime: result.success && !result.isProcessing ? new Date().toISOString() : undefined,
    })
  }

  // ตรวจสอบ Teams Post
  if (userInput.includes("โพส") || userInput.includes("post") || userInput.includes("team")) {
    steps.push({
      id: crypto.randomUUID(),
      type: "post" as const,
      title: "โพสข้อความใน Teams",
      description: "โพสข้อความเกี่ยวกับการประชุม",
      dependencies: steps.length > 0 ? [steps[steps.length - 1].id] : [],
      estimatedDuration: 1,
      priority: "medium" as const,
      parameters: { platform: "Microsoft Teams", time: "13:00" },
      status: result.isProcessing
        ? ("in_progress" as const)
        : result.success
          ? ("completed" as const)
          : ("failed" as const),
      startTime: new Date().toISOString(),
      endTime: result.success && !result.isProcessing ? new Date().toISOString() : undefined,
    })
  }

  // ถ้าไม่มี steps เฉพาะ ให้สร้าง default step
  if (steps.length === 0) {
    steps.push({
      id: crypto.randomUUID(),
      type: "task" as const,
      title: "ดำเนินการตามคำขอ",
      description: userInput,
      dependencies: [],
      estimatedDuration: 2,
      priority: "high" as const,
      parameters: {},
      status: result.isProcessing
        ? ("in_progress" as const)
        : result.success
          ? ("completed" as const)
          : ("failed" as const),
      startTime: new Date().toISOString(),
      endTime: result.success && !result.isProcessing ? new Date().toISOString() : undefined,
      error: !result.success ? result.error : undefined,
    })
  }

  return steps
}

function getTaskTitle(taskType: string): string {
  switch (taskType) {
    case "create_meeting":
      return "สร้างการประชุม"
    case "send_email":
      return "ส่ง Email"
    case "post_message":
      return "โพสข้อความ"
    default:
      return "ดำเนินการ"
  }
}

function generateWorkflowTitle(input: string): string {
  if (input.includes("ประชุม") || input.includes("meeting")) return "🗓️ การประชุม"
  if (input.includes("email") || input.includes("อีเมล")) return "📧 ส่ง Email"
  if (input.includes("โพส") || input.includes("post")) return "💬 โพสข้อความ"
  if (input.includes("แจ้ง") || input.includes("notify")) return "🔔 การแจ้งเตือน"
  return "⚡ Power Automate"
}

export default function RoleChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowPlan | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // เพิ่ม state สำหรับการขยาย panel
  const [panelWidth, setPanelWidth] = useState(480)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // เพิ่ม useEffect สำหรับการจัดการ mouse events ในการขยาย
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = window.innerWidth - e.clientX
      const minWidth = 320 // ความกว้างขั้นต่ำ
      const maxWidth = window.innerWidth * 0.6 // ความกว้างสูงสุด 60% ของหน้าจอ
      
      setPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizing) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // ฟังก์ชันเริ่มการขยาย
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  // ปรับปรุงการสร้างข้อความตอบกลับ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      // ตรวจสอบว่าควรเรียก Power Automate หรือไม่
      const shouldTrigger = await shouldTriggerPowerAutomate(userInput)

      if (shouldTrigger) {
        // เรียก Power Automate API ทันที
        console.log("🚀 Triggering Power Automate for:", userInput)

        const powerAutomateResult = await triggerPowerAutomate(userInput, false)

        // สร้าง workflow จากผลลัพธ์
        const workflow = createWorkflowFromPowerAutomate(userInput, powerAutomateResult)
        setCurrentWorkflow(workflow)

        // สร้างข้อความตอบกลับที่ดีขึ้น
        let responseContent = ""

        if (powerAutomateResult.success) {
          if (powerAutomateResult.isProcessing) {
            responseContent = `🔄 **กำลังดำเนินการ...**

${powerAutomateResult.flowSummary || "Power Automate กำลังประมวลผลคำขอของคุณ"}

📋 **รายละเอียดที่ตรวจพบ:**`

            // วิเคราะห์และแสดงรายละเอียด
            if (userInput.includes("ประชุม")) {
              responseContent += "\n• 📅 สร้างการประชุมทีมเวลา 8:00 น."
            }
            if (userInput.includes("email")) {
              const emails = userInput.match(/[\w.-]+@[\w.-]+\.\w+/g) || []
              responseContent += `\n• 📧 ส่ง email ไปยัง ${emails.length} ที่อยู่: ${emails.join(", ")}`
            }
            if (userInput.includes("โพส") || userInput.includes("team")) {
              responseContent += "\n• 💬 โพสข้อความใน Microsoft Teams ตอนบ่าย"
            }

            responseContent += `\n\n⏱️ **สถานะ**: กำลังประมวลผลในเบื้องหลัง
🔄 **ระยะเวลาโดยประมาณ**: ${workflow.totalEstimatedDuration} นาที
📊 **ความคืบหน้า**: ${workflow.progress.percentage}%

💡 **หมายเหตุ**: Logic App กำลังทำงาน ผลลัพธ์จะปรากฏเมื่อเสร็จสิ้น`
          } else {
            responseContent = `✅ **ดำเนินการสำเร็จ!**

${powerAutomateResult.flowSummary || powerAutomateResult.message || "Power Automate ทำงานเสร็จเรียบร้อยแล้ว"}

📊 **สรุปผลการทำงาน:**
- สถานะ: เสร็จสิ้น ✅
- เวลาที่ใช้: ${workflow.totalEstimatedDuration} นาที (ประมาณ)
- ขั้นตอนที่สำเร็จ: ${workflow.progress.completed}/${workflow.progress.total}`
          }

          if (powerAutomateResult.trackingId) {
            responseContent += `\n- Tracking ID: ${powerAutomateResult.trackingId.substring(0, 8)}...`
          }
        } else {
          responseContent = `❌ **เกิดข้อผิดพลาด**

${powerAutomateResult.error || "ไม่สามารถดำเนินการได้"}

🔧 **รายละเอียด:**
- สถานะ: ${powerAutomateResult.statusCode ? `HTTP ${powerAutomateResult.statusCode}` : "ไม่ทราบ"}
- ประเภท: ${powerAutomateResult.isTemporary ? "ข้อผิดพลาดชั่วคราว" : "ข้อผิดพลาดถาวร"}

${powerAutomateResult.isTemporary ? "💡 **คำแนะนำ:** ลองใหม่อีกครั้งในอีกสักครู่" : "💡 **คำแนะนำ:** ตรวจสอบการตั้งค่า Power Automate"}`

          if (powerAutomateResult.trackingId) {
            responseContent += `\n\n🆔 **Tracking ID:** ${powerAutomateResult.trackingId}`
          }
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
          workflow,
          powerAutomateResult,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // ข้อความทั่วไป - ไม่เรียก Power Automate
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `สวัสดีครับ! ผมสามารถช่วยคุณทำงานเหล่านี้ได้:

• 📅 สร้างการประชุม (เช่น "สร้างประชุมทีมพรุ่งนี้ 9 โมง")
• 📧 ส่ง Email (เช่น "ส่งอีเมลแจ้งเตือนให้ทีม")
• 💬 โพสข้อความ (เช่น "โพสข้อความใน Teams")
• 🔔 ตั้งการแจ้งเตือน (เช่น "แจ้งเตือนติดตามงาน")

ลองพิมพ์คำสั่งที่คุณต้องการดูครับ!`,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ **เกิดข้อผิดพลาด**

ไม่สามารถเชื่อมต่อกับ Power Automate ได้

🔧 **สาเหตุที่เป็นไปได้:**
- ปัญหาการเชื่อมต่อเครือข่าย
- Power Automate API ไม่พร้อมใช้งาน
- การตั้งค่า URL ไม่ถูกต้อง

💡 **คำแนะนำ:** กรุณาลองใหม่อีกครั้งในอีกสักครู่`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshWorkflow = async () => {
    if (!currentWorkflow) return

    // Simulate refresh - ในการใช้งานจริงอาจจะเรียก API เพื่อดูสถานะล่าสุด
    console.log("🔄 Refreshing workflow status...")
    setCurrentWorkflow({ ...currentWorkflow })
  }

  return (
    <div className="flex h-screen bg-[#212121]">
      {/* Sidebar - ChatGPT Dark Theme */}
      <div className="w-64 bg-[#171717] border-r border-[#2f2f2f] flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-[#2f2f2f]">
          <h1 className="text-xl font-bold text-white">Role</h1>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2f2f2f] text-white hover:bg-[#3f3f3f] cursor-pointer transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Conversations</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg text-[#b4b4b4] hover:bg-[#2f2f2f] cursor-pointer transition-colors">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Older</span>
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-[#2f2f2f]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2f2f2f] cursor-pointer transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#3f3f3f] text-white text-xs">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-white">User</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area - ChatGPT Dark Theme */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
                <h2 className="text-4xl font-semibold text-white mb-4">Welcome to Role,</h2>
                <h3 className="text-4xl font-semibold text-white mb-8">What can I help you today?</h3>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-4">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className={message.role === "user" ? "bg-[#3f3f3f]" : "bg-[#10a37f]"}>
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="bg-[#2f2f2f] rounded-lg p-4 border border-[#3f3f3f]">
                      <div className="text-[#ececec] whitespace-pre-wrap">{message.content}</div>

                      {/* แสดงสถานะ Power Automate */}
                      {message.powerAutomateResult && (
                        <div className="mt-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#3f3f3f]">
                          <div className="flex items-center gap-2 text-sm">
                            {message.powerAutomateResult.success ? (
                              <CheckCircle className="w-4 h-4 text-[#10a37f]" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-[#ff6b6b]" />
                            )}
                            <span className="font-medium text-[#ececec]">
                              Power Automate: {message.powerAutomateResult.success ? "สำเร็จ" : "ล้มเหลว"}
                            </span>
                            {message.powerAutomateResult.statusCode && (
                              <span className="text-[#b4b4b4]">({message.powerAutomateResult.statusCode})</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-[#8e8ea0]">{message.timestamp.toLocaleTimeString("th-TH")}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-[#10a37f]">
                      <Bot className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-[#2f2f2f] rounded-lg p-4 border border-[#3f3f3f]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#10a37f]" />
                      <span className="text-sm text-[#ececec]">กำลังเรียก Power Automate...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Input Area - ChatGPT Dark Theme with Send Button */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <div className="flex items-center bg-[#2f2f2f] border border-[#4f4f4f] rounded-2xl p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#3f3f3f] rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>

                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message Role..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-0 text-[#ececec] placeholder-[#8e8ea0] focus-visible:ring-0 focus-visible:ring-offset-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#3f3f3f] rounded-xl"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#3f3f3f] rounded-xl"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                    
                    {/* Send Button - แสดงเฉพาะเมื่อมีข้อความ */}
                    {input.trim() && (
                      <Button
                        type="submit"
                        disabled={isLoading}
                        size="sm"
                        className="bg-[#10a37f] hover:bg-[#0f8c69] text-white rounded-xl px-3 py-2 transition-all duration-200 transform hover:scale-105"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Workflow Panel - แก้ไขให้ขยายได้ */}
      {currentWorkflow && (
        <>
          {/* Resize Handle */}
          <div
            ref={resizeRef}
            className="w-1 bg-[#2f2f2f] hover:bg-[#4f4f4f] cursor-col-resize transition-colors relative group"
            onMouseDown={handleResizeStart}
          >
            {/* Visual indicator เมื่อ hover */}
            <div className="absolute inset-0 group-hover:bg-[#10a37f] opacity-50 transition-opacity" />
          </div>
          
          <div 
            className="bg-[#171717] border-l border-[#2f2f2f] flex flex-col transition-all duration-200"
            style={{ width: `${panelWidth}px` }}
          >
            <div className="p-4 border-b border-[#2f2f2f]">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#10a37f]" />
                Power Automate Flow
              </h2>
              <p className="text-xs text-[#b4b4b4] mt-1">ผลลัพธ์จาก API</p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <ExpandablePowerAutomateFlow workflow={currentWorkflow} onRefresh={handleRefreshWorkflow} />
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  )
}