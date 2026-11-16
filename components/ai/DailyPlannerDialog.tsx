import { Sparkles, X } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

import { ApiError } from "../../services/api"
import {
  dailyPlannerService,
  type DailyPlanDraft,
  type GenerateDailyPlanInput,
  type PlanningWindow
} from "../../services/dailyPlanner"
import { formatLocalDate, type Task } from "../../services/tasks"
import { useAppDispatch } from "../../store/hooks"
import { taskUpdated } from "../../store/tasksSlice"

type DailyPlannerDialogProps = {
  onClose: () => void
}

type PlannerError = {
  message: string
  details?: string
}

function describeError(
  error: unknown,
  action: "load" | "generate" | "approve"
): PlannerError {
  if (!(error instanceof ApiError)) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong."
    }
  }

  const messages: Record<number, string> = {
    401: "Your session has expired or authentication is required. Please sign in.",
    400: "The request or plan is invalid.",
    404:
      action === "approve"
        ? "This draft was not found or is not yours."
        : "The requested resource was not found.",
    409: "This draft is no longer pending.",
    502: "The AI provider could not generate a valid schedule.",
    503: "The planning service or storage is unavailable.",
    504: "Plan generation timed out."
  }
  const details =
    error.payload !== undefined
      ? typeof error.payload === "string"
        ? error.payload
        : JSON.stringify(error.payload, null, 2)
      : undefined
  return { message: messages[error.status] ?? error.message, details }
}

export function generationInput(
  planningDate: string,
  commitments: PlanningWindow[],
  preferences: string,
  instructions: string
): GenerateDailyPlanInput {
  if (!planningDate) throw new Error("Choose a planning date.")

  const timestamp =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i
  for (const window of commitments) {
    if (
      !timestamp.test(window.start) ||
      !timestamp.test(window.end) ||
      !Number.isFinite(Date.parse(window.start)) ||
      !Number.isFinite(Date.parse(window.end))
    ) {
      throw new Error(
        "Commitment start and end must be ISO timestamps with a timezone, such as 2026-11-16T09:00:00-05:00."
      )
    }
    if (Date.parse(window.end) <= Date.parse(window.start)) {
      throw new Error("Each commitment must end after it starts.")
    }
  }

  const input: GenerateDailyPlanInput = { planning_date: planningDate }
  if (commitments.length) input.commitments = commitments
  if (instructions) input.additional_instructions = instructions
  if (preferences.trim()) {
    let parsed: unknown
    try {
      parsed = JSON.parse(preferences)
    } catch {
      throw new Error("Planning preferences must be a valid JSON object.")
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Planning preferences must be a JSON object.")
    }
    input.planning_preferences = parsed as Record<string, unknown>
  }
  return input
}

