import { describe, expect, it } from "vitest"

import { addCalendarDays, formatPlannerDay } from "./plannerCalendar"

function localDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day)
}

describe("Planner calendar navigation", () => {
  it("formats the selected day with weekday, month, day, and year", () => {
    expect(formatPlannerDay(localDate(2026, 10, 19))).toBe(
      "Monday · October 19, 2026"
    )
  })

  it("navigates one calendar day across month boundaries", () => {
    expect(addCalendarDays(localDate(2026, 10, 31), 1)).toEqual(
      localDate(2026, 11, 1)
    )
    expect(addCalendarDays(localDate(2026, 11, 1), -1)).toEqual(
      localDate(2026, 10, 31)
    )
  })
})
