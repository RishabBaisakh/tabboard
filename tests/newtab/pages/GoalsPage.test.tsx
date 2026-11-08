import { configureStore } from "@reduxjs/toolkit"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Provider } from "react-redux"
import { Route, Routes, StaticRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import type { Goal } from "../../../services/goals"
import goalCategoriesReducer from "../../../store/goalCategoriesSlice"
import goalsReducer from "../../../store/goalsSlice"
import profileReducer from "../../../store/profileSlice"
import tasksReducer from "../../../store/tasksSlice"
import GoalsPage from "../../../newtab/pages/GoalsPage"

vi.stubGlobal("React", React)

const goal: Goal = {
  id: 12,
  title: "Run a 5K",
  description: "Detailed training plan",
  motivation: "Feel healthier",
  start_date: "2026-11-01",
  timeline: "short_term",
  status: "completed"
}

function renderPage(path: string) {
  const store = configureStore({
    reducer: {
      goals: goalsReducer,
      tasks: tasksReducer,
      goalCategories: goalCategoriesReducer,
      profile: profileReducer
    },
    preloadedState: {
      goals: {
        items: [goal],
        status: "succeeded",
        error: null,
        category: null,
        unfilteredCount: 1
      },
      tasks: { items: [], status: "succeeded", error: null }
    }
  })
  return renderToStaticMarkup(
    <Provider store={store}>
      <StaticRouter location={path}>
        <Routes>
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:goalId" element={<GoalsPage />} />
        </Routes>
      </StaticRouter>
    </Provider>
  )
}

describe("Goal details route", () => {
  it("shows all goal information and management actions regardless of status filter", () => {
    const html = renderPage("/goals/12")
    expect(html).toContain(goal.description)
    expect(html).toContain(goal.motivation)
    expect(html).toContain("Short-term")
    expect(html).toContain("Edit goal: Run a 5K")
    expect(html).toContain("Delete goal: Run a 5K")
    expect(html).toContain('href="/goals"')
    expect(html).not.toContain('aria-label="Filter goals"')
  })

  it("shows an explicit missing-goal state with back navigation", () => {
    const html = renderPage("/goals/999")
    expect(html).toContain("Goal not found")
    expect(html).toContain('href="/goals"')
    expect(html).not.toContain(goal.description)
  })
})
