"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
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
  ArrowDown,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Copy,
  Download,
  Share2,
  Info,
  ChevronRight,
  ChevronDown,
  Activity,
  Timer,
  Code,
  Database,
  BarChart3,
} from "lucide-react"
import type { WorkflowPlan, WorkflowStep } from "../lib/workflow-planner"

interface ExpandablePowerAutomateFlowProps {
  workflow: WorkflowPlan
  onRefresh?: () => void
  initialExpanded?: boolean
}

// Enhanced step details interface
interface StepDetails {
  executionTime?: number
  retryCount?: number
  errorDetails?: string
  inputData?: any
  outputData?: any
  logs?: string[]
  resourceUsage?: {
    cpu: number
    memory: number
    network: number
  }
}

// Get icon for step type
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
        glow: "shadow-[#10a37f]/20",
      }
    case "in_progress":
      return {
        bg: "bg-[#0084ff]/10 border-[#0084ff]/30 animate-pulse",
        icon: "text-[#0084ff]",
        badge: "bg-[#0084ff]/20 text-[#0084ff] border-[#0084ff]/30",
        connector: "bg-[#0084ff]",
        glow: "shadow-[#0084ff]/20",
      }
    case "failed":
      return {
        bg: "bg-[#ff6b6b]/10 border-[#ff6b6b]/30",
        icon: "text-[#ff6b6b]",
        badge: "bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30",
        connector: "bg-[#ff6b6b]",
        glow: "shadow-[#ff6b6b]/20",
      }
    case "pending":
      return {
        bg: "bg-[#2f2f2f] border-[#4f4f4f]",
        icon: "text-[#8e8ea0]",
        badge: "bg-[#3f3f3f] text-[#b4b4b4] border-[#4f4f4f]",
        connector: "bg-[#4f4f4f]",
        glow: "shadow-none",
      }
    default:
      return {
        bg: "bg-[#2f2f2f] border-[#4f4f4f]",
        icon: "text-[#8e8ea0]",
        badge: "bg-[#3f3f3f] text-[#b4b4b4] border-[#4f4f4f]",
        connector: "bg-[#4f4f4f]",
        glow: "shadow-none",
      }
  }
}

// Get status icon
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

