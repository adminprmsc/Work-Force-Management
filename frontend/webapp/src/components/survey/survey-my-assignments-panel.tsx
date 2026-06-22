import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  ArrowRight,
  CalendarRange,
  ClipboardCheck,
  FilePlus2,
  Inbox,
  MapPin,
} from "lucide-react"

import { DataPanel } from "@/components/common/data-panel"
import {
  ListItemsShimmer,
  ShimmerContainer,
} from "@/components/common/query-shimmer"
import { PackageBaselineDialog } from "@/components/procurement/package-baseline-dialog"
import { SurveyResponseEditor } from "@/components/survey/survey-response-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  useMySurveyAssignmentsQuery,
  useSurveyResponsesQuery,
} from "@/hooks/api/survey-hooks"
import { getQueryViewState } from "@/lib/query-view-state"
import { frequencyLabel } from "@/lib/survey"
import { cn } from "@/lib/utils"
import type {
  SurveyAssignment,
  SurveyResponse,
} from "@/modules/api/survey-types"

type WindowState = "upcoming" | "open" | "closed"

type PackageRef = {
  id: string
  name: string
}

type BaselineTarget = PackageRef & { formId: string }

function windowState(assignment: SurveyAssignment): WindowState {
  const now = new Date()
  const start = new Date(assignment.startDate)
  const end = new Date(assignment.endDate)
  end.setHours(23, 59, 59, 999)
  if (now < start) return "upcoming"
  if (now > end) return "closed"
  return "open"
}

function formatWindow(assignment: SurveyAssignment): string {
  return `${format(new Date(assignment.startDate), "dd MMM")} – ${format(new Date(assignment.endDate), "dd MMM yyyy")}`
}

function WorkflowSteps({
  pendingCount,
  assignmentCount,
}: {
  pendingCount: number
  assignmentCount: number
}) {
  const stepOneDone = assignmentCount > 0 && pendingCount === 0
  const stepTwoActive = stepOneDone

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <ol className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-5">
        <li className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              stepOneDone
                ? "bg-emerald-600 text-white"
                : "bg-primary text-primary-foreground",
            )}
          >
            {stepOneDone ? "✓" : "1"}
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium leading-snug">Package baseline</p>
            <p className="text-sm text-muted-foreground">
              Record C-ESMP plan, HSE staff, and mobilization date once per
              package.
            </p>
            {pendingCount > 0 ? (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {pendingCount} package{pendingCount === 1 ? "" : "s"} pending
              </p>
            ) : assignmentCount > 0 ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Complete for all assigned packages
              </p>
            ) : null}
          </div>
        </li>

        <Separator className="hidden sm:block" orientation="vertical" />

        <li
          className={cn(
            "flex items-start gap-3",
            !stepTwoActive && "opacity-60",
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              stepTwoActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            2
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium leading-snug">Village visits</p>
            <p className="text-sm text-muted-foreground">
              Submit the monitoring checklist for each field visit after
              mobilization is recorded.
            </p>
          </div>
        </li>
      </ol>
    </div>
  )
}

