import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Check, Copy, Download, Smartphone, Upload } from "lucide-react"
import { toast } from "sonner"

import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  useMobileAppReleasesQuery,
  useUploadMobileAppReleaseMutation,
} from "@/hooks/api"
import { publicLatestMobileAppDownloadUrl } from "@/modules/api/mobile-app-api"
import { getQueryViewState } from "@/lib/query-view-state"

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function sharePageUrl(): string {
  return `${window.location.origin}/download/android`
}

export function AppManagementPanel() {
  const releasesQuery = useMobileAppReleasesQuery()
  const uploadMutation = useUploadMobileAppReleaseMutation()

  const [versionName, setVersionName] = useState("")
  const [versionCode, setVersionCode] = useState("")
  const [releaseNotes, setReleaseNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const releases = releasesQuery.data ?? []
  const latest = useMemo(
    () => releases.find((r) => r.isLatest) ?? releases[0] ?? null,
    [releases],
  )
  const queryView = getQueryViewState(releasesQuery)

  const pageUrl = sharePageUrl()
  const apiDownloadUrl = publicLatestMobileAppDownloadUrl()

  const copyLink = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedKey(key)
      toast.success("Link copied")
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000)
    } catch {
      toast.error("Could not copy link")
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select an .apk file")
      return
    }
    if (!versionName.trim()) {
      toast.error("Enter a version name (e.g. 1.2.0)")
      return
    }
    const code = Number(versionCode)
    if (!Number.isInteger(code) || code < 1) {
      toast.error("Enter a positive integer version code")
      return
    }
    if (!file.name.toLowerCase().endsWith(".apk")) {
      toast.error("Only .apk files are accepted")
      return
    }

    try {
      await uploadMutation.mutateAsync({
        versionName: versionName.trim(),
        versionCode: code,
        releaseNotes: releaseNotes.trim() || null,
        file,
      })
      toast.success(`Published v${versionName.trim()} as latest`)
      setVersionName("")
      setVersionCode("")
      setReleaseNotes("")
      setFile(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">App management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload the latest RA mobile APK and share a public download link with tehsil
          field users. No login is required to download.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="size-4" />
              Latest release
            </CardTitle>
            <CardDescription>
              Share either the web page or the direct download API URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latest ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>v{latest.versionName}</Badge>
                  <span className="text-xs text-muted-foreground">
                    code {latest.versionCode}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(latest.sizeBytes)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(latest.createdAt), "d MMM yyyy, HH:mm")}
                  </span>
                </div>
                {latest.releaseNotes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {latest.releaseNotes}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <Label>Shareable page</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={pageUrl} className="font-mono text-xs" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => void copyLink("page", pageUrl)}
                      title="Copy page link"
                    >
                      {copiedKey === "page" ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Direct download URL</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={apiDownloadUrl}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => void copyLink("api", apiDownloadUrl)}
                      title="Copy direct download link"
                    >
                      {copiedKey === "api" ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      asChild
                      title="Download latest APK"
                    >
                      <a href={apiDownloadUrl}>
                        <Download className="size-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No APK published yet. Upload the first release to generate shareable
                links.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-4" />
              Publish new APK
            </CardTitle>
            <CardDescription>
              Each upload becomes the current latest. Use a higher version code than
              previous builds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="apk-version-name">Version name</Label>
                <Input
                  id="apk-version-name"
                  placeholder="1.2.0"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="apk-version-code">Version code</Label>
                <Input
                  id="apk-version-code"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="12"
                  value={versionCode}
                  onChange={(e) => setVersionCode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="apk-file">APK file</Label>
              <Input
                id="apk-file"
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <p className="text-xs text-muted-foreground">
                  {file.name} · {formatBytes(file.size)}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="apk-notes">Release notes (optional)</Label>
              <Textarea
                id="apk-notes"
                rows={3}
                placeholder="What changed in this build"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={() => void handleUpload()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading…" : "Publish as latest"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Release history</CardTitle>
          <CardDescription>Previously published builds (latest is active for download).</CardDescription>
        </CardHeader>
        <CardContent>
          <ShimmerContainer
            isLoading={queryView.isInitialLoading}
            shimmer={<TableRowsShimmer rows={4} columns={5} />}
          >
            {releases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No releases yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {releases.map((release) => (
                    <TableRow key={release.id}>
                      <TableCell className="font-medium">
                        v{release.versionName}
                        <div className="text-xs text-muted-foreground truncate max-w-[14rem]">
                          {release.fileName}
                        </div>
                      </TableCell>
                      <TableCell>{release.versionCode}</TableCell>
                      <TableCell>{formatBytes(release.sizeBytes)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(release.createdAt), "d MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell>
                        {release.isLatest ? (
                          <Badge>Latest</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Archived</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ShimmerContainer>
        </CardContent>
      </Card>
    </div>
  )
}
