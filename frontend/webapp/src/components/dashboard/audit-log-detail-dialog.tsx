import { memo } from "react"
import type { ReactNode } from "react"
import { format } from "date-fns"
import { Copy } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_TONE_CLASSES,
  buildAuditMetadataSections,
  extractAuditTarget,
  formatAuditDetails,
  formatAuditSummary,
  getAuditActionTone,
} from "@/lib/audit-log"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"
import { userInitials } from "@/lib/user-display"
import { cn } from "@/lib/utils"
import type { AuditLog } from "@/modules/api/types"

type AuditLogDetailDialogProps = {
  log: AuditLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-[10rem_minmax(0,1fr)] gap-3 py-1.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{children}</dd>
    </div>
  )
}

export const AuditLogDetailDialog = memo(function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailDialogProps) {
  const target = log ? extractAuditTarget(log) : null
  const sections = log ? buildAuditMetadataSections(log.metadata) : []
  const details = log ? formatAuditDetails(log) : null

  const handleCopyPayload = async () => {
    if (!log) return
    try {
      await copyTextToClipboard(JSON.stringify(log, null, 2))
      toast.success("Event payload copied")
    } catch {
      toast.error("Failed to copy payload")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>
            {log ? formatAuditSummary(log) : "No event selected"}
          </DialogDescription>
        </DialogHeader>

        {log ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "font-medium",
                  AUDIT_TONE_CLASSES[getAuditActionTone(log.action)],
                )}
              >
                {AUDIT_ACTION_LABELS[log.action]}
              </Badge>
              <time
                className="text-xs text-muted-foreground"
                dateTime={log.createdAt}
              >
                {format(new Date(log.createdAt), "EEEE, d MMMM yyyy 'at' HH:mm:ss")}
              </time>
            </div>

            <Separator />

            <dl className="divide-y divide-border/60">
              <DetailRow label="Performed by">
                <div className="flex items-center gap-2">
                  <Avatar size="sm" className="size-6">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                      {userInitials(log.actor.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{log.actor.username}</span>
                  <span className="text-muted-foreground">
                    {log.actor.email}
                  </span>
                </div>
              </DetailRow>

              {target?.username || target?.email ? (
                <DetailRow label="Affected user">
                  <span className="font-medium">
                    {target.username ?? target.email}
                  </span>
                  {target.roleLabel ? (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {target.roleLabel}
                    </Badge>
                  ) : null}
                </DetailRow>
              ) : null}

              {target?.packageName ? (
                <DetailRow label="Package">{target.packageName}</DetailRow>
              ) : null}

              {details ? <DetailRow label="Summary">{details}</DetailRow> : null}

              <DetailRow label="Resource type">
                <span className="font-mono text-xs">{log.resourceType}</span>
              </DetailRow>

              {log.resourceId ? (
                <DetailRow label="Resource ID">
                  <span className="font-mono text-xs">{log.resourceId}</span>
                </DetailRow>
              ) : null}

              <DetailRow label="Event ID">
                <span className="font-mono text-xs">{log.id}</span>
              </DetailRow>
            </dl>

            {sections.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recorded data
                </h4>
                {sections.map((section) => (
                  <div
                    key={section.key}
                    className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
                  >
                    {section.title ? (
                      <p className="mb-1.5 text-xs font-semibold text-foreground">
                        {section.title}
                      </p>
                    ) : null}
                    <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                      {section.fields.map((field) => (
                        <div key={`${section.key}-${field.label}`} className="min-w-0">
                          <dt className="text-[11px] text-muted-foreground">
                            {field.label}
                          </dt>
                          <dd className="truncate text-sm" title={field.value}>
                            {field.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No additional data was recorded for this event.
              </p>
            )}

            <details className="rounded-lg border border-border/70 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Raw payload
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted/40 p-3 text-[11px] leading-relaxed">
                {JSON.stringify(log.metadata ?? {}, null, 2)}
              </pre>
            </details>
          </div>
        ) : null}

        <DialogFooter className="mt-4" showCloseButton>
          <Button
            variant="outline"
            onClick={() => void handleCopyPayload()}
            disabled={!log}
          >
            <Copy className="mr-2 size-4" />
            Copy payload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
