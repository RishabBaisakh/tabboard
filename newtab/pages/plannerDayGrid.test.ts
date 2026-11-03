import { describe, expect, it } from "vitest"

import type { Task } from "../../services/tasks"
import {
  getDayGridEvents,
  getHourLabels,
  getTimeZoneOffsetLabel,
  MINUTES_PER_DAY
} from "./plannerDayGrid"

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

function layout(tasks: Task[]) {
  return getDayGridEvents(tasks, day).map(
    ({ id, startMinutes, endMinutes, column, columnCount }) => ({
      id,
      startMinutes,
      endMinutes,
      column,
      columnCount
    })
  )
}

describe("getDayGridEvents", () => {
  it("positions a lone task by its times and gives it the full width", () => {
    const [event] = layout([makeTask("a", new Date(2026, 9, 21, 9, 0), 60)])
    expect(event).toEqual({
      id: "a",
      startMinutes: 9 * 60,
      endMinutes: 10 * 60,
      column: 0,
      columnCount: 1
    })
  })

  it("splits two, three, and four fully overlapping tasks into equal columns", () => {
    for (const count of [2, 3, 4]) {
      const tasks = Array.from({ length: count }, (_, index) =>
        makeTask(`t${index}`, new Date(2026, 9, 21, 9, 0), 60)
      )
      const events = layout(tasks)
      expect(events.map((event) => event.columnCount)).toEqual(
        Array(count).fill(count)
      )
      expect(events.map((event) => event.column).sort()).toEqual(
        Array.from({ length: count }, (_, index) => index)
      )
    }
  })

  it("handles partial overlaps by chaining them into one group", () => {
    const events = layout([
      makeTask("a", new Date(2026, 9, 21, 9, 0), 60),
      makeTask("b", new Date(2026, 9, 21, 9, 30), 60),
      makeTask("c", new Date(2026, 9, 21, 10, 15), 45)
    ])
    // c only overlaps b, so it reuses a's freed column within the group.
    expect(events).toEqual([
      {
        id: "a",
        startMinutes: 540,
        endMinutes: 600,
        column: 0,
        columnCount: 2
      },
      {
        id: "b",
        startMinutes: 570,
        endMinutes: 630,
        column: 1,
        columnCount: 2
      },
      { id: "c", startMinutes: 615, endMinutes: 660, column: 0, columnCount: 2 }
    ])
  })

  it("lets non-overlapping tasks reclaim the full width in a new group", () => {
    const events = layout([
      makeTask("a", new Date(2026, 9, 21, 9, 0), 60),
      makeTask("b", new Date(2026, 9, 21, 9, 0), 60),
      makeTask("solo", new Date(2026, 9, 21, 11, 0), 60)
    ])
    expect(events.find((event) => event.id === "solo")).toEqual({
      id: "solo",
      startMinutes: 660,
      endMinutes: 720,
      column: 0,
      columnCount: 1
    })
  })

  it("treats back-to-back tasks as non-overlapping", () => {
    const events = layout([
      makeTask("a", new Date(2026, 9, 21, 9, 0), 60),
      makeTask("b", new Date(2026, 9, 21, 10, 0), 60)
    ])
    expect(events.map((event) => event.columnCount)).toEqual([1, 1])
    expect(events.map((event) => event.column)).toEqual([0, 0])
  })

  it("clamps tasks crossing midnight to the visible day", () => {
    const events = layout([
      // Started the previous evening and ends at 1:00 AM.
      makeTask("overnight", new Date(2026, 9, 20, 23, 0), 120),
      // Ends exactly at the next midnight.
      makeTask("evening", new Date(2026, 9, 21, 22, 0), 120),
      // Runs into the next day.
      makeTask("spill", new Date(2026, 9, 21, 23, 30), 120)
    ])
    expect(events[0]).toMatchObject({
      id: "overnight",
      startMinutes: 0,
      endMinutes: 60
    })
    expect(events[1]).toMatchObject({
      id: "evening",
      startMinutes: 22 * 60,
      endMinutes: MINUTES_PER_DAY
    })
    expect(events[2]).toMatchObject({
      id: "spill",
      startMinutes: 23 * 60 + 30,
      endMinutes: MINUTES_PER_DAY
    })
  })

  it("skips tasks outside the visible day or with invalid schedules", () => {
    expect(
      layout([
        makeTask("before", new Date(2026, 9, 20, 9, 0), 60),
        makeTask("after", new Date(2026, 9, 22, 9, 0), 60),
        makeTask("bad", new Date(2026, 9, 21, 9, 0), 60, {
          scheduled_start: ""
        })
      ])
    ).toEqual([])
  })

  it("stretches very short tasks to a readable minimum and keeps them side by side", () => {
    const events = layout([
      makeTask("a", new Date(2026, 9, 21, 9, 0), 5),
      makeTask("b", new Date(2026, 9, 21, 9, 10), 5)
    ])
    // The stretched extents overlap, so the blocks split instead of stacking.
    expect(events[0]).toMatchObject({ endMinutes: 564, columnCount: 2 })
    expect(events[1]).toMatchObject({ column: 1, columnCount: 2 })
  })

  it("lays out open-ended tasks as a half-hour block with a start-only label", () => {
    const [event] = getDayGridEvents(
      [
        makeTask("open", new Date(2026, 9, 21, 9, 0), 60, {
          scheduled_end: "not-a-date"
        })
      ],
      day
    )
    expect(event.endMinutes - event.startMinutes).toBe(30)
    expect(event.timeRange).not.toContain("–")
  })
})

describe("getTimeZoneOffsetLabel", () => {
  it("derives the offset from an IANA zone including daylight saving", () => {
    const winter = new Date(2026, 0, 15, 12, 0)
    const summer = new Date(2026, 6, 15, 12, 0)
    expect(getTimeZoneOffsetLabel(winter, "America/Toronto")).toBe("GMT-5")
    expect(getTimeZoneOffsetLabel(summer, "America/Toronto")).toBe("GMT-4")
  })

  it("keeps half-hour offsets and labels UTC explicitly", () => {
    const date = new Date(2026, 0, 15, 12, 0)
    expect(getTimeZoneOffsetLabel(date, "Asia/Kolkata")).toBe("GMT+5:30")
    expect(getTimeZoneOffsetLabel(date, "UTC")).toBe("GMT+0")
  })
})

describe("getHourLabels", () => {
  it("lists all 24 hours from midnight to 11 PM", () => {
    const labels = getHourLabels()
    expect(labels).toHaveLength(24)
    expect(new Set(labels).size).toBe(24)
  })
})
