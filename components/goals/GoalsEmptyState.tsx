import { CalendarCheck, Flag, TrendingUp } from "lucide-react"
import React from "react"

import type { GoalCategory } from "../../services/goals"
import { CategoryBanners } from "./CategoryBanners"

import "../../styles/pages/goals-empty.css"

const STEPS = [
  {
    icon: Flag,
    title: "Set a goal",
    text: "Define what you want to achieve.",
    color: "#3e6fb1",
    tint: "#eaf1fb"
  },
  {
    icon: CalendarCheck,
    title: "Schedule tasks",
    text: "Make time for your next step.",
    color: "#278277",
    tint: "#e6f4f1"
  },
  {
    icon: TrendingUp,
    title: "Track progress",
    text: "See how far you've come.",
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
      <section aria-labelledby="goals-how-title">
        <h2 className="goals-empty-heading" id="goals-how-title">
          How goals work
        </h2>
        <ul className="goals-how-list">
          {STEPS.map(({ icon: Icon, title, text, color, tint }) => (
            <li
              className="goals-how-card"
              key={title}
              style={
                {
                  "--how-color": color,
                  "--how-tint": tint
                } as React.CSSProperties
              }>
              <span className="goals-how-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.9} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ul>
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
