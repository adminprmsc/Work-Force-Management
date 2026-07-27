import { useState } from "react"
import { format } from "date-fns"
import {
  ClipboardList,
  MapPin,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { SurveyAttachmentDisplay } from "@/components/survey/survey-attachment-display"
import { SurveyResponsesMap } from "@/components/survey/survey-responses-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  useAcceptSurveyResponseMutation,
  useRejectSurveyResponseMutation,
  useRevertSurveyResponseMutation,
} from "@/hooks/api/survey-hooks"
import { answerableFields, formatAnswerValue } from "@/lib/survey-answers"
import { resolveVisibleFieldIds } from "@/lib/survey-field-visibility"
import {
  canReviewSurveyResponses,
  fieldIsPresentational,
  responseStatusBadgeVariant,
  responseStatusLabel,
} from "@/lib/survey"
import { useAuth } from "@/modules/auth/use-auth"
import type {
  SurveyResponse,
  SurveyResponseReviewAction,
  SurveyField,
} from "@/modules/api/survey-types"

type SurveyResponseDetailProps = {
  response: SurveyResponse
  onReviewed?: (response: SurveyResponse) => void
}

type ReviewMode = "accept" | "reject" | "revert" | null

function reviewActionLabel(action: SurveyResponseReviewAction): string {
  switch (action) {
    case "SUBMITTED":
      return "Submitted"
    case "RESUBMITTED":
      return "Resubmitted"
    case "SAVED":
      return "Saved draft"
    case "ACCEPTED":
      return "Accepted"
    case "REJECTED":
      return "Rejected"
    case "REVERTED":
      return "Reverted to author"
    default:
      return action
  }
}

function siteLabel(response: SurveyResponse): string {
  return response.settlement
    ? `${response.village.name} · ${response.settlement.name}`
    : response.village.name
}

function MetaRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  )
}

