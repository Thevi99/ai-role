"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Activity,
  Timer,
  Target,
  TrendingUp,
  BarChart3,
  PieChart,
  Database,
  Server,
  Workflow,
  GitBranch,
  Shield,
  AlertCircle,
  Download,
  Share2,
  Cpu,
} from "lucide-react"
import type { WorkflowPlan, WorkflowStep } from "../lib/workflow-planner"

interface EnterpriseWorkflowDashboardProps {
  workflow: WorkflowPlan
  onRefresh?: () => void
  realTimeUpdates?: boolean
}

// Enterprise-grade metrics
interface WorkflowMetrics {
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  errorRate: number
  throughput: number
  resourceUtilization: number
  costPerExecution: number
  slaCompliance: number
}

// Real-time system status
interface SystemStatus {
  powerAutomateHealth: "healthy" | "warning" | "critical"
  apiLatency: number
  queueDepth: number
  activeConnections: number
  systemLoad: number
  memoryUsage: number
  diskUsage: number
  networkThroughput: number
}

// Enhanced step with enterprise features
interface EnterpriseStep extends WorkflowStep {
  executionId?: string
  nodeId?: string
  resourceUsage?: {
    cpu: number
    memory: number
    network: number
  }
  slaTarget?: number
  actualDuration?: number
  retryCount?: number
  lastError?: {
    code: string
    message: string
    timestamp: string
    stackTrace?: string
  }
  approvals?: {
    required: boolean
    approvers: string[]
    status: "pending" | "approved" | "rejected"
  }
  compliance?: {
    dataClassification: "public" | "internal" | "confidential" | "restricted"
    auditRequired: boolean
    complianceScore: number
  }
}

// Mock enterprise data
const mockMetrics: WorkflowMetrics = {
  totalExecutions: 15847,
  successRate: 98.7,
  averageExecutionTime: 2.3,
  errorRate: 1.3,
  throughput: 450,
  resourceUtilization: 67,
  costPerExecution: 0.15,
  slaCompliance: 99.2,
}

const mockSystemStatus: SystemStatus = {
  powerAutomateHealth: "healthy",
  apiLatency: 45,
  queueDepth: 12,
  activeConnections: 234,
  systemLoad: 34,
  memoryUsage: 67,
  diskUsage: 45,
  networkThroughput: 1250,
}

// Enhanced color schemes for enterprise
function getEnterpriseStepColors(type: string, status: string) {
  const baseColors = {
    meeting: {
      primary: "from-blue-600 to-blue-700",
      secondary: "from-blue-500/20 to-blue-600/20",
      border: "border-blue-500/30",
      text: "text-blue-50",
      accent: "text-blue-400",
    },
    email: {
      primary: "from-emerald-600 to-emerald-700",
      secondary: "from-emerald-500/20 to-emerald-600/20",
      border: "border-emerald-500/30",
      text: "text-emerald-50",
      accent: "text-emerald-400",
    },
    post: {
      primary: "from-purple-600 to-purple-700",
      secondary: "from-purple-500/20 to-purple-600/20",
      border: "border-purple-500/30",
      text: "text-purple-50",
      accent: "text-purple-400",
    },
    reminder: {
      primary: "from-orange-600 to-orange-700",
      secondary: "from-orange-500/20 to-orange-600/20",
      border: "border-orange-500/30",
      text: "text-orange-50",
      accent: "text-orange-400",
    },
    task: {
      primary: "from-teal-600 to-teal-700",
      secondary: "from-teal-500/20 to-teal-600/20",
      border: "border-teal-500/30",
      text: "text-teal-50",
      accent: "text-teal-400",
    },
  }

  const statusOverrides = {
    failed: {
      primary: "from-red-600 to-red-700",
      border: "border-red-500/50",
      accent: "text-red-400",
    },
    completed: {
      border: "border-green-500/50",
      accent: "text-green-400",
    },
    in_progress: {
      border: "border-yellow-500/50",
      accent: "text-yellow-400",
    },
  }

  const base = baseColors[type as keyof typeof baseColors] || baseColors.task
  const override = statusOverrides[status as keyof typeof statusOverrides] || {}

  return { ...base, ...override }
}

