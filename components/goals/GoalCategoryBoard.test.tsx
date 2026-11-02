import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { StaticRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import type { Goal, GoalCategory } from "../../services/goals"
import { getGoalPage, GoalCategoryBoard } from "./GoalCategoryBoard"

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
  it("renders only populated category rows with six goals per page", () => {
    const html = renderBoard()
    expect(html.match(/class="goal-category-column"/g)).toHaveLength(1)
    expect(html).not.toContain("Career &amp; Learning")
    expect(html.match(/class="goal-card goal-summary-card"/g)).toHaveLength(6)
    expect(html).toContain("--category-tint:#fbeaed")
    expect(html).toContain("Next")
    expect(html).toContain("Previous")
    expect(html).toContain("1 / 3")
    expect(html).not.toContain('href="/goals/7"')
  })

  it("renders no category rows when there are no matching goals", () => {
    expect(renderBoard([])).not.toContain('class="goal-category-column"')
  })

  it("paginates without skipping or duplicating goals and clamps stale pages", () => {
    const pages = [0, 1, 2].map((page) => getGoalPage(goals, page))
    expect(pages.map((page) => page.items.length)).toEqual([6, 6, 1])
    expect(pages.flatMap((page) => page.items)).toEqual(goals)
    expect(getGoalPage(goals.slice(0, 2), 2).page).toBe(0)
    expect(getGoalPage(goals, -1).page).toBe(0)
    expect(getGoalPage([], 1).items).toEqual([])
  })

  it("omits pagination for six or fewer goals", () => {
    expect(renderBoard(goals.slice(0, 6))).not.toContain("Next")
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
