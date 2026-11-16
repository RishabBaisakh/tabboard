import { ApiError, type ApiClient } from "./api"
import { apiClient } from "./apiClient"
import type { Task, TaskPriority } from "./tasks"

export type PlanningWindow = {
  start: string
  end: string
}

export type DailyPlanDraft = {
  id: string
  date: string
  plan: {
    date: string
    summary: string
    scheduled_tasks: Array<{
      title: string
      description: string
      start_time: string
      end_time: string
      priority: TaskPriority
      goal_id: number | null
      task_id: string | null
    }>
  }
  status: "pending" | "approved"
  time_zone: string
  availability: PlanningWindow[]
  commitments: PlanningWindow[]
  created_at: string
  approved_at: string | null
}

export type GenerateDailyPlanInput = {
  planning_date: string
  commitments?: PlanningWindow[]
  planning_preferences?: Record<string, unknown>
  additional_instructions?: string
}

export type DailyPlanApproval = {
  draft: DailyPlanDraft
  tasks: Task[]
}

export function createDailyPlannerService(api: Pick<ApiClient, "request">) {
  return {
    async pending(): Promise<DailyPlanDraft | null> {
      try {
        return await api.request<DailyPlanDraft>(
          "/api/v1/ai/daily-plans/pending/",
          { authenticated: true }
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },

    generate(input: GenerateDailyPlanInput): Promise<DailyPlanDraft> {
      return api.request<DailyPlanDraft>("/api/v1/ai/daily-plans/generate/", {
        method: "POST",
        body: input,
        authenticated: true
      })
    },

    approve(id: string): Promise<DailyPlanApproval> {
      return api.request<DailyPlanApproval>(
        `/api/v1/ai/daily-plans/${encodeURIComponent(id)}/approve/`,
        { method: "POST", body: {}, authenticated: true }
      )
    }
  }
}

export const dailyPlannerService = createDailyPlannerService(apiClient)
