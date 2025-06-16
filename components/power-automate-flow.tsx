"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Mail,
  MessageSquare,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  X,
  Settings,
  Zap,
  RefreshCw,
  MoreHorizontal,
  ArrowDown,
  ChevronDown
} from "lucide-react"
import type { WorkflowPlan, WorkflowStep } from "../lib/workflow-planner"

interface PowerAutomateFlowProps {
  workflow: WorkflowPlan
  onRefresh?: () => void
}

// Get icon for step type (like Power Automate)
function getStepIcon(type: string) {
  switch (type) {
    case "meeting":
      return Calendar
    case "email":
      return Mail
    case "post":
      return MessageSquare
    case "reminder":
      return Bell
    case "task":
      return CheckCircle
    default:
      return Settings
  }
}

// Get status colors (ChatGPT Dark theme)
function getStatusColors(status: string) {
  switch (status) {
    case "completed":
      return {
        bg: "bg-[#10a37f]/10 border-[#10a37f]/30",
        icon: "text-[#10a37f]",
        badge: "bg-[#10a37f]/20 text-[#10a37f] border-[#10a37f]/30",
        connector: "bg-[#10a37f]",
      }
    case "in_progress":
      return {
        bg: "bg-[#0084ff]/10 border-[#0084ff]/30 animate-pulse",
        icon: "text-[#0084ff]",
        badge: "bg-[#0084ff]/20 text-[#0084ff] border-[#0084ff]/30",
        connector: "bg-[#0084ff]",
      }
    case "failed":
      return {
        bg: "bg-[#ff6b6b]/10 border-[#ff6b6b]/30",
        icon: "text-[#ff6b6b]",
        badge: "bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30",
        connector: "bg-[#ff6b6b]",
      }
    case "pending":
      return {
        bg: "bg-[#2f2f2f] border-[#4f4f4f]",
        icon: "text-[#8e8ea0]",
        badge: "bg-[#3f3f3f] text-[#b4b4b4] border-[#4f4f4f]",
        connector: "bg-[#4f4f4f]",
      }
    default:
      return {
        bg: "bg-[#2f2f2f] border-[#4f4f4f]",
        icon: "text-[#8e8ea0]",
        badge: "bg-[#3f3f3f] text-[#b4b4b4] border-[#4f4f4f]",
        connector: "bg-[#4f4f4f]",
      }
  }
}

// Get status icon (like Power Automate)
function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return CheckCircle
    case "in_progress":
      return Play
    case "failed":
      return X
    case "pending":
      return Clock
    default:
      return AlertTriangle
  }
}