export function DailyPlannerDialog({ onClose }: DailyPlannerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dispatch = useAppDispatch()
  const [planningDate, setPlanningDate] = useState(() =>
    formatLocalDate(new Date())
  )
  const [instructions, setInstructions] = useState("")
  const [preferences, setPreferences] = useState("")
  const [commitments, setCommitments] = useState<PlanningWindow[]>([])
  const [draft, setDraft] = useState<DailyPlanDraft | null>(null)
  const [approvedTasks, setApprovedTasks] = useState<Task[] | null>(null)
  const [operation, setOperation] = useState<
    "loading" | "idle" | "generating" | "approving"
  >("loading")
  const [error, setError] = useState<PlannerError | null>(null)
  const [pendingChecked, setPendingChecked] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    dialog.showModal()
    let active = true
    dailyPlannerService.pending().then(
      (pending) => {
        if (!active) return
        setDraft(pending)
        setPendingChecked(true)
        setOperation("idle")
      },
      (failure: unknown) => {
        if (!active) return
        setError(describeError(failure, "load"))
        setOperation("idle")
      }
    )
    return () => {
      active = false
      dialog.close()
    }
  }, [])

  function dismiss() {
    dialogRef.current?.close()
    onClose()
  }

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (operation !== "idle") return
    setError(null)
    let input: GenerateDailyPlanInput
    try {
      input = generationInput(
        planningDate,
        commitments,
        preferences,
        instructions
      )
    } catch (failure) {
      setError(describeError(failure, "generate"))
      return
    }
    setOperation("generating")
    try {
      const generated = await dailyPlannerService.generate(input)
      setDraft(generated)
      setApprovedTasks(null)
      setPendingChecked(true)
    } catch (failure) {
      setError(describeError(failure, "generate"))
    } finally {
      setOperation("idle")
    }
  }

  async function approve() {
    if (!draft || draft.status !== "pending" || operation !== "idle") return
    setError(null)
    setOperation("approving")
    try {
      const result = await dailyPlannerService.approve(draft.id)
      for (const task of result.tasks) dispatch(taskUpdated(task))
      setDraft(result.draft)
      setApprovedTasks(result.tasks)
    } catch (failure) {
      setError(describeError(failure, "approve"))
    } finally {
      setOperation("idle")
    }
  }

  function updateCommitment(
    index: number,
    field: keyof PlanningWindow,
    value: string
  ) {
    setCommitments((current) =>
      current.map((window, i) =>
        i === index ? { ...window, [field]: value } : window
      )
    )
  }

  const busy = operation !== "idle"

  return (
    <dialog
      ref={dialogRef}
      className="daily-planner-dialog"
      aria-labelledby="daily-planner-title"
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss()
      }}>
      <div className="daily-planner-content">
        <header className="daily-planner-header">
          <div className="daily-planner-title">
            <Sparkles size={19} aria-hidden="true" />
            <h2 id="daily-planner-title">Daily Planner</h2>
          </div>
          <button
            className="daily-planner-close"
            type="button"
            aria-label="Close daily planner"
            onClick={dismiss}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="daily-planner-body">
          {operation === "loading" && (
            <p role="status">Loading pending draft...</p>
          )}
          {operation === "generating" && (
            <p role="status">Generating draft...</p>
          )}
          {operation === "approving" && <p role="status">Approving draft...</p>}
          {pendingChecked && !draft && (
            <p>No pending draft. Generate a plan to get started.</p>
          )}
          {error && (
            <div className="daily-planner-error" role="alert">
              <strong>{error.message}</strong>
              {error.details && <pre>{error.details}</pre>}
            </div>
          )}

          <form onSubmit={generate} className="daily-planner-form">
            <h3>Generate a daily plan</h3>
            <label>
              Planning date
              <input
                type="date"
                required
                value={planningDate}
                onChange={(event) => setPlanningDate(event.target.value)}
              />
            </label>
            <label>
              Additional instructions (optional)
              <textarea
                rows={3}
                maxLength={2000}
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="What would you like to accomplish?"
              />
            </label>
            <label>
              Planning preferences (optional JSON object)
              <textarea
                rows={2}
                value={preferences}
                onChange={(event) => setPreferences(event.target.value)}
                placeholder={'{"break_minutes": 5}'}
              />
            </label>
            <div className="daily-planner-commitments">
              <span>Commitments (optional)</span>
              <small>
                Use ISO timestamps with a timezone, for example
                2026-11-16T09:00:00-05:00.
              </small>
              {commitments.map((window, index) => (
                <fieldset key={index}>
                  <legend>Commitment {index + 1}</legend>
                  <label>
                    Start
                    <input
                      type="text"
                      required
                      value={window.start}
                      onChange={(event) =>
                        updateCommitment(index, "start", event.target.value)
                      }
                      placeholder="2026-11-16T09:00:00-05:00"
                    />
                  </label>
                  <label>
                    End
                    <input
                      type="text"
                      required
                      value={window.end}
                      onChange={(event) =>
                        updateCommitment(index, "end", event.target.value)
                      }
                      placeholder="2026-11-16T10:00:00-05:00"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCommitments((current) =>
                        current.filter((_, i) => i !== index)
                      )
                    }>
                    Remove commitment
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  setCommitments((current) => [
                    ...current,
                    { start: "", end: "" }
                  ])
                }>
                Add commitment
              </button>
            </div>
            <button type="submit" disabled={busy}>
              {operation === "generating" ? "Generating..." : "Generate draft"}
            </button>
          </form>

          {draft && (
            <section
              className="daily-planner-review"
              aria-labelledby="daily-planner-review-title">
              <h3 id="daily-planner-review-title">
                {draft.status === "approved" ? "Approved plan" : "Review draft"}
              </h3>
              <p>
                {draft.date} · {draft.time_zone}
              </p>
              <p>{draft.plan.summary}</p>
              {draft.plan.scheduled_tasks.length === 0 ? (
                <p>No tasks are scheduled in this plan.</p>
              ) : (
                <ul>
                  {draft.plan.scheduled_tasks.map((task, index) => (
                    <li key={index}>
                      <strong>{task.title}</strong>
                      <span>
                        {task.start_time} – {task.end_time}
                      </span>
                      <span>Priority: {task.priority}</span>
                      {task.description && <span>{task.description}</span>}
                      {task.goal_id !== null && (
                        <span>Goal ID: {task.goal_id}</span>
                      )}
                      {task.task_id !== null && (
                        <span>Task ID: {task.task_id}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {draft.status === "pending" && (
                <button type="button" disabled={busy} onClick={approve}>
                  {operation === "approving" ? "Approving..." : "Approve draft"}
                </button>
              )}
            </section>
          )}

          {approvedTasks !== null && (
            <section className="daily-planner-review" aria-live="polite">
              <h3>Plan approved</h3>
              {approvedTasks.length === 0 ? (
                <p>No tasks were created.</p>
              ) : (
                <ul>
                  {approvedTasks.map((task) => (
                    <li key={task.id}>
                      <strong>{task.title}</strong>
                      <span>
                        {task.scheduled_start} – {task.scheduled_end}
                      </span>
                      <span>Priority: {task.priority}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </dialog>
  )
}
