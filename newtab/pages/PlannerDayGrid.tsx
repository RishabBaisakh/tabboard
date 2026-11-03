import React from "react"

import type { Task } from "../../services/tasks"
import { toLocalDateValue } from "./plannerCalendar"
import {
  getDayGridEvents,
  getHourLabels,
  MINUTES_PER_DAY,
  type PlannerDayGridEvent
} from "./plannerDayGrid"

const HOUR_LABELS = getHourLabels()

// Where non-today days scroll to by default: the start of the working morning.
const DEFAULT_SCROLL_MINUTES = 8 * 60

function toPercent(minutes: number) {
  return `${(minutes / MINUTES_PER_DAY) * 100}%`
}

function eventStyle(event: PlannerDayGridEvent): React.CSSProperties {
  const width = 100 / event.columnCount
  return {
    top: toPercent(event.startMinutes),
    height: `calc(${toPercent(event.endMinutes - event.startMinutes)} - 2px)`,
    left: `${width * event.column}%`,
    width: `calc(${width}% - 4px)`
  }
}

type PlannerDayGridProps = {
  tasks: Task[]
  day: Date
  now: Date
  isRefreshing?: boolean
}

export function PlannerDayGrid({
  tasks,
  day,
  now,
  isRefreshing = false
}: PlannerDayGridProps) {
  const events = getDayGridEvents(tasks, day)
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const dayKey = toLocalDateValue(day)
  const isToday = dayKey === toLocalDateValue(now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const anchorMinutes = isToday ? nowMinutes : DEFAULT_SCROLL_MINUTES

  React.useEffect(() => {
    // The grid is full height and the page scrolls, so scrollIntoView centers
    // the anchor in whichever ancestor actually scrolls.
    anchorRef.current?.scrollIntoView({ block: "center" })
    // Re-center only when the visible day changes, not on every minute tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey])

  return (
    <div
      className={`planner-day-grid${isRefreshing ? " is-refreshing" : ""}`}
      role="group"
      aria-label="Day timeline from midnight to midnight">
      <div className="planner-day-grid-canvas">
        <div className="planner-day-hours" aria-hidden="true">
          {HOUR_LABELS.map((label, hour) => (
            <span
              key={label}
              className={`planner-day-hour-label${hour === 0 ? " is-midnight" : ""}`}
              style={{ top: toPercent(hour * 60) }}>
              {label}
            </span>
          ))}
        </div>
        <div className="planner-day-grid-body">
          <ol className="planner-day-events" aria-label="Scheduled tasks">
            {events.map((event) => (
              <li
                key={event.id}
                className={`planner-day-event tone-${event.tone}${event.done ? " is-done" : ""}`}
                style={eventStyle(event)}
                title={`${event.title}, ${event.timeRange}`}>
                <h3>{event.title}</h3>
                <span>{event.timeRange}</span>
              </li>
            ))}
          </ol>
          {isToday && (
            <div
              className="planner-day-now"
              style={{ top: toPercent(nowMinutes) }}
              aria-hidden="true"
            />
          )}
          <div
            ref={anchorRef}
            className="planner-day-scroll-anchor"
            style={{ top: toPercent(anchorMinutes) }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}