// Individual step component (ChatGPT Dark theme)
function FlowStepCard({ step, index, isLast }: { step: WorkflowStep; index: number; isLast: boolean }) {
  const StepIcon = getStepIcon(step.type)
  const StatusIcon = getStatusIcon(step.status)
  const colors = getStatusColors(step.status)

  return (
    <div className="relative">
      {/* Step Card - ChatGPT Dark Theme */}
      <Card
        className={`w-full max-w-md mx-auto ${colors.bg} border-2 transition-all duration-300 hover:shadow-lg hover:shadow-black/50`}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-[#1a1a1a] shadow-sm`}>
                <StepIcon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#ececec] text-sm">{step.title}</h4>
                <p className="text-xs text-[#b4b4b4] mt-1">{step.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${colors.icon}`} />
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[#8e8ea0] hover:text-[#ececec]">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${colors.badge} border`}>
              {step.status === "in_progress" && "กำลังทำงาน"}
              {step.status === "completed" && "เสร็จสิ้น"}
              {step.status === "failed" && "ล้มเหลว"}
              {step.status === "pending" && "รอดำเนินการ"}
            </Badge>
            <div className="text-xs text-[#8e8ea0]">{step.estimatedDuration} นาที</div>
          </div>

          {/* Progress Bar for In-Progress */}
          {step.status === "in_progress" && (
            <div className="mt-3">
              <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                <div className="bg-[#0084ff] h-1.5 rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {step.status === "failed" && step.error && (
            <div className="mt-3 p-2 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded text-xs text-[#ff6b6b]">
              ❌ {step.error}
            </div>
          )}

          {/* Success Message */}
          {step.status === "completed" && (
            <div className="mt-3 p-2 bg-[#10a37f]/10 border border-[#10a37f]/30 rounded text-xs text-[#10a37f]">
              ✅ ดำเนินการเสร็จสิ้น
              {step.endTime && <div className="mt-1">เวลา: {new Date(step.endTime).toLocaleTimeString("th-TH")}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connector Arrow (ChatGPT Dark theme) */}
      {!isLast && (
      <div className="flex justify-center my-2 relative">
        <div className={`w-0.5 h-6 ${colors.connector}`}></div>
        <ArrowDown className={`w-4 h-12 ${colors.icon} absolute left-1/2 transform -translate-x-1/2 -mt-1`} />
      </div>
    )}
    </div>
  )
}

export default function PowerAutomateFlow({ workflow, onRefresh }: PowerAutomateFlowProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      if (onRefresh && workflow?.status === "executing") {
        onRefresh()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [onRefresh, workflow?.status])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    if (onRefresh) {
      await onRefresh()
    }
    setLastUpdate(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  if (!workflow) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-[#2f2f2f] rounded-lg border border-[#4f4f4f] shadow-sm">
        <div className="text-center text-[#8e8ea0]">
          <div className="text-lg mb-2">⚠️ ไม่มีข้อมูล Workflow</div>
          <div className="text-sm">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    )
  }

  const safeSteps = workflow.steps || []
  const completedSteps = safeSteps.filter((s) => s?.status === "completed").length
  const totalSteps = safeSteps.length

  // Overall workflow status
  const workflowStatusColors = getStatusColors(workflow.status || "pending")

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Workflow Header (ChatGPT Dark theme) */}
      <Card className="bg-[#2f2f2f] border border-[#4f4f4f] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#10a37f]/20 rounded-lg">
                <Zap className="w-6 h-6 text-[#10a37f]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#ececec]">{workflow.title}</h2>
                <p className="text-sm text-[#b4b4b4] mt-1">{workflow.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="border-[#4f4f4f] bg-[#1a1a1a] text-[#ececec] hover:bg-[#3f3f3f]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                รีเฟรช
              </Button>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
              <div className="text-2xl font-bold text-[#ececec]">{completedSteps}</div>
              <div className="text-sm text-[#8e8ea0]">เสร็จแล้ว</div>
            </div>
            <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
              <div className="text-2xl font-bold text-[#ececec]">{totalSteps}</div>
              <div className="text-sm text-[#8e8ea0]">ทั้งหมด</div>
            </div>
            <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
              <div className="text-2xl font-bold text-[#ececec]">{workflow.totalEstimatedDuration || 0}</div>
              <div className="text-sm text-[#8e8ea0]">นาที</div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-[#8e8ea0] mb-2">
              <span>ความคืบหน้า</span>
              <span>{Math.round((completedSteps / (totalSteps || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-[#1a1a1a] rounded-full h-2">
              <div
                className="bg-[#10a37f] h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps / (totalSteps || 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Workflow Status */}
          <div className="flex items-center justify-between">
            <Badge className={`${workflowStatusColors.badge} border`}>
              {workflow.status === "executing" && "🔄 กำลังทำงาน"}
              {workflow.status === "completed" && "✅ เสร็จสิ้น"}
              {workflow.status === "failed" && "❌ ล้มเหลว"}
              {workflow.status === "planning" && "📋 วางแผน"}
              {workflow.status === "pending" && "⏳ รอดำเนินการ"}
            </Badge>
            <div className="text-xs text-[#8e8ea0]">อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString("th-TH")}</div>
          </div>
        </CardContent>
      </Card>

      {/* Flow Steps (ChatGPT Dark theme) */}
      <div className="space-y-0">
        {safeSteps.map((step, index) => (
          <FlowStepCard key={step.id} step={step} index={index} isLast={index === safeSteps.length - 1} />
        ))}
      </div>

      {/* Empty State */}
      {safeSteps.length === 0 && (
        <Card className="bg-[#2f2f2f] border border-[#4f4f4f] border-dashed">
          <CardContent className="p-8 text-center">
            <div className="text-[#8e8ea0] mb-4">
              <Settings className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-[#ececec] mb-2">ไม่มีขั้นตอนใน Workflow</h3>
            <p className="text-[#8e8ea0]">เพิ่มขั้นตอนเพื่อเริ่มต้นการทำงาน</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Footer */}
      {workflow.status === "completed" && (
        <Card className="bg-[#10a37f]/10 border border-[#10a37f]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#10a37f]" />
              <div>
                <h4 className="font-semibold text-[#10a37f]">Workflow เสร็จสิ้นแล้ว! 🎉</h4>
                <p className="text-sm text-[#10a37f]">
                  ทำงานเสร็จทั้งหมด {completedSteps} ขั้นตอน
                  {workflow.completedAt && workflow.startedAt && (
                    <span>
                      {" "}
                      ใช้เวลา{" "}
                      {Math.round(
                        (new Date(workflow.completedAt).getTime() - new Date(workflow.startedAt).getTime()) / 1000,
                      )}{" "}
                      วินาที
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
