import { Sparkles } from "lucide-react"
import React, { useState } from "react"

import { DailyPlannerDialog } from "./DailyPlannerDialog"

import "../../styles/ai.css"

export function GlobalAIWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="global-ai-widget">
        <button
          className="global-ai-trigger"
          type="button"
          aria-label="Plan your day with AI"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}>
          <Sparkles size={22} aria-hidden="true" />
        </button>
        <span className="global-ai-tooltip" aria-hidden="true">
          Plan your day with AI
        </span>
      </div>
      {isOpen && <DailyPlannerDialog onClose={() => setIsOpen(false)} />}
    </>
  )
}
