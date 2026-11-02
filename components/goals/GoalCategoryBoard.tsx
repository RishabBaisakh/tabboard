import React, { useState } from "react"

import {
  getGoalProgress,
  getGoalStatus,
  type Goal,
  type GoalCategory
} from "../../services/goals"
import type { Task } from "../../services/tasks"
import { getCategoryVisual } from "./categoryVisuals"
import { GoalSummaryCard } from "./GoalSummaryCard"

const PAGE_SIZE = 6

export function getGoalPage(goals: Goal[], requestedPage: number) {
  const pageCount = Math.max(1, Math.ceil(goals.length / PAGE_SIZE))
  const page = Math.max(0, Math.min(requestedPage, pageCount - 1))
  return {
    page,
    pageCount,
    items: goals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  }
}

function CategoryColumn({
  category,
  goals,
  tasks
}: {
  category: GoalCategory
  goals: Goal[]
  tasks: Task[]
}) {
  const [requestedPage, setPage] = useState(0)
  const { page, pageCount, items } = getGoalPage(goals, requestedPage)
  const { color, tint } = getCategoryVisual(category.key)

  return (
    <section
      className="goal-category-column"
      aria-label={`${category.name} goals`}
      style={
        {
          "--category-color": color,
          "--category-tint": tint
        } as React.CSSProperties
      }>
      <header className="goal-category-heading">
        <h2>{category.name}</h2>
        <span>{goals.length}</span>
      </header>
      <div
        className="goal-category-stack"
        role="group"
        aria-label={`${category.name} goal cards`}
        tabIndex={items.length > 0 ? 0 : undefined}
        aria-live="polite">
        {items.length === 0 ? (
          <p className="goal-category-no-goals">No matching goals.</p>
        ) : (
          items.map((goal) => {
            const goalTasks = tasks.filter((task) => task.goal === goal.id)
            return (
              <GoalSummaryCard
                key={goal.id}
                goal={goal}
                progress={getGoalProgress(goalTasks)}
                status={getGoalStatus(goal, goalTasks)}
              />
            )
          })
        )}
      </div>
      {pageCount > 1 && (
        <nav
          className="goal-category-pagination"
          aria-label={`${category.name} pages`}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span aria-live="polite">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page === pageCount - 1}
            onClick={() => setPage(page + 1)}>
            Next
          </button>
        </nav>
      )}
    </section>
  )
}

export function GoalCategoryBoard({
  categories,
  goals,
  tasks
}: {
  categories: GoalCategory[]
  goals: Goal[]
  tasks: Task[]
}) {
  const groups = new Map<string, { category: GoalCategory; goals: Goal[] }>(
    categories.map((category) => [category.key, { category, goals: [] }])
  )
  for (const goal of goals) {
    const key = goal.category ?? goal.category_detail?.key ?? ""
    if (!groups.has(key)) {
      groups.set(key, {
        category: goal.category_detail ?? {
          key,
          name: key || "No category",
          description: ""
        },
        goals: []
      })
    }
    const group = groups.get(key)
    if (group) group.goals.push(goal)
  }

  return (
    <div className="goal-list">
      {Array.from(groups.values())
        .filter((group) => group.goals.length > 0)
        .map(({ category, goals: categoryGoals }) => (
          <CategoryColumn
            key={`${category.key}:${categoryGoals.map((goal) => goal.id).join(",")}`}
            category={category}
            goals={categoryGoals}
            tasks={tasks}
          />
        ))}
    </div>
  )
}
