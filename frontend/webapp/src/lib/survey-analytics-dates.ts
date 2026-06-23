export type AnalyticsDatePreset = "all" | "30d" | "90d" | "custom"

export function formatAnalyticsDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function resolveAnalyticsDatePreset(
  preset: AnalyticsDatePreset,
): { submittedFrom: string | null; submittedTo: string | null } {
  if (preset === "all") {
    return { submittedFrom: null, submittedTo: null }
  }

  const today = new Date()
  const from = new Date(today)
  if (preset === "30d") {
    from.setDate(from.getDate() - 29)
  } else if (preset === "90d") {
    from.setDate(from.getDate() - 89)
  } else {
    return { submittedFrom: null, submittedTo: null }
  }

  return {
    submittedFrom: formatAnalyticsDate(from),
    submittedTo: formatAnalyticsDate(today),
  }
}

export function formatAnalyticsDateLabel(
  from: string | null,
  to: string | null,
): string {
  if (!from && !to) return "All time"
  if (from && to) return `${from} to ${to}`
  if (from) return `From ${from}`
  return `Through ${to}`
}

export function readAnalyticsDatePreset(
  searchParams: URLSearchParams,
): AnalyticsDatePreset {
  const preset = searchParams.get("datePreset")
  if (preset === "30d" || preset === "90d" || preset === "custom" || preset === "all") {
    return preset
  }
  return "all"
}

export function readAnalyticsDateFilter(searchParams: URLSearchParams): {
  submittedFrom: string | null
  submittedTo: string | null
} {
  const preset = readAnalyticsDatePreset(searchParams)
  if (preset === "all") {
    return { submittedFrom: null, submittedTo: null }
  }
  if (preset === "30d" || preset === "90d") {
    return resolveAnalyticsDatePreset(preset)
  }
  return {
    submittedFrom: searchParams.get("submittedFrom"),
    submittedTo: searchParams.get("submittedTo"),
  }
}
