import { ChevronLeft, ChevronRight } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"

import {
  getGoalProgress,
  getGoalStatus,
  type Goal,
  type GoalCategory
} from "../../services/goals"
import type { Task } from "../../services/tasks"
import { getCategoryVisual } from "./categoryVisuals"
import { GoalSummaryCard } from "./GoalSummaryCard"

function CategoryColumn({
  category,
  goals,
  tasks
}: {
  category: GoalCategory
  goals: Goal[]
  tasks: Task[]
}) {
  const stackRef = useRef<HTMLDivElement>(null)
  const [canSlideBack, setCanSlideBack] = useState(false)
  const [canSlideForward, setCanSlideForward] = useState(false)
  const { color, tint } = getCategoryVisual(category.key)

  const updateSlideState = useCallback(() => {
    const stack = stackRef.current
    if (!stack) return
    const maxScroll = stack.scrollWidth - stack.clientWidth
    setCanSlideBack(stack.scrollLeft > 1)
    setCanSlideForward(stack.scrollLeft < maxScroll - 1)
  }, [])

  useEffect(() => {
    updateSlideState()
    const stack = stackRef.current
    if (!stack || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(updateSlideState)
    observer.observe(stack)
    return () => observer.disconnect()
  }, [updateSlideState, goals.length])

  const slide = (direction: -1 | 1) => {
    const stack = stackRef.current
    if (!stack) return
    stack.scrollBy({
      left: direction * stack.clientWidth * 0.9,
      behavior: "smooth"
    })
  }

  const viewportClass = [
    "goal-category-viewport",
    canSlideBack ? "can-slide-back" : "",
    canSlideForward ? "can-slide-forward" : ""
  ]
    .filter(Boolean)
    .join(" ")

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
        <span className="goal-category-count">
          {goals.length} {goals.length === 1 ? "goal" : "goals"}
        </span>
      </header>
      <div className={viewportClass}>
        {canSlideBack && (
          <button
            type="button"
            className="goal-category-arrow is-back"
            aria-label={`Show previous ${category.name} goals`}
            onClick={() => slide(-1)}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        <div
          ref={stackRef}
          className="goal-category-stack"
          role="group"
          aria-label={`${category.name} goal cards`}
          tabIndex={goals.length > 0 ? 0 : undefined}
          onScroll={updateSlideState}>
          {goals.length === 0 ? (
            <p className="goal-category-no-goals">No matching goals.</p>
          ) : (
            goals.map((goal) => {
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
        {canSlideForward && (
          <button
            type="button"
            className="goal-category-arrow is-forward"
            aria-label={`Show more ${category.name} goals`}
            onClick={() => slide(1)}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>
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
            key={category.key}
            category={category}
            goals={categoryGoals}
            tasks={tasks}
          />
        ))}
    </div>
  )
}
