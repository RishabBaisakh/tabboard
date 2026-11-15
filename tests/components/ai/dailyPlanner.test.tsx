import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DailyPlannerDialog } from "../../../components/ai/DailyPlannerDialog"
import { GlobalAIWidget } from "../../../components/ai/GlobalAIWidget"

describe("Daily Planner", () => {
  it("initially renders an accessible launcher without an open dialog", () => {
    const html = renderToStaticMarkup(<GlobalAIWidget />)

    expect(html).toContain('aria-label="Plan your day with AI"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain("<dialog")
  })

  it("renders a labeled dialog with an editable prompt and close button", () => {
    const html = renderToStaticMarkup(<DailyPlannerDialog onClose={vi.fn()} />)

    expect(html).toContain('aria-labelledby="daily-planner-title"')
    expect(html).toContain("What would you like to accomplish today?")
    expect(html).toContain("<textarea")
    expect(html).toContain("I want to study system design for 2 hours")
    expect(html).toContain('aria-label="Close daily planner"')
    expect(html).toContain('aria-label="Submit daily planner prompt"')
    expect(html).toContain("Considers your existing tasks and preferences")
  })
})