function AssignmentCard({
  assignment,
  onRecordBaseline,
  onStartSubmission,
}: {
  assignment: SurveyAssignment
  onRecordBaseline: (target: BaselineTarget) => void
  onStartSubmission: (assignment: SurveyAssignment) => void
}) {
  const state = windowState(assignment)
  const pkg = assignment.procurementPackage
  const needsBaseline =
    assignment.requiresPackageBaseline && !pkg.isMobilized
  const canSubmit =
    state === "open" &&
    (!assignment.requiresPackageBaseline || pkg.isMobilized)

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-medium leading-snug">{assignment.formTitle}</h3>
          <p
            className="line-clamp-2 text-sm text-muted-foreground"
            title={pkg.name}
          >
            {pkg.name}
          </p>
        </div>
        {needsBaseline ? (
          <Badge
            variant="outline"
            className="w-fit shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          >
            Baseline needed
          </Badge>
        ) : assignment.requiresPackageBaseline ? (
          <Badge className="w-fit shrink-0 bg-emerald-600 hover:bg-emerald-600">
            Mobilized
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="font-normal">
          {frequencyLabel(assignment.frequency)}
        </Badge>
        <span className="inline-flex items-center gap-1.5">
          <CalendarRange className="size-3.5 shrink-0" />
          {formatWindow(assignment)}
        </span>
        {state === "upcoming" ? (
          <Badge variant="outline">Upcoming</Badge>
        ) : null}
        {state === "closed" ? <Badge variant="outline">Closed</Badge> : null}
      </div>

      <div className="mt-4">
        {needsBaseline ? (
          <Button
            className="w-full sm:w-auto"
            onClick={() =>
              onRecordBaseline({
                id: pkg.id,
                name: pkg.name,
                formId: assignment.formId,
              })
            }
          >
            <ClipboardCheck className="size-4" />
            Record package baseline
          </Button>
        ) : (
          <Button
            className="w-full sm:w-auto"
            disabled={!canSubmit}
            onClick={() => onStartSubmission(assignment)}
          >
            <FilePlus2 className="size-4" />
            New submission
          </Button>
        )}
      </div>
    </article>
  )
}

function SubmissionCard({
  response,
  onOpen,
}: {
  response: SurveyResponse
  onOpen: (response: SurveyResponse) => void
}) {
  const siteLabel = response.settlement
    ? `${response.village.name} · ${response.settlement.name}`
    : response.village.name

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="font-medium leading-snug">{response.form.title}</h3>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span className="line-clamp-2" title={siteLabel}>
            {siteLabel}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Badge
          variant={response.status === "SUBMITTED" ? "default" : "secondary"}
        >
          {response.status === "SUBMITTED" ? "Submitted" : "Draft"}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => onOpen(response)}
        >
          {response.status === "SUBMITTED" ? "View" : "Continue"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </article>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Inbox
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function SurveyMyAssignmentsPanel() {
  const assignmentsQuery = useMySurveyAssignmentsQuery()
  const assignmentsView = getQueryViewState<SurveyAssignment[]>(assignmentsQuery)
  const assignments = useMemo(
    () => assignmentsView.data ?? [],
    [assignmentsView.data],
  )

  const responsesQuery = useSurveyResponsesQuery({})
  const responsesView = getQueryViewState<SurveyResponse[]>(responsesQuery)
  const responses = responsesView.data ?? []

  const [startAssignment, setStartAssignment] = useState<SurveyAssignment | null>(
    null,
  )
  const [openResponse, setOpenResponse] = useState<SurveyResponse | null>(null)
  const [baselineTarget, setBaselineTarget] = useState<BaselineTarget | null>(null)

  const baselineGatedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.requiresPackageBaseline),
    [assignments],
  )

  const pendingBaselines = useMemo(() => {
    const byId = new Map<string, PackageRef>()
    for (const assignment of baselineGatedAssignments) {
      const pkg = assignment.procurementPackage
      if (!pkg.isMobilized) {
        byId.set(pkg.id, { id: pkg.id, name: pkg.name })
      }
    }
    return [...byId.values()]
  }, [baselineGatedAssignments])

  const showWorkflow = baselineGatedAssignments.length > 0

  return (
    <div className="space-y-6">
      {showWorkflow ? (
        <WorkflowSteps
          pendingCount={pendingBaselines.length}
          assignmentCount={baselineGatedAssignments.length}
        />
      ) : null}

      <DataPanel
        title="Assigned surveys"
        description={
          showWorkflow && pendingBaselines.length > 0
            ? "Record the ESMP baseline on each package below, then start village visits."
            : "Open an assignment to start a new submission."
        }
      >
        {assignmentsView.error ? (
          <p className="text-sm text-destructive">{assignmentsView.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={assignmentsView.isInitialLoading}
            isRefreshing={assignmentsView.isRefreshing}
            shimmer={<ListItemsShimmer items={3} />}
          >
            {assignments.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onRecordBaseline={setBaselineTarget}
                    onStartSubmission={setStartAssignment}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No surveys assigned"
                description="When your tehsil is assigned village monitoring forms, they will appear here."
              />
            )}
          </ShimmerContainer>
        )}
      </DataPanel>

      <DataPanel
        title="My submissions"
        description="Drafts you can continue and surveys you have submitted."
      >
        {responsesView.error ? (
          <p className="text-sm text-destructive">{responsesView.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={responsesView.isInitialLoading}
            isRefreshing={responsesView.isRefreshing}
            shimmer={<ListItemsShimmer items={3} />}
          >
            {responses.length ? (
              <div className="space-y-3">
                {responses.map((response) => (
                  <SubmissionCard
                    key={response.id}
                    response={response}
                    onOpen={setOpenResponse}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title="No submissions yet"
                description="Your draft and submitted village monitoring forms will show up here."
              />
            )}
          </ShimmerContainer>
        )}
      </DataPanel>

      <PackageBaselineDialog
        package={baselineTarget}
        formId={baselineTarget?.formId}
        open={Boolean(baselineTarget)}
        onOpenChange={(open) => {
          if (!open) setBaselineTarget(null)
        }}
        canEdit
      />

      {startAssignment ? (
        <SurveyResponseEditor
          key={`start-${startAssignment.id}`}
          open
          onOpenChange={(open) => !open && setStartAssignment(null)}
          assignment={startAssignment}
          response={null}
        />
      ) : null}

      {openResponse ? (
        <SurveyResponseEditor
          key={`resume-${openResponse.id}`}
          open
          onOpenChange={(open) => !open && setOpenResponse(null)}
          assignment={null}
          response={openResponse}
        />
      ) : null}
    </div>
  )
}
