import { describe, expect, it } from "vitest"

import { taskListPath } from "../../services/tasks"
import { createLatestGuard, getDayRange, rangeKey } from "./plannerRequests"

describe("planner request ranges", () => {
  it("daily view sends the selected day as start and end", () => {
    expect(taskListPath(getDayRange(new Date(2026, 9, 21, 23, 59)))).toBe(
      "/api/v1/tasks/?start_date=2026-10-21&end_date=2026-10-21"
    )
  })

  it("changes key when the selected day changes", () => {
    const a = rangeKey(getDayRange(new Date(2026, 9, 21)))
    const b = rangeKey(getDayRange(new Date(2026, 9, 22)))
    expect(a).not.toBe(b)
  })
})

describe("createLatestGuard", () => {
  it("rejects stale responses once a newer request begins", () => {
    const guard = createLatestGuard()
    const first = guard.begin()
    const second = guard.begin()
    expect(first()).toBe(false)
    expect(second()).toBe(true)
  })

  it("cancel invalidates the in-flight request", () => {
    const guard = createLatestGuard()
    const request = guard.begin()
    guard.cancel()
    expect(request()).toBe(false)
  })
})
