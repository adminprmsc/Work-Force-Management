export type MobileAppRelease = {
  id: string
  versionName: string
  versionCode: number
  fileName: string
  mimeType: string
  sizeBytes: number
  releaseNotes: string | null
  isLatest: boolean
  uploadedById: string
  createdAt: string
}

export type PublicMobileAppRelease = {
  versionName: string
  versionCode: number
  fileName: string
  sizeBytes: number
  releaseNotes: string | null
  publishedAt: string
}

export type UploadMobileAppReleaseInput = {
  versionName: string
  versionCode: number
  releaseNotes?: string | null
  file: File
}
