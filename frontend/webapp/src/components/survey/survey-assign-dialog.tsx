import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PackageBaselineRequirements } from "@/components/compliance/package-baseline-requirements"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useProcurementPackagesQuery } from "@/hooks/api/procurement-hooks"
import {
  useCreateSurveyAssignmentsMutation,
  useDeleteSurveyAssignmentMutation,
  useSurveyFormAssignmentsQuery,
} from "@/hooks/api/survey-hooks"
import { SURVEY_FREQUENCY_OPTIONS, frequencyLabel } from "@/lib/survey"
import type { SurveyForm, SurveyFrequency } from "@/modules/api/survey-types"

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

type SurveyAssignDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: SurveyForm | null
}

export function SurveyAssignDialog({
  open,
  onOpenChange,
  form,
}: SurveyAssignDialogProps) {
  const assignmentsQuery = useSurveyFormAssignmentsQuery(form?.id ?? null, open)
  const packagesQuery = useProcurementPackagesQuery(open)
  const createMutation = useCreateSurveyAssignmentsMutation()
  const deleteMutation = useDeleteSurveyAssignmentMutation()

  const [selected, setSelected] = useState<string[]>([])
  const [frequency, setFrequency] = useState<SurveyFrequency>("WEEKLY")
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(todayIso())
  const [instructions, setInstructions] = useState("")

  const assignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data],
  )
  const assignedPackageIds = useMemo(
    () => new Set(assignments.map((a) => a.procurementPackage.id)),
    [assignments],
  )
  const packages = packagesQuery.data ?? []
  const availablePackages = packages.filter((pkg) => !assignedPackageIds.has(pkg.id))

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleAssign = async () => {
    if (!form) return
    if (selected.length === 0) {
      toast.error("Select at least one procurement package")
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after the start date")
      return
    }
    try {
      await createMutation.mutateAsync({
        formId: form.id,
        input: {
          procurementPackageIds: selected,
          frequency,
          startDate,
          endDate,
          instructions: instructions.trim() || null,
        },
      })
      toast.success("Survey assigned")
      setSelected([])
      setInstructions("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign survey")
    }
  }

  const handleDelete = async (assignmentId: string) => {
    if (!form) return
    try {
      await deleteMutation.mutateAsync({ assignmentId, formId: form.id })
      toast.success("Assignment removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove assignment")
    }
  }

  const canAssign = form?.status === "PUBLISHED"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Assign “{form?.title}”</DialogTitle>
          <DialogDescription>
            Assign this survey to procurement packages. Each package’s tehsil RA will be
            asked to submit it on the schedule you set.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {form?.requiresPackageBaseline ? (
            <PackageBaselineRequirements
              variant="compact"
              title="Two-step rollout"
              description="After assigning this form, the tehsil RA must complete the package baseline below on each package before submissions open."
              fields={form.baselineFields}
            />
          ) : null}

          {assignments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Current assignments</p>
              <div className="divide-y rounded-lg border">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {assignment.procurementPackage.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.tehsil.name} · {frequencyLabel(assignment.frequency)} ·{" "}
                        {format(new Date(assignment.startDate), "dd MMM yyyy")} –{" "}
                        {format(new Date(assignment.endDate), "dd MMM yyyy")}
                      </p>
                      {form?.requiresPackageBaseline ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Baseline:{" "}
                          {assignment.procurementPackage.isBaselineComplete ? (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              complete
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">
                              pending on package
                            </span>
                          )}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="secondary">{assignment.responseCount} responses</Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={
                        deleteMutation.isPending || assignment.responseCount > 0
                      }
                      title={
                        assignment.responseCount > 0
                          ? "Has responses — cannot remove"
                          : "Remove assignment"
                      }
                      onClick={() => void handleDelete(assignment.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          ) : null}

          {!canAssign ? (
            <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              Publish this form before assigning it to packages.
            </p>
          ) : (
            <>
              <div className="grid gap-2">
                <Label>Procurement packages</Label>
                {availablePackages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No more packages available to assign.
                  </p>
                ) : (
                  <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border p-2">
                    {availablePackages.map((pkg) => (
                      <label
                        key={pkg.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
                      >
                        <Checkbox
                          checked={selected.includes(pkg.id)}
                          onCheckedChange={() => toggle(pkg.id)}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm">{pkg.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {pkg.tehsil.displayName ?? pkg.tehsil.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label>Frequency</Label>
                  <NativeSelect
                    className="w-full"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as SurveyFrequency)}
                  >
                    {SURVEY_FREQUENCY_OPTIONS.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="assign-start">Start date</Label>
                  <Input
                    id="assign-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="assign-end">End date</Label>
                  <Input
                    id="assign-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="assign-instructions">Instructions (optional)</Label>
                <Textarea
                  id="assign-instructions"
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Notes shown to the RA when filling this survey"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canAssign ? (
            <Button
              onClick={() => void handleAssign()}
              disabled={createMutation.isPending || selected.length === 0}
            >
              {createMutation.isPending
                ? "Assigning…"
                : `Assign ${selected.length || ""}`.trim()}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
