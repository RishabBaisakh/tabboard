import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Provider } from "react-redux"
import { describe, expect, it, vi } from "vitest"

import {
  DailyPlannerDialog,
  generationInput
} from "../../../components/ai/DailyPlannerDialog"
import { GlobalAIWidget } from "../../../components/ai/GlobalAIWidget"
import { store } from "../../../store"

describe("Daily Planner", () => {
  it("initially renders an accessible launcher without an open dialog", () => {
    const html = renderToStaticMarkup(<GlobalAIWidget />)

    expect(html).toContain('aria-label="Plan your day with AI"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain("<dialog")
  })

  it("renders a labeled dialog with generation inputs and loading state", () => {
    const html = renderToStaticMarkup(
      <Provider store={store}>
        <DailyPlannerDialog onClose={vi.fn()} />
      </Provider>
    )

    expect(html).toContain('aria-labelledby="daily-planner-title"')
    expect(html).toContain("Loading pending draft...")
    expect(html).toContain('type="date"')
    expect(html).toContain("<textarea")
    expect(html).toContain('maxLength="2000"')
    expect(html).toContain('aria-label="Close daily planner"')
    expect(html).toContain("Generate draft")
    expect(html).toContain("Commitments (optional)")
  })

  it("builds generation inputs without availability and validates optional data", () => {
    const commitment = {
      start: "2026-11-16T09:00:00-05:00",
      end: "2026-11-16T10:00:00-05:00"
    }
    expect(generationInput("2026-11-16", [], "", "")).toEqual({
      planning_date: "2026-11-16"
    })
    expect(
      generationInput(
        "2026-11-16",
        [commitment],
        '{"break_minutes":5}',
        "Focus"
      )
    ).toEqual({
      planning_date: "2026-11-16",
      commitments: [commitment],
      planning_preferences: { break_minutes: 5 },
      additional_instructions: "Focus"
    })
    expect(() => generationInput("", [], "", "")).toThrow("planning date")
    expect(() =>
      generationInput(
        "2026-11-16",
        [{ ...commitment, start: "2026-11-16T09:00:00" }],
        "",
        ""
      )
    ).toThrow("timezone")
    expect(() =>
      generationInput(
        "2026-11-16",
        [{ start: commitment.end, end: commitment.start }],
        "",
        ""
      )
    ).toThrow("end after")
    expect(() => generationInput("2026-11-16", [], "[]", "")).toThrow(
      "JSON object"
    )
    expect(() => generationInput("2026-11-16", [], "{", "")).toThrow(
      "valid JSON"
    )
  })
})
