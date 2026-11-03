import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarRange, Trash2 } from "lucide-react"
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
  useBulkUpdateSurveyAssignmentsMutation,
  useCreateSurveyAssignmentsMutation,
  useDeleteSurveyAssignmentMutation,
  useSurveyFormAssignmentsQuery,
  useUpdateSurveyAssignmentMutation,
} from "@/hooks/api/survey-hooks"
import { SURVEY_FREQUENCY_OPTIONS, frequencyLabel } from "@/lib/survey"
import type {
  SurveyAssignment,
  SurveyForm,
  SurveyFrequency,
} from "@/modules/api/survey-types"

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10)
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
  const packagesQuery = useProcurementPackagesQuery({ page: 1, limit: 100 }, open)
  const createMutation = useCreateSurveyAssignmentsMutation()
  const updateMutation = useUpdateSurveyAssignmentMutation()
  const bulkUpdateMutation = useBulkUpdateSurveyAssignmentsMutation()
  const deleteMutation = useDeleteSurveyAssignmentMutation()

  const [selected, setSelected] = useState<string[]>([])
  const [frequency, setFrequency] = useState<SurveyFrequency>("WEEKLY")
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(todayIso())
  const [instructions, setInstructions] = useState("")

  const [assignmentQuery, setAssignmentQuery] = useState("")
  const [bulkSelected, setBulkSelected] = useState<string[]>([])
  const [bulkFrequency, setBulkFrequency] = useState<"" | SurveyFrequency>("")
  const [bulkStartDate, setBulkStartDate] = useState("")
  const [bulkEndDate, setBulkEndDate] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFrequency, setEditFrequency] = useState<SurveyFrequency>("WEEKLY")
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")
  const [editInstructions, setEditInstructions] = useState("")

  const assignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data],
  )
  const assignedPackageIds = useMemo(
    () => new Set(assignments.map((a) => a.procurementPackage.id)),
    [assignments],
  )
  const packages = packagesQuery.data?.items ?? []
  const availablePackages = packages.filter((pkg) => !assignedPackageIds.has(pkg.id))

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const visibleAssignments = useMemo(() => {
    const query = assignmentQuery.trim().toLowerCase()
    if (!query) return assignments
    return assignments.filter((assignment) => {
      const haystack = `${assignment.procurementPackage.name} ${assignment.tehsil.name} ${frequencyLabel(assignment.frequency)}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [assignmentQuery, assignments])

  const visibleIds = visibleAssignments.map((assignment) => assignment.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => bulkSelected.includes(id))

  useEffect(() => {
    if (open) return
    setAssignmentQuery("")
    setBulkSelected([])
    setBulkFrequency("")
    setBulkStartDate("")
    setBulkEndDate("")
    setEditingId(null)
  }, [open])

  const toggleBulk = (id: string) => {
    setBulkSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const toggleVisible = () => {
    setBulkSelected((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleIds.includes(id))
      }
      return Array.from(new Set([...prev, ...visibleIds]))
    })
  }

  const beginEdit = (assignment: SurveyAssignment) => {
    setEditingId(assignment.id)
    setEditFrequency(assignment.frequency)
    setEditStartDate(toDateInputValue(assignment.startDate))
    setEditEndDate(toDateInputValue(assignment.endDate))
    setEditInstructions(assignment.instructions ?? "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditStartDate("")
    setEditEndDate("")
    setEditInstructions("")
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

  const handleUpdate = async (assignmentId: string) => {
    if (!form) return
    if (new Date(editEndDate) < new Date(editStartDate)) {
      toast.error("End date must be on or after the start date")
      return
    }
    try {
      await updateMutation.mutateAsync({
        assignmentId,
        formId: form.id,
        input: {
          frequency: editFrequency,
          startDate: editStartDate,
          endDate: editEndDate,
          instructions: editInstructions.trim() || null,
        },
      })
      toast.success("Assignment updated")
      cancelEdit()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update assignment",
      )
    }
  }

  const handleBulkUpdate = async () => {
    if (!form) return
    if (bulkSelected.length === 0) {
      toast.error("Select at least one assignment")
      return
    }
    if (!bulkFrequency && !bulkStartDate && !bulkEndDate) {
      toast.error("Choose a frequency, a start date, or an end date")
      return
    }
    if (bulkStartDate && bulkEndDate && new Date(bulkEndDate) < new Date(bulkStartDate)) {
      toast.error("End date must be on or after the start date")
      return
    }
    try {
      await bulkUpdateMutation.mutateAsync({
        formId: form.id,
        input: {
          assignmentIds: bulkSelected,
          ...(bulkFrequency ? { frequency: bulkFrequency } : {}),
          ...(bulkStartDate ? { startDate: bulkStartDate } : {}),
          ...(bulkEndDate ? { endDate: bulkEndDate } : {}),
        },
      })
      toast.success(
        bulkSelected.length === 1
          ? "1 assignment updated"
          : `${bulkSelected.length} assignments updated`,
      )
      setBulkSelected([])
      setBulkFrequency("")
      setBulkStartDate("")
      setBulkEndDate("")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update assignments",
      )
    }
  }

  const handleDelete = async (assignmentId: string) => {
    if (!form) return
    try {
      await deleteMutation.mutateAsync({ assignmentId, formId: form.id })
      toast.success("Assignment removed")
      if (editingId === assignmentId) cancelEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove assignment")
    }
  }

  const canAssign = form?.status === "PUBLISHED"
  const isUpdating = updateMutation.isPending || bulkUpdateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Assign “{form?.title}”</DialogTitle>
          <DialogDescription>
            Assign this survey to procurement packages. Select existing assignments to
            change their frequency and dates together, or edit one package on its own.
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  Current assignments
                  <span className="ml-2 font-normal text-muted-foreground">
                    {assignments.length}
                  </span>
                </p>
              </div>

              <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="bulk-frequency">Frequency</Label>
                    <NativeSelect
                      id="bulk-frequency"
                      className="w-full"
                      value={bulkFrequency}
                      onChange={(e) =>
                        setBulkFrequency(e.target.value as "" | SurveyFrequency)
                      }
                    >
                      <NativeSelectOption value="">Keep current</NativeSelectOption>
                      {SURVEY_FREQUENCY_OPTIONS.map((option) => (
                        <NativeSelectOption key={option.value} value={option.value}>
                          {option.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="bulk-start">Start date</Label>
                    <Input
                      id="bulk-start"
                      type="date"
                      value={bulkStartDate}
                      onChange={(e) => setBulkStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="bulk-end">End date</Label>
                    <Input
                      id="bulk-end"
                      type="date"
                      value={bulkEndDate}
                      onChange={(e) => setBulkEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Blank dates stay as they are on each package. Checked packages update
                    together.
                  </p>
                  <Button
                    size="sm"
                    disabled={isUpdating || bulkSelected.length === 0}
                    onClick={() => void handleBulkUpdate()}
                  >
                    {bulkUpdateMutation.isPending
                      ? "Updating…"
                      : `Apply to ${bulkSelected.length || "selected"}`}
                  </Button>
                </div>
              </div>

              <Input
                value={assignmentQuery}
                onChange={(e) => setAssignmentQuery(e.target.value)}
                placeholder="Search packages or tehsils"
              />

              <div className="divide-y rounded-lg border">
                <label className="flex cursor-pointer items-center gap-2 bg-muted/30 px-3 py-2 text-sm">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleVisible}
                  />
                  <span>
                    {allVisibleSelected ? "Clear visible" : "Select visible"}
                    {assignmentQuery.trim()
                      ? ` (${visibleAssignments.length})`
                      : ""}
                  </span>
                </label>
                {visibleAssignments.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No assignments match that search.
                  </p>
                ) : (
                  visibleAssignments.map((assignment) => {
                    const isEditing = editingId === assignment.id
                    return (
                      <div key={assignment.id} className="space-y-3 px-3 py-2.5 text-sm">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            className="mt-1"
                            checked={bulkSelected.includes(assignment.id)}
                            onCheckedChange={() => toggleBulk(assignment.id)}
                            aria-label={`Select ${assignment.procurementPackage.name}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {assignment.procurementPackage.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.tehsil.name} ·{" "}
                              {frequencyLabel(assignment.frequency)} ·{" "}
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
                          <Badge variant="secondary">
                            {assignment.responseCount} responses
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isUpdating || deleteMutation.isPending}
                            title="Edit this assignment"
                            onClick={() =>
                              isEditing ? cancelEdit() : beginEdit(assignment)
                            }
                          >
                            <CalendarRange className="size-4" />
                          </Button>
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

                        {isEditing ? (
                          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="grid gap-1.5">
                                <Label htmlFor={`edit-frequency-${assignment.id}`}>
                                  Frequency
                                </Label>
                                <NativeSelect
                                  id={`edit-frequency-${assignment.id}`}
                                  className="w-full"
                                  value={editFrequency}
                                  onChange={(e) =>
                                    setEditFrequency(e.target.value as SurveyFrequency)
                                  }
                                >
                                  {SURVEY_FREQUENCY_OPTIONS.map((option) => (
                                    <NativeSelectOption
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </NativeSelectOption>
                                  ))}
                                </NativeSelect>
                              </div>
                              <div className="grid gap-1.5">
                                <Label htmlFor={`edit-start-${assignment.id}`}>
                                  Start date
                                </Label>
                                <Input
                                  id={`edit-start-${assignment.id}`}
                                  type="date"
                                  value={editStartDate}
                                  onChange={(e) => setEditStartDate(e.target.value)}
                                />
                              </div>
                              <div className="grid gap-1.5">
                                <Label htmlFor={`edit-end-${assignment.id}`}>
                                  End date
                                </Label>
                                <Input
                                  id={`edit-end-${assignment.id}`}
                                  type="date"
                                  value={editEndDate}
                                  onChange={(e) => setEditEndDate(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="grid gap-1.5">
                              <Label htmlFor={`edit-instructions-${assignment.id}`}>
                                Instructions (optional)
                              </Label>
                              <Textarea
                                id={`edit-instructions-${assignment.id}`}
                                rows={2}
                                value={editInstructions}
                                onChange={(e) => setEditInstructions(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                disabled={isUpdating || !editStartDate || !editEndDate}
                                onClick={() => void handleUpdate(assignment.id)}
                              >
                                {isUpdating ? "Saving…" : "Save assignment"}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })
                )}
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
