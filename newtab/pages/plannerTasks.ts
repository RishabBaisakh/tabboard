import {
  isTaskCompleted,
  type Task,
  type TaskStatus
} from "../../services/tasks"

export type PlannerTone = "blue" | "teal" | "amber" | "coral"

export type PlannerTimelineItem = {
  id: string
  time: string
  timeRange: string
  title: string
  detail: string
  tone: PlannerTone
  done: boolean
}

export const STATUS_TONES: Record<TaskStatus, PlannerTone> = {
  completed: "teal",
  cancelled: "coral",
  in_progress: "blue",
  todo: "amber"
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  in_progress: "In progress",
  todo: "To do"
}

function parseSchedule(task: Task) {
  const start = new Date(task.scheduled_start)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(task.scheduled_end)
  return { start, end: Number.isNaN(end.getTime()) ? null : end }
}

export function formatTaskTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  })
}

// The backend already filtered by date; this only drops unparseable schedules and sorts.
export function getScheduledTasks(tasks: Task[]) {
  return tasks
    .map((task) => ({ task, schedule: parseSchedule(task) }))
    .filter(
      (
        entry
      ): entry is {
        task: Task
        schedule: NonNullable<typeof entry.schedule>
      } => entry.schedule !== null
    )
    .sort(
      (a, b) =>
        a.schedule.start.getTime() - b.schedule.start.getTime() ||
        a.task.id.localeCompare(b.task.id)
    )
}

export function getDayTimelineItems(tasks: Task[]): PlannerTimelineItem[] {
  return getScheduledTasks(tasks).map(({ task, schedule }) => ({
    id: task.id,
    time: formatTaskTime(schedule.start),
    timeRange: schedule.end
      ? `${formatTaskTime(schedule.start)} – ${formatTaskTime(schedule.end)}`
      : formatTaskTime(schedule.start),
    title: task.title,
    detail: task.description || STATUS_LABELS[task.status],
    tone: STATUS_TONES[task.status],
    done: isTaskCompleted(task)
  }))
}
