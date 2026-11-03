import { describe, expect, it } from "vitest"

import type { Task } from "../../services/tasks"
import { getDayTimelineItems } from "./plannerTasks"

function makeTask(
  id: string,
  start: Date,
  minutes: number,
  overrides: Partial<Task> = {}
): Task {
  return {
    id,
    user: 1,
    title: `Task ${id}`,
    description: "",
    status: "todo",
    priority: "medium",
    goal: null,
    scheduled_start: start.toISOString(),
    scheduled_end: new Date(start.getTime() + minutes * 60_000).toISOString(),
    completed_at: null,
    created_at: start.toISOString(),
    updated_at: start.toISOString(),
    ...overrides
  }
}

// Wednesday, local time
const day = new Date(2026, 9, 21)

describe("getDayTimelineItems", () => {
  it("sorts server results (ordered by -created_at) by start without date filtering", () => {
    const tasks = [
      makeTask("late", new Date(2026, 9, 21, 15, 30), 30),
      makeTask("early", new Date(2026, 9, 21, 8, 30), 60),
      // Started the previous evening and crosses midnight into the day.
      makeTask("overnight", new Date(2026, 9, 20, 23, 0), 120)
    ]
    expect(getDayTimelineItems(tasks).map((item) => item.id)).toEqual([
      "overnight",
      "early",
      "late"
    ])
  })

  it("maps status, description and time range", () => {
    const [item] = getDayTimelineItems([
      makeTask("a", new Date(2026, 9, 21, 9, 0), 90, {
        status: "completed",
        description: "Notes"
      })
    ])
    expect(item.detail).toBe("Notes")
    expect(item.done).toBe(true)
    expect(item.tone).toBe("teal")
    expect(item.timeRange).toContain("–")
  })

  it("skips tasks with an invalid schedule and returns empty for no tasks", () => {
    const bad = makeTask("bad", day, 30, { scheduled_start: "" })
    expect(getDayTimelineItems([bad])).toEqual([])
    expect(getDayTimelineItems([])).toEqual([])
  })

  it("does not duplicate a task that appears once", () => {
    const task = makeTask("a", new Date(2026, 9, 21, 9, 0), 30)
    expect(getDayTimelineItems([task])).toHaveLength(1)
  })
})
