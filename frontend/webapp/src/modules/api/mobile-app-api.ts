import { apiBaseUrl } from "@/lib/api-client"
import type {
  MobileAppRelease,
  PublicMobileAppRelease,
  UploadMobileAppReleaseInput,
} from "./mobile-app-types"

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

export function listMobileAppReleases(token: string): Promise<MobileAppRelease[]> {
  return fetch(`${apiBaseUrl()}/mobile-app/releases`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (res) => {
    if (!res.ok) throw new Error(await parseError(res))
    return res.json() as Promise<MobileAppRelease[]>
  })
}

export function uploadMobileAppRelease(
  token: string,
  input: UploadMobileAppReleaseInput,
): Promise<MobileAppRelease> {
  const formData = new FormData()
  formData.append("file", input.file)
  formData.append("versionName", input.versionName)
  formData.append("versionCode", String(input.versionCode))
  if (input.releaseNotes != null && input.releaseNotes !== "") {
    formData.append("releaseNotes", input.releaseNotes)
  }

  return fetch(`${apiBaseUrl()}/mobile-app/releases`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async (res) => {
    if (!res.ok) throw new Error(await parseError(res))
    return res.json() as Promise<MobileAppRelease>
  })
}

/** Unauthenticated — for public download page and shareable links. */
export function getPublicLatestMobileApp(): Promise<PublicMobileAppRelease> {
  return fetch(`${apiBaseUrl()}/mobile-app/public/latest`, {
    method: "GET",
  }).then(async (res) => {
    if (!res.ok) throw new Error(await parseError(res))
    return res.json() as Promise<PublicMobileAppRelease>
  })
}

export function publicLatestMobileAppDownloadUrl(): string {
  return `${apiBaseUrl()}/mobile-app/public/latest/download`
}
