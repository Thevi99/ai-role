"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
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
  ArrowRight,
  User,
  Settings,
  Zap,
  Eye,
  RefreshCw,
  Activity,
  Timer,
  Target,
  TrendingUp,
} from "lucide-react"
import type { WorkflowPlan, WorkflowStep } from "../lib/workflow-planner"

interface WorkflowVisualizerProps {
  workflow: WorkflowPlan
  onRefresh?: () => void
  realTimeUpdates?: boolean
}

// Enhanced step icons with gradients
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

// Enhanced color schemes with gradients
function getStepColors(type: string) {
  switch (type) {
    case "meeting":
      return {
        gradient: "from-blue-500 to-blue-600",
        border: "border-blue-400/50",
        text: "text-blue-50",
        icon: "text-white",
        glow: "shadow-blue-500/25",
        bg: "bg-gradient-to-br from-blue-500 to-blue-600",
      }
    case "email":
      return {
        gradient: "from-emerald-500 to-emerald-600",
        border: "border-emerald-400/50",
        text: "text-emerald-50",
        icon: "text-white",
        glow: "shadow-emerald-500/25",
        bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      }
    case "post":
      return {
        gradient: "from-purple-500 to-purple-600",
        border: "border-purple-400/50",
        text: "text-purple-50",
        icon: "text-white",
        glow: "shadow-purple-500/25",
        bg: "bg-gradient-to-br from-purple-500 to-purple-600",
      }
    case "reminder":
      return {
        gradient: "from-orange-500 to-orange-600",
        border: "border-orange-400/50",
        text: "text-orange-50",
        icon: "text-white",
        glow: "shadow-orange-500/25",
        bg: "bg-gradient-to-br from-orange-500 to-orange-600",
      }
    case "task":
      return {
        gradient: "from-teal-500 to-teal-600",
        border: "border-teal-400/50",
        text: "text-teal-50",
        icon: "text-white",
        glow: "shadow-teal-500/25",
        bg: "bg-gradient-to-br from-teal-500 to-teal-600",
      }
    default:
      return {
        gradient: "from-gray-500 to-gray-600",
        border: "border-gray-400/50",
        text: "text-gray-50",
        icon: "text-white",
        glow: "shadow-gray-500/25",
        bg: "bg-gradient-to-br from-gray-500 to-gray-600",
      }
  }
}

// Enhanced status display with animations
function getStatusDisplay(status: string) {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle,
        color: "text-green-400",
        bg: "bg-green-500/20",
        border: "border-green-400/50",
        pulse: false,
      }
    case "in_progress":
      return {
        icon: Play,
        color: "text-blue-400",
        bg: "bg-blue-500/20",
        border: "border-blue-400/50",
        pulse: true,
      }
    case "failed":
      return {
        icon: X,
        color: "text-red-400",
        bg: "bg-red-500/20",
        border: "border-red-400/50",
        pulse: false,
      }
    case "pending":
      return {
        icon: Clock,
        color: "text-gray-400",
        bg: "bg-gray-500/20",
        border: "border-gray-400/50",
        pulse: false,
      }
    default:
      return {
        icon: AlertTriangle,
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
        border: "border-yellow-400/50",
        pulse: false,
      }
  }
}

// Calculate enhanced grid layout with error handling
function calculateLayout(steps: WorkflowStep[]) {
  // Add safety check for undefined or empty steps
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return []
  }

  const levels: WorkflowStep[][] = []
  const processed = new Set<string>()

  function getLevel(step: WorkflowStep): number {
    if (!step || !step.dependencies || step.dependencies.length === 0) return 0

    let maxLevel = -1
    for (const depId of step.dependencies) {
      const depStep = steps.find((s) => s && s.id === depId)
      if (depStep) {
        maxLevel = Math.max(maxLevel, getLevel(depStep))
      }
    }
    return maxLevel + 1
  }

  // Group steps by level with safety checks
  steps.forEach((step) => {
    if (!step || !step.id) return // Skip invalid steps

    const level = getLevel(step)
    if (!levels[level]) levels[level] = []
    levels[level].push(step)
  })

  return levels
}

