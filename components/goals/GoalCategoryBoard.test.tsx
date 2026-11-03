import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { StaticRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import type { Goal, GoalCategory } from "../../services/goals"
import { GoalCategoryBoard } from "./GoalCategoryBoard"

const categories: GoalCategory[] = [
  { key: "health_wellness", name: "Health & Wellness", description: "" },
  { key: "career_learning", name: "Career & Learning", description: "" },
  {
    key: "family_relationships",
    name: "Family & Relationships",
    description: ""
  },
  { key: "financial_life", name: "Financial Life", description: "" },
  { key: "travel_experiences", name: "Travel & Experiences", description: "" },
  { key: "personal_life", name: "Personal Life", description: "" }
]

const goals: Goal[] = Array.from({ length: 13 }, (_, index) => ({
  id: index + 1,
  title: `Goal ${index + 1}`,
  category: "health_wellness",
  start_date: "2026-11-01",
  timeline: "short_term",
  motivation: ""
}))

function renderBoard(items = goals) {
  return renderToStaticMarkup(
    <StaticRouter location="/goals">
      <GoalCategoryBoard categories={categories} goals={items} tasks={[]} />
    </StaticRouter>
  )
}

describe("GoalCategoryBoard", () => {
  it("renders only populated category rows with every goal in a sliding row", () => {
    const html = renderBoard()
    expect(html.match(/class="goal-category-column"/g)).toHaveLength(1)
    expect(html).not.toContain("Career &amp; Learning")
    expect(html.match(/class="goal-card goal-summary-card"/g)).toHaveLength(13)
    expect(html).toContain("--category-tint:#fbeaed")
    expect(html.match(/class="goal-category-viewport"/g)).toHaveLength(1)
    expect(html.match(/class="goal-category-stack"/g)).toHaveLength(1)
    expect(html).toContain("13 goals")
    expect(html).toContain('href="/goals/7"')
    expect(html).toContain('href="/goals/13"')
  })

  it("renders no category rows when there are no matching goals", () => {
    expect(renderBoard([])).not.toContain('class="goal-category-column"')
  })

  it("preserves uncategorized and unknown-category goals", () => {
    const html = renderBoard([
      { ...goals[0], category: null },
      { ...goals[1], category: "custom" }
    ])
    expect(html).toContain("No category")
    expect(html).toContain("custom")
    expect(html).toContain('href="/goals/1"')
    expect(html).toContain('href="/goals/2"')
  })
})
