import type { Task, TaskListParams } from "../../services/tasks"
import { getLocalDate, toLocalDateValue } from "./plannerCalendar"

export function getDayRange(date: Date): Required<TaskListParams> {
  const day = getLocalDate(date)
  return { startDate: day, endDate: day }
}

// Stable string for effect dependencies.
export function rangeKey({ startDate, endDate }: Required<TaskListParams>) {
  return `${toLocalDateValue(startDate)}..${toLocalDateValue(endDate)}`
}

// Request-id guard: only the most recently started request may apply its result.
export function createLatestGuard() {
  let latest = 0
  return {
    begin() {
      const mine = ++latest
      return () => mine === latest
    },
    cancel() {
      latest++
    }
  }
}

export type RangeState = {
  key: string
  tasks: Task[]
  status: "loading" | "succeeded" | "failed"
  error: string
}

export const INITIAL_RANGE_STATE: RangeState = {
  key: "",
  tasks: [],
  status: "loading",
  error: ""
}
