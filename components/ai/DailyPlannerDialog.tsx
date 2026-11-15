import { ArrowUp, CalendarCheck, Sparkles, X } from "lucide-react"
import React, { useEffect, useRef } from "react"

type DailyPlannerDialogProps = {
  onClose: () => void
}

export function DailyPlannerDialog({ onClose }: DailyPlannerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    dialog.showModal()
    promptRef.current?.focus()
    return () => dialog.close()
  }, [])

  function dismiss() {
    dialogRef.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="daily-planner-dialog"
      aria-labelledby="daily-planner-title"
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          dismiss()
        }
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
          <h3>What would you like to accomplish today?</h3>
          <p>
            Tell me what you have in mind. I'll help organize your day around
            your goals and schedule.
          </p>
          <form onSubmit={(event) => event.preventDefault()}>
            <div className="daily-planner-input">
              <textarea
                ref={promptRef}
                aria-label="What would you like to accomplish today?"
                placeholder="I want to study system design for 2 hours, work on TabBoard, and exercise..."
                rows={4}
              />
              <button
                className="daily-planner-submit"
                type="submit"
                aria-label="Submit daily planner prompt">
                <ArrowUp size={19} aria-hidden="true" />
              </button>
            </div>
          </form>
          <div className="daily-planner-hint">
            <CalendarCheck size={16} aria-hidden="true" />
            <span>Considers your existing tasks and preferences</span>
          </div>
        </div>
      </div>
    </dialog>
  )
}
