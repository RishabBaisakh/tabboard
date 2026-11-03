export function toLocalDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-")
}

export function getLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addCalendarDays(date: Date, days: number) {
  const result = getLocalDate(date)
  result.setDate(result.getDate() + days)
  return result
}

export function formatPlannerDay(date: Date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" })
  const monthDayYear = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })
  return `${weekday} · ${monthDayYear}`
}
