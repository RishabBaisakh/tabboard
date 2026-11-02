import { CalendarCheck, Flag, TrendingUp } from "lucide-react"
import React from "react"

import type { GoalCategory } from "../../services/goals"
import { CategoryBanners } from "./CategoryBanners"

import "../../styles/pages/goals-empty.css"

const STEPS = [
  {
    key: "goal",
    icon: Flag,
    title: "Set a goal",
    text: "Choose what you want to achieve.",
    color: "#3e6fb1",
    tint: "#eaf1fb"
  },
  {
    key: "tasks",
    icon: CalendarCheck,
    title: "Schedule tasks",
    text: "Make time for small steps.",
    color: "#278277",
    tint: "#e6f4f1"
  },
  {
    key: "progress",
    icon: TrendingUp,
    title: "Track progress",
    text: "Complete tasks. See your progress.",
    color: "#b37a22",
    tint: "#fbf1df"
  }
]

type GoalsEmptyStateProps = {
  // Empty when categories are unavailable; the shortcuts section is then hidden.
  categories: GoalCategory[]
  onSelectCategory: (key: string) => void
}

export function GoalsEmptyState({
  categories,
  onSelectCategory
}: GoalsEmptyStateProps) {
  return (
    <div className="goals-empty">
      <section className="goals-how" aria-labelledby="goals-how-title">
        <h2 className="goals-empty-heading" id="goals-how-title">
          How goals work
        </h2>
        <ol className="goals-how-list">
          {STEPS.map(({ key, icon: Icon, title, text, color, tint }, index) => (
            <li
              className="goals-how-card"
              key={title}
              style={
                {
                  "--how-color": color,
                  "--how-tint": tint
                } as React.CSSProperties
              }>
              <div className="goals-how-step" aria-hidden="true">
                <span className="goals-how-icon">
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span>STEP {index + 1}</span>
              </div>
              <div className="goals-how-preview" aria-hidden="true">
                <span className="goals-how-example">EXAMPLE</span>
                {key === "goal" ? (
                  <>
                    <strong>Run my first 5K</strong>
                  </>
                ) : key === "tasks" ? (
                  <>
                    <span className="goals-how-task">
                      <CalendarCheck size={15} />
                      Go for a 20-minute run
                    </span>
                  </>
                ) : (
                  <>
                    <span className="goals-how-progress">
                      <span className="goals-how-track">
                        <span />
                      </span>
                      50%
                    </span>
                  </>
                )}
              </div>
              <div className="goals-how-copy">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="goals-grow-title">
          <h2 className="goals-empty-heading" id="goals-grow-title">
            Where would you like to grow?
          </h2>
          <p className="goals-empty-sub">
            Choose a life area to get started, or create a goal of your own.
          </p>
          <CategoryBanners
            categories={categories}
            onSelect={onSelectCategory}
          />
        </section>
      )}
    </div>
  )
}
