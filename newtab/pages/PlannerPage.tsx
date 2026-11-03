import { ArrowLeft, ArrowRight, Plus } from "lucide-react"
import React from "react"

import { tasksService } from "../../services/tasks"
import { calculateTaskSchedule } from "../../services/taskScheduling"
import { useAppDispatch } from "../../store/hooks"
import { taskCreated } from "../../store/tasksSlice"
import {
  addCalendarDays,
  formatPlannerDay,
  getLocalDate,
  toLocalDateValue
} from "./plannerCalendar"
import { PlannerDayGrid } from "./PlannerDayGrid"
import { getTimeZoneOffsetLabel } from "./plannerDayGrid"
import {
  createLatestGuard,
  getDayRange,
  INITIAL_RANGE_STATE,
  rangeKey,
  type RangeState
} from "./plannerRequests"
import { getDayTimelineItems } from "./plannerTasks"

import "../../styles/pages/planner.css"

// Fetches only the range of the active view. Results are tagged with the range
// key so tasks from another range are never shown as if they were current.
function useRangeTasks(
  range: ReturnType<typeof getDayRange>,
  reloadToken: number
) {
  const [state, setState] = React.useState<RangeState>(INITIAL_RANGE_STATE)
  const guardRef = React.useRef(createLatestGuard())
  const key = rangeKey(range)

  React.useEffect(() => {
    const isCurrent = guardRef.current.begin()
    setState((current) => ({ ...current, status: "loading", error: "" }))
    tasksService
      .list(range)
      .then((tasks) => {
        if (isCurrent())
          setState({ key, tasks, status: "succeeded", error: "" })
      })
      .catch((error: unknown) => {
        if (!isCurrent()) return
        setState({
          key,
          tasks: [],
          status: "failed",
          error:
            error instanceof Error ? error.message : "Unable to load tasks."
        })
      })
    return () => guardRef.current.cancel()
    // `range` is a fresh object each render; `key` captures its value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken])

  const isCurrentRange = state.key === key
  return {
    tasks: isCurrentRange ? state.tasks : [],
    error: isCurrentRange ? state.error : "",
    // First load of this range: show skeletons.
    isLoading:
      !isCurrentRange ||
      (state.status === "loading" && state.tasks.length === 0 && !state.error),
    // Same range reloading with data already on screen.
    isRefreshing:
      isCurrentRange && state.status === "loading" && state.tasks.length > 0
  }
}

function TaskSkeleton({ rows, label }: { rows: number; label: string }) {
  return (
    <div className="planner-skeleton" role="status" aria-live="polite">
      <span className="planner-sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div className="planner-skeleton-row" key={index} aria-hidden="true">
          <span className="planner-skeleton-time" />
          <span className="planner-skeleton-bar" />
          <span className="planner-skeleton-copy">
            <span />
            <span />
          </span>
        </div>
      ))}
    </div>
  )
}

function PlannerPage() {
  const dispatch = useAppDispatch()
  const [actionError, setActionError] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(() =>
    getLocalDate(new Date())
  )
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [newTaskTime, setNewTaskTime] = React.useState("16:00")
  const [reloadToken, setReloadToken] = React.useState(0)
  const [now, setNow] = React.useState(() => new Date())

  // Keeps the current-time indicator and GMT badge up to date (including
  // across daylight saving changes) while the day timeline is visible.
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const rangeState = useRangeTasks(getDayRange(selectedDate), reloadToken)
  const timelineItems = getDayTimelineItems(rangeState.tasks)
  const { isLoading, isRefreshing } = rangeState
  const tasksError = rangeState.error
  const reloadTasks = () => setReloadToken((token) => token + 1)
  const dayHeading = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  })

  function navigatePeriod(direction: -1 | 1) {
    setSelectedDate((currentDate) => addCalendarDays(currentDate, direction))
  }

  function goToToday() {
    setSelectedDate(getLocalDate(new Date()))
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title || isAdding) return

    setIsAdding(true)
    setActionError("")
    try {
      const schedule = calculateTaskSchedule(
        toLocalDateValue(selectedDate),
        newTaskTime,
        60
      )
      const created = await tasksService.create({
        title,
        description: "",
        status: "todo",
        priority: "medium",
        goal: null,
        ...schedule
      })
      dispatch(taskCreated(created))
      reloadTasks()
      setNewTaskTitle("")
      setNewTaskTime("16:00")
      setIsQuickAddOpen(false)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to add this task."
      )
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <section className="planner-page" aria-labelledby="planner-title">
      <header className="page-header planner-page-header">
        <div>
          <h1 id="planner-title">Planner</h1>
          <p className="page-subtitle">
            Organize your day and long-term goals.
          </p>
        </div>
        <button
          className="planner-quick-add"
          type="button"
          onClick={() => setIsQuickAddOpen(true)}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Create Tasks
        </button>
      </header>

      <nav className="planner-calendar-nav" aria-label="Calendar navigation">
        <div className="planner-date-navigation">
          <button
            className="planner-date-arrow"
            type="button"
            aria-label="Previous day"
            title="Previous day"
            onClick={() => navigatePeriod(-1)}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <time
            className="planner-date-label"
            dateTime={toLocalDateValue(selectedDate)}
            aria-live="polite">
            {formatPlannerDay(selectedDate)}
          </time>
          <button
            className="planner-date-arrow"
            type="button"
            aria-label="Next day"
            title="Next day"
            onClick={() => navigatePeriod(1)}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <button
          className="planner-today-button"
          type="button"
          onClick={goToToday}>
          Today
        </button>
      </nav>

      <div className="planner-content-grid planner-content-single">
        <section
          className="planner-section"
          aria-busy={isLoading || isRefreshing}
          aria-labelledby="planner-day-title">
          <header className="planner-section-header planner-day-header">
            <div>
              <p>Daily schedule</p>
              <h2 id="planner-day-title">{dayHeading}</h2>
            </div>
            <span
              className="planner-tz-badge"
              title="Your current time zone offset">
              {getTimeZoneOffsetLabel(now)}
            </span>
          </header>
          {isRefreshing && (
            <div className="planner-refresh-bar" aria-hidden="true" />
          )}
          {isLoading ? (
            <TaskSkeleton rows={4} label="Loading tasks..." />
          ) : tasksError ? (
            <div className="planner-state-message" role="alert">
              <p>{tasksError}</p>
              <button type="button" onClick={reloadTasks}>
                Try again
              </button>
            </div>
          ) : (
            <>
              {timelineItems.length === 0 && (
                <p className="planner-state-message">
                  No tasks scheduled for this day.
                </p>
              )}
              <PlannerDayGrid
                tasks={rangeState.tasks}
                day={selectedDate}
                now={now}
                isRefreshing={isRefreshing}
              />
            </>
          )}
          {actionError && (
            <p className="planner-state-message" role="alert">
              {actionError}
            </p>
          )}
        </section>
      </div>

      {isQuickAddOpen && (
        <div className="planner-dialog-backdrop">
          <section
            className="planner-quick-add-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="planner-quick-add-title">
            <h2 id="planner-quick-add-title">Add a task</h2>
            <form onSubmit={addTask}>
              <label>
                Task
                <input
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={(event) =>
                    setNewTaskTitle(event.currentTarget.value)
                  }
                  placeholder="What needs to get done?"
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(event) =>
                    setNewTaskTime(event.currentTarget.value)
                  }
                />
              </label>
              <div className="planner-quick-add-actions">
                <button type="button" onClick={() => setIsQuickAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isAdding}>
                  Add task
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default PlannerPage