// Enhanced step card with expandable details
function ExpandableStepCard({
  step,
  index,
  isLast,
  isExpanded,
  showDetails,
  onToggleDetails,
}: {
  step: WorkflowStep
  index: number
  isLast: boolean
  isExpanded: boolean
  showDetails: boolean
  onToggleDetails: (stepId: string) => void
}) {
  const StepIcon = getStepIcon(step.type)
  const StatusIcon = getStatusIcon(step.status)
  const colors = getStatusColors(step.status)

  // Mock detailed data
  const stepDetails: StepDetails = {
    executionTime: step.status === "completed" ? Math.floor(Math.random() * 5000) + 1000 : undefined,
    retryCount: step.status === "failed" ? Math.floor(Math.random() * 3) : 0,
    errorDetails: step.error,
    inputData: step.parameters,
    outputData: step.result,
    logs: [
      `[${new Date().toISOString()}] Starting ${step.title}`,
      `[${new Date().toISOString()}] Processing parameters...`,
      step.status === "completed"
        ? `[${new Date().toISOString()}] Completed successfully`
        : step.status === "failed"
          ? `[${new Date().toISOString()}] Error: ${step.error}`
          : `[${new Date().toISOString()}] In progress...`,
    ],
    resourceUsage: {
      cpu: Math.floor(Math.random() * 80) + 10,
      memory: Math.floor(Math.random() * 60) + 20,
      network: Math.floor(Math.random() * 40) + 5,
    },
  }

  return (
    <div className="relative">
      {/* Enhanced Step Card */}
      <Card
        className={`w-full transition-all duration-300 hover:shadow-lg ${colors.bg} border-2 ${colors.glow} ${
          isExpanded ? "shadow-xl" : "hover:shadow-black/50"
        }`}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-2 rounded-lg bg-[#1a1a1a] shadow-sm`}>
                <StepIcon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[#ececec] text-sm truncate">{step.title}</h4>
                <p className="text-xs text-[#b4b4b4] mt-1 line-clamp-2">{step.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusIcon className={`w-4 h-4 ${colors.icon}`} />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-[#8e8ea0] hover:text-[#ececec]"
                onClick={() => onToggleDetails(step.id)}
              >
                {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Status and Duration */}
          <div className="flex items-center justify-between mb-3">
            <Badge className={`text-xs ${colors.badge} border`}>
              {step.status === "in_progress" && "กำลังทำงาน"}
              {step.status === "completed" && "เสร็จสิ้น"}
              {step.status === "failed" && "ล้มเหลว"}
              {step.status === "pending" && "รอดำเนินการ"}
            </Badge>
            <div className="flex items-center gap-2 text-xs text-[#8e8ea0]">
              <Timer className="w-3 h-3" />
              <span>{step.estimatedDuration} นาที</span>
              {stepDetails.executionTime && (
                <span className="text-[#10a37f]">({(stepDetails.executionTime / 1000).toFixed(1)}s)</span>
              )}
            </div>
          </div>

          {/* Progress Bar for In-Progress */}
          {step.status === "in_progress" && (
            <div className="mb-3">
              <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                <div className="bg-[#0084ff] h-1.5 rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {isExpanded && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[#1a1a1a] rounded p-2 text-center">
                <div className="text-xs text-[#8e8ea0]">CPU</div>
                <div className="text-sm font-medium text-[#ececec]">{stepDetails.resourceUsage?.cpu}%</div>
              </div>
              <div className="bg-[#1a1a1a] rounded p-2 text-center">
                <div className="text-xs text-[#8e8ea0]">Memory</div>
                <div className="text-sm font-medium text-[#ececec]">{stepDetails.resourceUsage?.memory}%</div>
              </div>
              <div className="bg-[#1a1a1a] rounded p-2 text-center">
                <div className="text-xs text-[#8e8ea0]">Retries</div>
                <div className="text-sm font-medium text-[#ececec]">{stepDetails.retryCount}</div>
              </div>
            </div>
          )}

          {/* Expandable Details */}
          <Collapsible open={showDetails}>
            <CollapsibleContent className="space-y-3">
              {/* Execution Details */}
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3f3f3f]">
                <h5 className="text-sm font-medium text-[#ececec] mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  รายละเอียดการทำงาน
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8e8ea0]">เริ่มต้น:</span>
                    <span className="text-[#ececec]">
                      {step.startTime ? new Date(step.startTime).toLocaleTimeString("th-TH") : "ยังไม่เริ่ม"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8e8ea0]">สิ้นสุด:</span>
                    <span className="text-[#ececec]">
                      {step.endTime ? new Date(step.endTime).toLocaleTimeString("th-TH") : "ยังไม่เสร็จ"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8e8ea0]">ระยะเวลา:</span>
                    <span className="text-[#ececec]">
                      {stepDetails.executionTime ? `${(stepDetails.executionTime / 1000).toFixed(2)}s` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input/Output Data */}
              {(stepDetails.inputData || stepDetails.outputData) && (
                <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3f3f3f]">
                  <h5 className="text-sm font-medium text-[#ececec] mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    ข้อมูล Input/Output
                  </h5>
                  <Tabs defaultValue="input" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#2f2f2f]">
                      <TabsTrigger value="input" className="text-xs">
                        Input
                      </TabsTrigger>
                      <TabsTrigger value="output" className="text-xs">
                        Output
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="input" className="mt-2">
                      <pre className="text-xs text-[#b4b4b4] bg-[#0f0f0f] p-2 rounded overflow-x-auto">
                        {JSON.stringify(stepDetails.inputData, null, 2)}
                      </pre>
                    </TabsContent>
                    <TabsContent value="output" className="mt-2">
                      <pre className="text-xs text-[#b4b4b4] bg-[#0f0f0f] p-2 rounded overflow-x-auto">
                        {stepDetails.outputData ? JSON.stringify(stepDetails.outputData, null, 2) : "ยังไม่มี output"}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Logs */}
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3f3f3f]">
                <h5 className="text-sm font-medium text-[#ececec] mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Execution Logs
                </h5>
                <div className="bg-[#0f0f0f] rounded p-2 max-h-32 overflow-y-auto">
                  {stepDetails.logs?.map((log, i) => (
                    <div key={i} className="text-xs text-[#b4b4b4] font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Usage */}
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3f3f3f]">
                <h5 className="text-sm font-medium text-[#ececec] mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  การใช้ทรัพยากร
                </h5>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#8e8ea0]">CPU Usage</span>
                      <span className="text-[#ececec]">{stepDetails.resourceUsage?.cpu}%</span>
                    </div>
                    <Progress value={stepDetails.resourceUsage?.cpu} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#8e8ea0]">Memory Usage</span>
                      <span className="text-[#ececec]">{stepDetails.resourceUsage?.memory}%</span>
                    </div>
                    <Progress value={stepDetails.resourceUsage?.memory} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#8e8ea0]">Network I/O</span>
                      <span className="text-[#ececec]">{stepDetails.resourceUsage?.network}%</span>
                    </div>
                    <Progress value={stepDetails.resourceUsage?.network} className="h-1" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[#4f4f4f] bg-[#1a1a1a] text-[#ececec] hover:bg-[#3f3f3f]"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy ID
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[#4f4f4f] bg-[#1a1a1a] text-[#ececec] hover:bg-[#3f3f3f]"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

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

      {/* Connector Arrow */}
      {!isLast && (
        <div className="flex justify-center my-2">
          <div className={`w-0.5 h-6 ${colors.connector}`}></div>
          <ArrowDown className={`w-4 h-12 ${colors.icon} -mt-1 absolute`} />
        </div>
      )}
    </div>
  )
}

export default function ExpandablePowerAutomateFlow({
  workflow,
  onRefresh,
  initialExpanded = false,
}: ExpandablePowerAutomateFlowProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("flow")

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

  const toggleStepDetails = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const toggleAllSteps = () => {
    if (expandedSteps.size === 0) {
      setExpandedSteps(new Set(workflow?.steps?.map((s) => s.id) || []))
    } else {
      setExpandedSteps(new Set())
    }
  }

  const copyWorkflowId = () => {
    if (workflow?.id) {
      navigator.clipboard.writeText(workflow.id)
    }
  }

  const exportWorkflow = () => {
    if (workflow) {
      const dataStr = JSON.stringify(workflow, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `workflow-${workflow.id}.json`
      link.click()
    }
  }

  if (!workflow) {
    return (
      <div className="w-full p-6 bg-[#2f2f2f] rounded-lg border border-[#4f4f4f] shadow-sm">
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

  return (
    <div className={`w-full transition-all duration-300 ${isExpanded ? "max-w-6xl" : "max-w-2xl"} mx-auto space-y-6`}>
      {/* Enhanced Header */}
      <Card className="bg-[#2f2f2f] border border-[#4f4f4f] shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#10a37f]/20 rounded-lg">
                <Zap className="w-6 h-6 text-[#10a37f]" />
              </div>
              <div>
                <CardTitle className="text-xl text-[#ececec]">{workflow.title}</CardTitle>
                <p className="text-sm text-[#b4b4b4] mt-1">{workflow.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="outline"
                size="sm"
                className="border-[#4f4f4f] bg-[#1a1a1a] text-[#ececec] hover:bg-[#3f3f3f]"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                {isExpanded ? "ย่อ" : "ขยาย"}
              </Button>
              <Button
                onClick={toggleAllSteps}
                variant="outline"
                size="sm"
                className="border-[#4f4f4f] bg-[#1a1a1a] text-[#ececec] hover:bg-[#3f3f3f]"
              >
                {expandedSteps.size > 0 ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {expandedSteps.size > 0 ? "ซ่อนทั้งหมด" : "แสดงทั้งหมด"}
              </Button>
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
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Enhanced Progress Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
              <div className="text-2xl font-bold text-[#10a37f]">{completedSteps}</div>
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
            <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
              <div className="text-2xl font-bold text-[#0084ff]">
                {Math.round((completedSteps / (totalSteps || 1)) * 100)}
              </div>
              <div className="text-sm text-[#8e8ea0]">%</div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm text-[#8e8ea0] mb-2">
              <span>ความคืบหน้าโดยรวม</span>
              <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString("th-TH")}</span>
            </div>
            <Progress value={(completedSteps / (totalSteps || 1)) * 100} className="h-3" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={copyWorkflowId}
              variant="outline"
              size="sm"
              className="border-[#4f4f4f] bg-[#1a1a1a] text-[#ececec] hover:bg-[#3f3f3f]"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy ID
            </Button>
            <Button
              onClick={exportWorkflow}
              variant="outline"
              size="sm"
              className="border-[#4f4f4f] bg-[#1a1a1a] text-[#ececec] hover:bg-[#3f3f3f]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#4f4f4f] bg-[#1a1a1a] text-[#ececec] hover:bg-[#3f3f3f]"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabs */}
      {isExpanded && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#2f2f2f] border border-[#4f4f4f]">
            <TabsTrigger value="flow" className="data-[state=active]:bg-[#10a37f]">
              <Zap className="w-4 h-4 mr-2" />
              Flow Steps
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#10a37f]">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-[#10a37f]">
              <Code className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="space-y-0 mt-6">
            {/* Flow Steps */}
            {safeSteps.map((step, index) => (
              <ExpandableStepCard
                key={step.id}
                step={step}
                index={index}
                isLast={index === safeSteps.length - 1}
                isExpanded={isExpanded}
                showDetails={expandedSteps.has(step.id)}
                onToggleDetails={toggleStepDetails}
              />
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="bg-[#2f2f2f] border border-[#4f4f4f]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#ececec] mb-4">Workflow Analytics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[#ececec] mb-2">Execution Time</h4>
                    <div className="text-2xl font-bold text-[#10a37f]">
                      {workflow.completedAt && workflow.startedAt
                        ? `${Math.round((new Date(workflow.completedAt).getTime() - new Date(workflow.startedAt).getTime()) / 1000)}s`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[#ececec] mb-2">Success Rate</h4>
                    <div className="text-2xl font-bold text-[#10a37f]">
                      {totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <Card className="bg-[#2f2f2f] border border-[#4f4f4f]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#ececec] mb-4">Workflow Logs</h3>
                <div className="bg-[#0f0f0f] rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-1 font-mono text-xs text-[#b4b4b4]">
                    <div>
                      [{new Date().toISOString()}] Workflow started: {workflow.title}
                    </div>
                    {safeSteps.map((step, index) => (
                      <div key={step.id}>
                        <div>
                          [{step.startTime || new Date().toISOString()}] Step {index + 1}: {step.title} - {step.status}
                        </div>
                        {step.error && <div className="text-[#ff6b6b]">[ERROR] {step.error}</div>}
                      </div>
                    ))}
                    <div>
                      [{new Date().toISOString()}] Workflow status: {workflow.status}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Compact Flow View */}
      {!isExpanded && (
        <div className="space-y-0">
          {safeSteps.map((step, index) => (
            <ExpandableStepCard
              key={step.id}
              step={step}
              index={index}
              isLast={index === safeSteps.length - 1}
              isExpanded={false}
              showDetails={expandedSteps.has(step.id)}
              onToggleDetails={toggleStepDetails}
            />
          ))}
        </div>
      )}

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
 