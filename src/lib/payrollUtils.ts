export function getCurrentPayPeriod(): { start: Date; end: Date } {
  const now = new Date()
  const cst = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }))
  const day = cst.getDay()
  const daysBack = day >= 3 ? day - 3 : day + 4
  const wed = new Date(cst); wed.setDate(cst.getDate() - daysBack); wed.setHours(0, 0, 0, 0)
  const tue = new Date(wed); tue.setDate(wed.getDate() + 6); tue.setHours(23, 59, 59, 999)
  return { start: new Date(`${wed.toISOString().split("T")[0]}T06:00:00Z`), end: new Date(`${tue.toISOString().split("T")[0]}T05:59:59Z`) }
}

export function getPreviousPayPeriod(weeksBack: number = 1): { start: Date; end: Date } {
  const c = getCurrentPayPeriod()
  const off = weeksBack * 7 * 24 * 60 * 60 * 1000
  return { start: new Date(c.start.getTime() - off), end: new Date(c.end.getTime() - off) }
}

export function formatPeriodLabel(start: Date, end: Date): string {
  const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "America/Chicago" }
  return `${start.toLocaleDateString("en-US", o)} – ${end.toLocaleDateString("en-US", { ...o, year: "numeric" })}`
}

export const TEAM_MEMBERS: Record<string, { name: string; location: string; isManager: boolean }> = {
  TMbc13IBzS8Z43AO: { name: "Clarissa Reyna", location: "CC", isManager: true },
  TMaExUyYaWYlvSqh: { name: "Alexis", location: "CC", isManager: false },
  TMCzd3unwciKEVX7: { name: "Kaylie", location: "CC", isManager: false },
  TMn7kInT8g7Vrgxi: { name: "Ashlynn", location: "CC", isManager: false },
  TMMdDDwU8WXpCZ9m: { name: "Jessy", location: "CC", isManager: false },
  TM_xI40vPph2_Cos: { name: "Mia", location: "CC", isManager: false },
  TMMJKxeQuMlMW1Dw: { name: "Melissa Cruz", location: "SA", isManager: true },
  TM5CjcvcHRXZQ4hP: { name: "Madelynn", location: "SA", isManager: false },
  TMcc0QbHuUZfgcIB: { name: "Jaylee", location: "SA", isManager: false },
  "TMfFCmgJ5RV-WCBq": { name: "Aubree", location: "SA", isManager: false },
  TMk1YstlrnPrKw8p: { name: "Kiyara", location: "SA", isManager: false },
}

export const CC_LOCATION_ID = "LTJSA6QR1HGW6"
export const SA_LOCATION_ID = "LXJYXDXWR0XZF"
