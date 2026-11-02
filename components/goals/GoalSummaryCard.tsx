import React from "react"
import { Link } from "react-router-dom"

import type { Goal, GoalStatus } from "../../services/goals"
import { GoalCategoryBadge } from "./GoalCategoryBadge"

type GoalSummaryCardProps = {
  goal: Goal
  progress: number
  status: GoalStatus
}

export function GoalSummaryCard({
  goal,
  progress,
  status
}: GoalSummaryCardProps) {
  return (
    <article className="goal-card goal-summary-card">
      <GoalCategoryBadge goal={goal} />
      <h2>{goal.title}</h2>
      <div
        className="goal-progress-circle"
        role="progressbar"
        aria-label={`${goal.title} completion`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="goal-circle-track" cx="50" cy="50" r="42" />
          <circle
            className="goal-circle-value"
            cx="50"
            cy="50"
            r="42"
            pathLength="100"
            strokeDasharray={`${progress} 100`}
          />
        </svg>
        <span aria-hidden="true">{progress}%</span>
      </div>
      <span className={`goal-status goal-status-${status}`}>{status}</span>
      <Link
        className="goal-view-more"
        to={`/goals/${goal.id}`}
        aria-label={`View more about ${goal.title}`}>
        View more
      </Link>
    </article>
  )
}
