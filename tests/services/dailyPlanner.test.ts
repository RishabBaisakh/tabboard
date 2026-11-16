import { describe, expect, it, vi } from "vitest"

import { ApiClient, ApiError, type TokenStorage } from "../../services/api"
import { createDailyPlannerService } from "../../services/dailyPlanner"

const storage: TokenStorage = {
  getTokens: async () => ({ access: "access-token", refresh: "refresh-token" }),
  setTokens: async () => {},
  clearTokens: async () => {}
}

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  })
}

describe("daily planner service", () => {
  it("uses authenticated requests and approves the selected draft, not a newer pending draft", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const selected = { id: "selected-id", status: "pending" }
    const newest = { id: "newest-id", status: "pending" }
    const approved = {
      draft: { ...selected, status: "approved" },
      tasks: [{ id: "task-id" }]
    }
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input)
      calls.push({ url, init })
      if (url.endsWith("/generate/")) return response(selected, 201)
      if (url.endsWith("/pending/")) return response(newest)
      return response(approved)
    }
    const service = createDailyPlannerService(
      new ApiClient("http://api", storage, fetcher)
    )
    const input = {
      planning_date: "2026-11-16",
      commitments: [
        { start: "2026-11-16T09:00:00Z", end: "2026-11-16T10:00:00Z" }
      ],
      planning_preferences: { break_minutes: 5 },
      additional_instructions: "Focus"
    }

    const generated = await service.generate(input)
    await expect(service.pending()).resolves.toEqual(newest)
    await expect(service.approve(generated.id)).resolves.toEqual(approved)
    expect(calls.map((call) => call.url)).toEqual([
      "http://api/api/v1/ai/daily-plans/generate/",
      "http://api/api/v1/ai/daily-plans/pending/",
      "http://api/api/v1/ai/daily-plans/selected-id/approve/"
    ])
    expect(JSON.parse(String(calls[0].init?.body))).toEqual(input)
    expect(JSON.parse(String(calls[2].init?.body))).toEqual({})
    for (const call of calls) {
      expect(new Headers(call.init?.headers).get("Authorization")).toBe(
        "Bearer access-token"
      )
    }
  })

  it("treats only pending lookup 404 as empty and preserves other errors", async () => {
    const fetcher: typeof fetch = async () =>
      response({ detail: "Not found." }, 404)
    const service = createDailyPlannerService(
      new ApiClient("http://api", storage, fetcher)
    )
    await expect(service.pending()).resolves.toBeNull()
    await expect(service.approve("missing")).rejects.toMatchObject({
      status: 404,
      payload: { detail: "Not found." }
    })

    for (const status of [400, 409, 502, 503, 504]) {
      const error = new ApiError("Failed", status, {
        errors: [{ message: "Invalid" }]
      })
      const failed = createDailyPlannerService({
        request: vi.fn().mockRejectedValue(error)
      })
      await expect(failed.pending()).rejects.toBe(error)
      await expect(
        failed.generate({ planning_date: "2026-11-16" })
      ).rejects.toBe(error)
      await expect(failed.approve("draft-id")).rejects.toBe(error)
    }
  })
})
