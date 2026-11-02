import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { StaticRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import type { Goal } from "../../services/goals"
import { GoalSummaryCard } from "./GoalSummaryCard"

const goal: Goal = {
  id: 12,
  title: "Run a 5K",
  description: "Detailed training plan",
  motivation: "Feel healthier",
  start_date: "2026-11-01",
  timeline: "short_term"
}

describe("GoalSummaryCard", () => {
  it.each([0, 50, 100])(
    "renders circular progress at %i percent",
    (progress) => {
      const html = renderToStaticMarkup(
        <StaticRouter location="/goals">
          <GoalSummaryCard goal={goal} progress={progress} status="active" />
        </StaticRouter>
      )
      expect(html).toContain(`aria-valuenow="${progress}"`)
      expect(html).toContain(`stroke-dasharray="${progress} 100"`)
      expect(html).toContain('href="/goals/12"')
      expect(html).toContain("View more")
      expect(html).toContain(goal.title)
      expect(html).not.toContain(goal.description)
      expect(html).not.toContain(goal.motivation)
      expect(html).not.toContain("goal-progress-bar")
    }
  )
})
