import React from "react"

import type { GoalCategory } from "../../services/goals"
import { getCategoryVisual } from "./categoryVisuals"

import "../../styles/pages/goals2.css"

const CATEGORY_IMAGES: Record<string, string | undefined> = {
  health_wellness: new URL(
    "../../assets/images/goal-categories/health-wellness.png",
    import.meta.url
  ).href,
  career_learning: new URL(
    "../../assets/images/goal-categories/career-learning.png",
    import.meta.url
  ).href,
  family_relationships: new URL(
    "../../assets/images/goal-categories/family-relationships.png",
    import.meta.url
  ).href,
  financial_life: new URL(
    "../../assets/images/goal-categories/financial-life.png",
    import.meta.url
  ).href,
  travel_experiences: new URL(
    "../../assets/images/goal-categories/travel-experiences.png",
    import.meta.url
  ).href,
  personal_life: new URL(
    "../../assets/images/goal-categories/personal-life.png",
    import.meta.url
  ).href
}

type CategoryBannersProps = {
  categories: GoalCategory[]
  // When provided, each banner is a button that reports its category key.
  onSelect?: (key: string) => void
  // Small single-row variant: icon and name only, description as a tooltip.
  compact?: boolean
}

export function CategoryBanners({
  categories,
  onSelect,
  compact = false
}: CategoryBannersProps) {
  return (
    <ul className={`goals2-list${compact ? " is-compact" : ""}`}>
      {categories.map((category) => {
        const { icon: Icon, color, tint } = getCategoryVisual(category.key)
        const image = CATEGORY_IMAGES[category.key]
        const content = (
          <>
            <span className="goals2-icon" aria-hidden="true">
              {image ? (
                <img src={image} alt="" />
              ) : (
                <Icon size={34} strokeWidth={1.7} />
              )}
            </span>
            <span className="goals2-copy">
              <h2>{category.name}</h2>
              <p>{category.description}</p>
            </span>
            {!compact &&
              (image ? (
                <img className="goals2-art" src={image} alt="" />
              ) : (
                <Icon
                  className="goals2-art"
                  size={150}
                  strokeWidth={1.2}
                  aria-hidden="true"
                />
              ))}
          </>
        )
        return (
          <li
            key={category.key}
            style={
              { "--g2-color": color, "--g2-tint": tint } as React.CSSProperties
            }>
            {onSelect ? (
              <button
                className="goals2-banner is-action"
                type="button"
                title={category.description}
                onClick={() => onSelect(category.key)}>
                {content}
              </button>
            ) : (
              <div className="goals2-banner">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