function AnswerField({
  field,
  value,
}: {
  field: SurveyField
  value: unknown
}) {
  if (fieldIsPresentational(field.type)) {
    return (
      <div className="pt-2">
        <p className="text-sm font-semibold tracking-tight">{field.label}</p>
        <Separator className="mt-2" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-background/60 p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {field.label}
      </p>
      <div className="mt-2 text-sm leading-relaxed">
        {field.type === "FILE" || field.type === "IMAGE" ? (
          <SurveyAttachmentDisplay field={field} value={value} />
        ) : (
          <p className="font-medium">{formatAnswerValue(field, value)}</p>
        )}
      </div>
    </div>
  )
}

export function SurveyResponseDetail({
  response,
  onReviewed,
}: SurveyResponseDetailProps) {
  const { user } = useAuth()
  const canReview = user ? canReviewSurveyResponses(user.role) : false
  const acceptMutation = useAcceptSurveyResponseMutation()
  const rejectMutation = useRejectSurveyResponseMutation()
  const revertMutation = useRevertSurveyResponseMutation()

  const [reviewMode, setReviewMode] = useState<ReviewMode>(null)
  const [remarks, setRemarks] = useState("")

  const fields = response.formRevision.fields
  const answerMap = new Map(
    response.answers.map((answer) => [answer.fieldId, answer.value]),
  )
  const answerRecord = Object.fromEntries(answerMap)
  const visibleFieldIds = resolveVisibleFieldIds(fields, answerRecord)
  const showReviewActions = canReview && response.status === "SUBMITTED"

  const closeReview = () => {
    setReviewMode(null)
    setRemarks("")
  }

  const runReview = async () => {
    if (!reviewMode) return
    const trimmed = remarks.trim()
    if ((reviewMode === "reject" || reviewMode === "revert") && !trimmed) {
      toast.error("Remarks are required for reject and revert actions")
      return
    }

    try {
      let updated: SurveyResponse
      if (reviewMode === "accept") {
        updated = await acceptMutation.mutateAsync({
          id: response.id,
          input: { remarks: trimmed || null },
        })
        toast.success("Response accepted")
      } else if (reviewMode === "reject") {
        updated = await rejectMutation.mutateAsync({
          id: response.id,
          input: { remarks: trimmed },
        })
        toast.success("Response rejected")
      } else {
        updated = await revertMutation.mutateAsync({
          id: response.id,
          input: { remarks: trimmed },
        })
        toast.success("Response reverted to author")
      }
      onReviewed?.(updated)
      closeReview()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Review action failed",
      )
    }
  }

  const isReviewing =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    revertMutation.isPending

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {response.reviewRemarks && response.status !== "SUBMITTED" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                Reviewer remarks
              </p>
              <p className="mt-1 text-amber-800 dark:text-amber-100">
                {response.reviewRemarks}
              </p>
            </div>
          ) : null}

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4 text-primary" />
                Submission answers
              </CardTitle>
              <CardDescription>
                Responses captured for form version {response.formRevision.version}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.length === 0 || answerableFields(fields).length === 0 ? (
                <p className="text-sm text-muted-foreground">No answers recorded.</p>
              ) : (
                fields.map((field) =>
                  visibleFieldIds.has(field.id) ? (
                  <AnswerField
                    key={field.id}
                    field={field}
                    value={answerMap.get(field.id)}
                  />
                  ) : null,
                )
              )}
            </CardContent>
          </Card>

          {response.submittedLocation ? (
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-4 text-primary" />
                  Submission GPS location
                </CardTitle>
                <CardDescription>
                  Captured when the tehsil RA submitted this visit from the field.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/20 px-4 py-3 font-mono text-xs">
                  {response.submittedLocation.latitude.toFixed(6)},{" "}
                  {response.submittedLocation.longitude.toFixed(6)}
                  {response.submittedLocation.accuracyMeters != null
                    ? ` · ±${Math.round(response.submittedLocation.accuracyMeters)} m`
                    : ""}
                  {response.submittedLocation.capturedAt ? (
                    <p className="mt-1 font-sans text-muted-foreground">
                      GPS captured{" "}
                      {format(
                        new Date(response.submittedLocation.capturedAt),
                        "dd MMM yyyy, HH:mm",
                      )}
                    </p>
                  ) : null}
                </div>
                <SurveyResponsesMap
                  responses={[response]}
                  compact
                  className="overflow-hidden rounded-lg"
                />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="size-4 text-primary" />
                Submission details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={responseStatusBadgeVariant(response.status)}>
                  {responseStatusLabel(response.status)}
                </Badge>
              </div>
              <MetaRow label="Tehsil" value={response.tehsil.name} />
              <MetaRow label="Site" value={siteLabel(response)} />
              <MetaRow label="Respondent" value={response.respondent.username} />
              <MetaRow
                label="Form version"
                value={`Version ${response.formRevision.version}`}
              />
              <Separator />
              <MetaRow
                label="Submitted"
                value={
                  response.submittedAt
                    ? format(new Date(response.submittedAt), "dd MMM yyyy, HH:mm")
                    : null
                }
              />
              <MetaRow
                label="Started"
                value={format(new Date(response.createdAt), "dd MMM yyyy, HH:mm")}
              />
              <MetaRow
                label="Last edited"
                value={
                  response.lastEditedAt
                    ? format(new Date(response.lastEditedAt), "dd MMM yyyy, HH:mm")
                    : null
                }
              />
            </CardContent>
            {showReviewActions ? (
              <CardFooter className="flex-col items-stretch gap-3">
                <p className="text-sm text-muted-foreground">
                  Review this submission before it appears in dashboards.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setReviewMode("revert")}
                  >
                    Revert
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setReviewMode("reject")}
                  >
                    Reject
                  </Button>
                  <Button className="flex-1" onClick={() => setReviewMode("accept")}>
                    Accept
                  </Button>
                </div>
              </CardFooter>
            ) : null}
          </Card>

          {response.reviewEvents.length ? (
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Audit trail</CardTitle>
                <CardDescription>
                  Review and submission history for this response.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetaRow
                  label="Reviewed"
                  value={
                    response.reviewedAt
                      ? format(new Date(response.reviewedAt), "dd MMM yyyy, HH:mm")
                      : null
                  }
                />
                <MetaRow
                  label="Accepted"
                  value={
                    response.acceptedAt
                      ? `${format(new Date(response.acceptedAt), "dd MMM yyyy, HH:mm")}${
                          response.acceptedBy
                            ? ` · ${response.acceptedBy.username}`
                            : ""
                        }`
                      : null
                  }
                />
                <MetaRow
                  label="Rejected"
                  value={
                    response.rejectedAt
                      ? `${format(new Date(response.rejectedAt), "dd MMM yyyy, HH:mm")}${
                          response.rejectedBy
                            ? ` · ${response.rejectedBy.username}`
                            : ""
                        }`
                      : null
                  }
                />
                <MetaRow
                  label="Reverted"
                  value={
                    response.revertedAt
                      ? `${format(new Date(response.revertedAt), "dd MMM yyyy, HH:mm")}${
                          response.revertedBy
                            ? ` · ${response.revertedBy.username}`
                            : ""
                        }`
                      : null
                  }
                />
                <Separator />
                <ul className="space-y-2">
                  {response.reviewEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                    >
                      <div className="flex justify-between gap-2 font-medium">
                        <span>{reviewActionLabel(event.action)}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(event.createdAt), "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-muted-foreground">
                        {event.actor.username}
                      </p>
                      {event.remarks ? (
                        <p className="mt-1 text-foreground">{event.remarks}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>

      <Dialog open={reviewMode !== null} onOpenChange={(o) => !o && closeReview()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewMode === "accept"
                ? "Accept response"
                : reviewMode === "reject"
                  ? "Reject response"
                  : "Revert to author"}
            </DialogTitle>
            <DialogDescription>
              {reviewMode === "accept"
                ? "This response will count toward dashboards and package budgets."
                : reviewMode === "reject"
                  ? "The author cannot edit a rejected response. Remarks are required."
                  : "The tehsil RA can edit and resubmit. Remarks are required."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="review-remarks">
              Remarks{reviewMode !== "accept" ? " (required)" : " (optional)"}
            </Label>
            <Textarea
              id="review-remarks"
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Explain your decision for the audit trail…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReview} disabled={isReviewing}>
              Cancel
            </Button>
            <Button onClick={runReview} disabled={isReviewing}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
