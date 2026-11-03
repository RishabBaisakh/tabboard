import { isTaskCompleted, type Task } from "../../services/tasks"
import { addCalendarDays, getLocalDate } from "./plannerCalendar"
import {
  formatTaskTime,
  getScheduledTasks,
  STATUS_TONES,
  type PlannerTone
} from "./plannerTasks"

export const MINUTES_PER_DAY = 24 * 60

// Blocks shorter than this are stretched for readability. Column assignment
// uses the stretched extent, so near-adjacent short tasks never overlap visually.
const MIN_LAYOUT_MINUTES = 24

// Tasks without a usable end time are laid out as a half-hour block.
const OPEN_ENDED_LAYOUT_MINUTES = 30

export type PlannerDayGridEvent = {
  id: string
  title: string
  timeRange: string
  tone: PlannerTone
  done: boolean
  // Layout geometry in minutes from the visible day's midnight.
  startMinutes: number
  endMinutes: number
  column: number
  columnCount: number
}

function wallClockMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

/**
 * Projects scheduled tasks onto a midnight-to-midnight grid for one local day.
 * Tasks crossing either midnight are clamped to the visible day, and
 * transitively overlapping tasks share the width through column assignment.
 */
export function getDayGridEvents(
  tasks: Task[],
  day: Date
): PlannerDayGridEvent[] {
  const dayStart = getLocalDate(day)
  const dayEnd = addCalendarDays(dayStart, 1)
  const events: PlannerDayGridEvent[] = []

  for (const { task, schedule } of getScheduledTasks(tasks)) {
    const start = schedule.start
    const hasEnd = schedule.end !== null && schedule.end > start
    const end = hasEnd
      ? (schedule.end as Date)
      : new Date(start.getTime() + OPEN_ENDED_LAYOUT_MINUTES * 60_000)
    if (end <= dayStart || start >= dayEnd) continue

    // Wall-clock minutes keep blocks aligned with the hour labels even on
    // days when a daylight saving shift changes the day's real duration.
    const startMinutes = start <= dayStart ? 0 : wallClockMinutes(start)
    const clampedEnd = end >= dayEnd ? MINUTES_PER_DAY : wallClockMinutes(end)
    const endMinutes = Math.min(
      MINUTES_PER_DAY,
      Math.max(clampedEnd, startMinutes + MIN_LAYOUT_MINUTES)
    )

    events.push({
      id: task.id,
      title: task.title,
      timeRange:
        hasEnd && schedule.end
          ? `${formatTaskTime(start)} – ${formatTaskTime(schedule.end)}`
          : formatTaskTime(start),
      tone: STATUS_TONES[task.status],
      done: isTaskCompleted(task),
      startMinutes,
      endMinutes,
      column: 0,
      columnCount: 1
    })
  }

  assignColumns(events)
  return events
}

/**
 * Google Calendar-style column layout. Transitively overlapping events form a
 * group; each event takes the first column that is free at its start time and
 * every event in the group divides the width by the columns the group needed.
 * Once a group ends, the next event starts a fresh group at full width.
 */
function assignColumns(events: PlannerDayGridEvent[]) {
  // `events` is ordered by start time (getScheduledTasks sorts schedules).
  let group: PlannerDayGridEvent[] = []
  let columnEnds: number[] = []
  let groupEnd = 0

  const finalizeGroup = () => {
    for (const event of group) event.columnCount = columnEnds.length
    group = []
    columnEnds = []
    groupEnd = 0
  }

  for (const event of events) {
    if (group.length > 0 && event.startMinutes >= groupEnd) finalizeGroup()

    let column = columnEnds.findIndex((end) => end <= event.startMinutes)
    if (column === -1) {
      column = columnEnds.length
      columnEnds.push(event.endMinutes)
    } else {
      columnEnds[column] = event.endMinutes
    }

    event.column = column
    group.push(event)
    groupEnd = Math.max(groupEnd, event.endMinutes)
  }

  if (group.length > 0) finalizeGroup()
}

/**
 * Compact GMT offset badge (e.g. "GMT-4", "GMT+5:30") derived from the user's
 * IANA time zone for the given instant, so daylight saving changes are
 * reflected automatically.
 */
export function getTimeZoneOffsetLabel(
  date = new Date(),
  timeZone?: string
): string {
  try {
    const label = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset"
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value
    if (label) return label === "GMT" ? "GMT+0" : label
  } catch {
    // Older engines without shortOffset fall through to the runtime offset.
  }

  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes < 0 ? "-" : "+"
  const absolute = Math.abs(offsetMinutes)
  const hours = Math.floor(absolute / 60)
  const minutes = absolute % 60
  return `GMT${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`
}

// "12 AM", "1 AM", ... "11 PM" in the user's locale hour style.
export function getHourLabels(): string[] {
  return Array.from({ length: 24 }, (_, hour) =>
    new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, {
      hour: "numeric"
    })
  )
}
