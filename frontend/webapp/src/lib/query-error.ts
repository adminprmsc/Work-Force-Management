export function getQueryErrorMessage(error: unknown): string | null {
  if (!error) return null
  return error instanceof Error ? error.message : "Request failed"
}
