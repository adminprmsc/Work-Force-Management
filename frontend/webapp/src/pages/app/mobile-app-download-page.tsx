import { Download, Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePublicLatestMobileAppQuery } from "@/hooks/api"
import { publicLatestMobileAppDownloadUrl } from "@/modules/api/mobile-app-api"

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function MobileAppDownloadPage() {
  const latestQuery = usePublicLatestMobileAppQuery()
  const downloadUrl = publicLatestMobileAppDownloadUrl()
  const release = latestQuery.data

  return (
    <div className="min-h-svh bg-muted/30 px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Smartphone className="size-6" />
            </div>
            <CardTitle>ESMS RA Android app</CardTitle>
            <CardDescription>
              Download the latest official build for tehsil RA field work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestQuery.isLoading ? (
              <p className="text-center text-sm text-muted-foreground">
                Checking for the latest version…
              </p>
            ) : latestQuery.isError || !release ? (
              <p className="text-center text-sm text-muted-foreground">
                No app release is available yet. Ask Head Office to publish an APK
                from App management.
              </p>
            ) : (
              <>
                <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                  <p className="font-medium">Version {release.versionName}</p>
                  <p className="mt-1 text-muted-foreground">
                    Build {release.versionCode} · {formatBytes(release.sizeBytes)} ·{" "}
                    {release.fileName}
                  </p>
                  {release.releaseNotes ? (
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                      {release.releaseNotes}
                    </p>
                  ) : null}
                </div>

                <Button className="w-full" size="lg" asChild>
                  <a href={downloadUrl}>
                    <Download className="size-4" />
                    Download APK
                  </a>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  On Android you may need to allow installs from this browser. Use
                  only this official download link.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