export default function WorkflowVisualizer({ workflow, onRefresh, realTimeUpdates = true }: WorkflowVisualizerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const safeSteps = workflow.steps || []
  const levels = calculateLayout(safeSteps)

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return

    const interval = setInterval(() => {
      setLastUpdate(new Date())
      if (onRefresh && workflow.status === "executing") {
        onRefresh()
      }
    }, 3000) // Refresh every 3 seconds when executing

    return () => clearInterval(interval)
  }, [realTimeUpdates, onRefresh, workflow.status])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    if (onRefresh) {
      await onRefresh()
    }
    setLastUpdate(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const statusIcon = {
    planning: "📋",
    executing: "⚡",
    completed: "✅",
    failed: "❌",
    paused: "⏸️",
  }[workflow.status]

  const progressPercentage = workflow.progress.percentage
  const progressColor =
    progressPercentage === 100
      ? "from-green-500 to-emerald-500"
      : progressPercentage > 50
        ? "from-blue-500 to-cyan-500"
        : "from-yellow-500 to-orange-500"

  const completedSteps = safeSteps.filter((s) => s && s.status === "completed").length
  const failedSteps = safeSteps.filter((s) => s && s.status === "failed").length
  const inProgressSteps = safeSteps.filter((s) => s && s.status === "in_progress").length

  // Add safety check for workflow
  if (!workflow) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 bg-gray-900 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">⚠️ No workflow data available</div>
          <div className="text-sm">Workflow information is loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Enhanced Header with Glass Effect */}
      <div className="relative mb-8 p-6 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl" />
        <div className="relative">
          {/* Title and Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{statusIcon}</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{workflow.title}</h3>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={`text-sm font-medium ${
                      workflow.status === "completed"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : workflow.status === "executing"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : workflow.status === "failed"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }`}
                  >
                    {workflow.status.toUpperCase()}
                  </Badge>
                  {realTimeUpdates && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Activity className="w-3 h-3" />
                      <span>Live Updates</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50">
                <Eye className="w-4 h-4 mr-2" />
                Details
              </Button>
            </div>
          </div>

          {/* Enhanced Progress Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Progress Bar */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
                <span className="font-medium">ความคืบหน้าโดยรวม</span>
                <span className="font-bold text-lg">{progressPercentage}%</span>
              </div>
              <div className="relative w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-1000 ease-out relative`}
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-400">{completedSteps}</div>
                  <div className="text-xs text-green-300">เสร็จแล้ว</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-blue-400">{workflow.totalEstimatedDuration}</div>
                  <div className="text-xs text-blue-300">นาที</div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>
                {workflow.progress.completed}/{workflow.progress.total} งาน
              </span>
            </div>
            {workflow.startedAt && (
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>เริ่ม: {new Date(workflow.startedAt).toLocaleTimeString("th-TH")}</span>
              </div>
            )}
            {realTimeUpdates && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString("th-TH")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Workflow Visualization */}
      <div className="relative">
        {levels.map((level, levelIndex) => (
          <div key={levelIndex} className="mb-12 last:mb-0">
            {/* Enhanced Level Indicator */}
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Level {levelIndex + 1}
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
            </div>

            {/* Enhanced Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {level.map((step, stepIndex) => {
                const StepIcon = getStepIcon(step.type)
                const colors = getStepColors(step.type)
                const statusDisplay = getStatusDisplay(step.status)
                const StatusIcon = statusDisplay.icon

                return (
                  <div key={step.id} className="relative group">
                    {/* Connection Lines */}
                    {step.dependencies.length > 0 && levelIndex > 0 && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                        <div className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent" />
                        <ArrowRight className="w-4 h-4 text-gray-500 rotate-90 -mt-2 -ml-2" />
                      </div>
                    )}

                    {/* Enhanced Step Card */}
                    <Card
                      className={`relative h-40 ${colors.bg} ${colors.border} border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${colors.glow} shadow-xl group-hover:shadow-2xl backdrop-blur-sm`}
                    >
                      {/* Animated Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg" />

                      {/* Status Indicator with Animation */}
                      <div
                        className={`absolute -top-3 -right-3 w-8 h-8 rounded-full ${statusDisplay.bg} ${statusDisplay.border} border-2 flex items-center justify-center backdrop-blur-sm ${
                          statusDisplay.pulse ? "animate-pulse" : ""
                        }`}
                      >
                        <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
                      </div>

                      {/* Priority Indicator */}
                      <div className="absolute top-3 left-3">
                        <div
                          className={`w-3 h-3 rounded-full shadow-lg ${
                            step.priority === "high"
                              ? "bg-red-400 shadow-red-400/50"
                              : step.priority === "medium"
                                ? "bg-yellow-400 shadow-yellow-400/50"
                                : "bg-green-400 shadow-green-400/50"
                          }`}
                        />
                      </div>

                      <div className="relative p-4 h-full flex flex-col items-center justify-center text-center">
                        {/* Enhanced Icon */}
                        <div className="mb-3 relative">
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
                          <StepIcon className={`relative w-10 h-10 ${colors.icon} drop-shadow-lg`} />
                        </div>

                        {/* Title */}
                        <h4 className={`font-bold text-sm ${colors.text} mb-2 line-clamp-2 drop-shadow-sm`}>
                          {step.title}
                        </h4>

                        {/* Duration and Status */}
                        <div className="flex items-center gap-2 text-xs">
                          <div className={`${colors.text} opacity-90 bg-black/20 px-2 py-1 rounded-full`}>
                            {step.estimatedDuration}m
                          </div>
                          {step.status === "in_progress" && (
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-yellow-300 animate-pulse" />
                              <span className="text-yellow-300 text-xs">กำลังทำ</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar for In-Progress Steps */}
                        {step.status === "in_progress" && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse"
                              style={{ width: "60%" }}
                            />
                          </div>
                        )}

                        {/* Completion Animation */}
                        {step.status === "completed" && (
                          <div className="absolute inset-0 bg-green-400/10 rounded-lg animate-pulse" />
                        )}
                      </div>
                    </Card>

                    {/* Enhanced Hover Details */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none">
                      <div className="bg-gray-900/95 backdrop-blur-xl text-white text-xs p-4 rounded-xl shadow-2xl max-w-64 border border-gray-700/50">
                        <div className="font-bold mb-2 text-blue-300">{step.title}</div>
                        <div className="text-gray-300 mb-3">{step.description}</div>

                        {step.status === "completed" && step.endTime && (
                          <div className="text-green-400 flex items-center gap-1 mb-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>เสร็จ: {new Date(step.endTime).toLocaleTimeString("th-TH")}</span>
                          </div>
                        )}

                        {step.status === "failed" && step.error && (
                          <div className="text-red-400 flex items-center gap-1 mb-1">
                            <X className="w-3 h-3" />
                            <span>ข้อผิดพลาด: {step.error}</span>
                          </div>
                        )}

                        {step.dependencies.length > 0 && (
                          <div className="text-gray-400 text-xs mt-2 pt-2 border-t border-gray-700">
                            <span>รอขั้นตอน: {step.dependencies.length} งาน</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Summary Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-5 h-5" />
              <span className="font-mono text-sm">ID: {workflow.id.substring(0, 8)}...</span>
            </div>

            {workflow.completedAt && workflow.startedAt && (
              <div className="flex items-center gap-2 text-gray-300">
                <TrendingUp className="w-5 h-5" />
                <span>
                  ใช้เวลา:{" "}
                  {Math.round(
                    (new Date(workflow.completedAt).getTime() - new Date(workflow.startedAt).getTime()) / 1000,
                  )}
                  s
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            {workflow.status === "completed" && (
              <div className="text-green-400 font-bold text-lg flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                เสร็จสิ้นครบทุกขั้นตอน
              </div>
            )}

            {workflow.status === "failed" && (
              <div className="text-red-400 font-bold text-lg flex items-center gap-2">
                <X className="w-6 h-6" />
                เกิดข้อผิดพลาดในการดำเนินการ
              </div>
            )}

            {workflow.status === "executing" && (
              <div className="text-blue-400 font-bold text-lg flex items-center gap-2">
                <Play className="w-6 h-6 animate-pulse" />
                กำลังดำเนินการ...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
