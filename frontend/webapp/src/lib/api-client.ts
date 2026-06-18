const DEFAULT_API_BASE_URL = "http://localhost:3001/api"

export function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_API_BASE_URL
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "")
  if (!text) return `Request failed (${res.status})`

  try {
    const json = JSON.parse(text) as { message?: string | string[] }
    if (json.message) {
      return Array.isArray(json.message) ? json.message.join(", ") : json.message
    }
  } catch {
    // fall through
  }

  return text
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = init

  const res = await fetch(`${apiBaseUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}