// Enterprise metrics card component
function MetricsCard({ title, value, unit, trend, icon: Icon, color }: any) {
  return (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
              <span className="text-sm text-gray-400">{unit}</span>
            </div>
            {trend && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
                <TrendingUp className="w-3 h-3" />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${color.replace("text-", "from-")}/20`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// System health indicator
function SystemHealthIndicator({ status }: { status: SystemStatus }) {
  const healthColor = {
    healthy: "text-green-400",
    warning: "text-yellow-400",
    critical: "text-red-400",
  }[status.powerAutomateHealth]

  const healthIcon = {
    healthy: CheckCircle,
    warning: AlertTriangle,
    critical: AlertCircle,
  }[status.powerAutomateHealth]

  const HealthIcon = healthIcon

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="w-5 h-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Power Automate</span>
          <div className={`flex items-center gap-2 ${healthColor}`}>
            <HealthIcon className="w-4 h-4" />
            <span className="capitalize">{status.powerAutomateHealth}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">API Latency</span>
              <span className="text-white">{status.apiLatency}ms</span>
            </div>
            <Progress value={Math.min((status.apiLatency / 100) * 100, 100)} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">System Load</span>
              <span className="text-white">{status.systemLoad}%</span>
            </div>
            <Progress value={status.systemLoad} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Memory Usage</span>
              <span className="text-white">{status.memoryUsage}%</span>
            </div>
            <Progress value={status.memoryUsage} className="h-2" />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Queue Depth</span>
              <div className="text-white font-medium">{status.queueDepth}</div>
            </div>
            <div>
              <span className="text-gray-400">Active Connections</span>
              <div className="text-white font-medium">{status.activeConnections}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced workflow step card for enterprise
function EnterpriseStepCard({ step, index }: { step: EnterpriseStep; index: number }) {
  const colors = getEnterpriseStepColors(step.type, step.status)
  const StepIcon =
    {
      meeting: Calendar,
      email: Mail,
      post: MessageSquare,
      reminder: Bell,
      task: CheckCircle,
    }[step.type] || Settings

  const StatusIcon =
    {
      completed: CheckCircle,
      in_progress: Play,
      failed: X,
      pending: Clock,
    }[step.status] || AlertTriangle

  const slaStatus =
    step.slaTarget && step.actualDuration ? (step.actualDuration <= step.slaTarget ? "met" : "missed") : "unknown"

  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br ${colors.primary} ${colors.border} border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl group`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
      </div>

      {/* Status Indicator */}
      <div
        className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-900 ${colors.border} border-2 flex items-center justify-center`}
      >
        <StatusIcon className={`w-4 h-4 ${colors.accent}`} />
      </div>

      {/* Priority & SLA Indicators */}
      <div className="absolute top-3 left-3 flex gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            step.priority === "high" ? "bg-red-400" : step.priority === "medium" ? "bg-yellow-400" : "bg-green-400"
          }`}
        />
        {slaStatus !== "unknown" && (
          <div className={`w-3 h-3 rounded-full ${slaStatus === "met" ? "bg-green-400" : "bg-red-400"}`} />
        )}
      </div>

      <CardContent className="relative p-6">
        {/* Step Number */}
        <div className="absolute top-2 right-2 text-xs font-mono text-white/60">#{index + 1}</div>

        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <StepIcon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-sm ${colors.text} mb-1`}>{step.title}</h4>
            <p className={`text-xs ${colors.text} opacity-80`}>{step.description}</p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="bg-black/20 rounded px-2 py-1 text-center">
            <div className={`${colors.text} opacity-90`}>{step.estimatedDuration}m</div>
            <div className={`${colors.text} opacity-60`}>Est.</div>
          </div>
          {step.actualDuration && (
            <div className="bg-black/20 rounded px-2 py-1 text-center">
              <div className={`${colors.text} opacity-90`}>{step.actualDuration}m</div>
              <div className={`${colors.text} opacity-60`}>Actual</div>
            </div>
          )}
          {step.retryCount !== undefined && (
            <div className="bg-black/20 rounded px-2 py-1 text-center">
              <div className={`${colors.text} opacity-90`}>{step.retryCount}</div>
              <div className={`${colors.text} opacity-60`}>Retries</div>
            </div>
          )}
        </div>

        {/* Resource Usage */}
        {step.resourceUsage && (
          <div className="mb-4">
            <div className="text-xs text-white/80 mb-2">Resource Usage</div>
            <div className="grid grid-cols-3 gap-1">
              <div className="text-center">
                <div className="text-xs text-white/60">CPU</div>
                <div className="text-xs font-medium text-white">{step.resourceUsage.cpu}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-white/60">MEM</div>
                <div className="text-xs font-medium text-white">{step.resourceUsage.memory}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-white/60">NET</div>
                <div className="text-xs font-medium text-white">{step.resourceUsage.network}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step.status === "in_progress" && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-xs text-yellow-300">Processing</span>
              </div>
            )}
            {step.status === "completed" && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-300">Complete</span>
              </div>
            )}
            {step.status === "failed" && (
              <div className="flex items-center gap-1">
                <X className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-300">Failed</span>
              </div>
            )}
          </div>

          {/* Compliance Score */}
          {step.compliance && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300">{step.compliance.complianceScore}%</span>
            </div>
          )}
        </div>

        {/* Progress Bar for In-Progress */}
        {step.status === "in_progress" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse"
              style={{ width: "65%" }}
            />
          </div>
        )}

        {/* Error Indicator */}
        {step.status === "failed" && step.lastError && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500/50" />
        )}
      </CardContent>
    </Card>
  )
}

export default function EnterpriseWorkflowDashboard({
  workflow,
  onRefresh,
  realTimeUpdates = true,
}: EnterpriseWorkflowDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [metrics] = useState(mockMetrics)
  const [systemStatus] = useState(mockSystemStatus)

  // Add default values for undefined properties
  const safeWorkflow = {
    ...workflow,
    status: workflow.status || "pending",
    title: workflow.title || "Untitled Workflow",
    steps: workflow.steps || [],
    progress: workflow.progress || { percentage: 0, currentStep: 0 },
    totalEstimatedDuration: workflow.totalEstimatedDuration || 0,
  }

  const safeSteps = safeWorkflow.steps || []
  const completedSteps = safeSteps.filter((s) => s && s.status === "completed").length
  const failedSteps = safeSteps.filter((s) => s && s.status === "failed").length
  const inProgressSteps = safeSteps.filter((s) => s && s.status === "in_progress").length

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return

    const interval = setInterval(() => {
      setLastUpdate(new Date())
      if (onRefresh && safeWorkflow.status === "executing") {
        onRefresh()
      }
    }, 2000) // Faster refresh for enterprise

    return () => clearInterval(interval)
  }, [realTimeUpdates, onRefresh])

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
      <div className="w-full max-w-7xl mx-auto p-6 bg-gray-900 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">⚠️ No workflow data available</div>
          <div className="text-sm">Workflow information is loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Enterprise Header */}
      <div className="relative p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-48 translate-x-48" />
        </div>

        <div className="relative">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Workflow className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{safeWorkflow.title}</h1>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="secondary"
                    className={`text-sm font-medium ${
                      safeWorkflow.status === "completed"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : safeWorkflow.status === "executing"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : safeWorkflow.status === "failed"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }`}
                  >
                    {(safeWorkflow.status || "pending").toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Activity className="w-4 h-4" />
                    <span>Enterprise Monitoring</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Controls */}
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
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Progress</p>
                  <p className="text-2xl font-bold text-white">{safeWorkflow.progress.percentage}%</p>
                </div>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{completedSteps}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-2xl font-bold text-white">{safeWorkflow.totalEstimatedDuration}m</p>
                </div>
                <Timer className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">SLA</p>
                  <p className="text-2xl font-bold text-green-400">{metrics.slaCompliance}%</p>
                </div>
                <Shield className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
              <span>Workflow Execution Progress</span>
              <span>Last updated: {lastUpdate.toLocaleTimeString("th-TH")}</span>
            </div>
            <div className="relative w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${safeWorkflow.progress.percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="workflow" className="data-[state=active]:bg-blue-600">
            <GitBranch className="w-4 h-4 mr-2" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-blue-600">
            <Activity className="w-4 h-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
            <PieChart className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metrics Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricsCard
                title="Total Executions"
                value={metrics.totalExecutions.toLocaleString()}
                unit=""
                trend={5.2}
                icon={Zap}
                color="text-blue-400"
              />
              <MetricsCard
                title="Success Rate"
                value={metrics.successRate}
                unit="%"
                trend={0.3}
                icon={CheckCircle}
                color="text-green-400"
              />
              <MetricsCard
                title="Avg Duration"
                value={metrics.averageExecutionTime}
                unit="min"
                trend={-2.1}
                icon={Timer}
                color="text-orange-400"
              />
              <MetricsCard
                title="Throughput"
                value={metrics.throughput}
                unit="/hr"
                trend={8.7}
                icon={TrendingUp}
                color="text-purple-400"
              />
            </div>

            {/* System Health */}
            <SystemHealthIndicator status={systemStatus} />
          </div>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {safeSteps.map((step, index) => (
              <EnterpriseStepCard key={step.id} step={step as EnterpriseStep} index={index} />
            ))}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Metrics */}
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">CPU Usage</span>
                      <span className="text-white">{systemStatus.systemLoad}%</span>
                    </div>
                    <Progress value={systemStatus.systemLoad} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Memory Usage</span>
                      <span className="text-white">{systemStatus.memoryUsage}%</span>
                    </div>
                    <Progress value={systemStatus.memoryUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Network Throughput</span>
                      <span className="text-white">{systemStatus.networkThroughput} MB/s</span>
                    </div>
                    <Progress value={(systemStatus.networkThroughput / 2000) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Tracking */}
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Error Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <X className="w-4 h-4 text-red-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Connection Timeout</div>
                        <div className="text-xs text-gray-400">Step: Email Notification</div>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Critical
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Rate Limit Warning</div>
                        <div className="text-xs text-gray-400">API: Microsoft Graph</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Warning
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricsCard
              title="Cost per Execution"
              value={`$${metrics.costPerExecution}`}
              unit=""
              trend={-5.2}
              icon={Database}
              color="text-green-400"
            />
            <MetricsCard
              title="Resource Utilization"
              value={metrics.resourceUtilization}
              unit="%"
              trend={2.1}
              icon={Cpu}
              color="text-blue-400"
            />
            <MetricsCard
              title="Error Rate"
              value={metrics.errorRate}
              unit="%"
              trend={-1.3}
              icon={AlertTriangle}
              color="text-red-400"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
