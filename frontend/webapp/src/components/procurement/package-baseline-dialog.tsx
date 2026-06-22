import { useMemo, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

import { SurveyFieldControl } from "@/components/survey/survey-field-control"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  usePackageBaselineFormsQuery,
  usePackageFormBaselineQuery,
  useSavePackageFormBaselineMutation,
} from "@/hooks/api/procurement-hooks"
import type { ProcurementPackage } from "@/modules/api/types"
import type { SurveyFormBaselineField } from "@/modules/api/survey-types"

type PackageBaselineDialogProps = {
  package: Pick<ProcurementPackage, "id" | "name"> | null
  formId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit: boolean
}

function fieldAsSurveyField(field: SurveyFormBaselineField) {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    required: field.required,
    order: field.order,
    config: field.config,
  }
}

type BaselineFormProps = {
  packageId: string
  packageName: string
  formId: string
  canEdit: boolean
  onClose: () => void
}

function BaselineForm({
  packageId,
  packageName,
  formId,
  canEdit,
  onClose,
}: BaselineFormProps) {
  const baselineQuery = usePackageFormBaselineQuery(packageId, formId, true)
  const saveMutation = useSavePackageFormBaselineMutation()
  const baseline = baselineQuery.data

  const answerMap = useMemo(() => {
    const map = new Map<string, unknown>()
    for (const answer of baseline?.answers ?? []) {
      map.set(answer.fieldId, answer.value)
    }
    return map
  }, [baseline?.answers])

  const serverValues = useMemo(() => {
    if (!baseline) return {}
    const next: Record<string, unknown> = {}
    for (const field of baseline.fields) {
      next[field.id] = answerMap.get(field.id) ?? ""
    }
    return next
  }, [baseline, answerMap])

  const [draftOverrides, setDraftOverrides] = useState<Record<string, unknown>>({})
  const values = useMemo(
    () => ({ ...serverValues, ...draftOverrides }),
    [serverValues, draftOverrides],
  )

  async function handleSave() {
    if (!baseline) return
    try {
      await saveMutation.mutateAsync({
        packageId,
        formId,
        input: {
          answers: baseline.fields.map((field) => ({
            fieldId: field.id,
            value: values[field.id],
          })),
        },
      })
      toast.success("Package baseline saved")
      onClose()
    } catch {
      toast.error("Failed to save package baseline")
    }
  }

  if (baselineQuery.isLoading || !baseline) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  const title = baseline.baselineTitle ?? "Package baseline"
  const description =
    baseline.baselineDescription ??
    `One-time information for ${packageName} before survey submissions begin.`

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={baseline.isBaselineComplete ? "default" : "secondary"}>
            {baseline.isBaselineComplete ? "Complete" : "Incomplete"}
          </Badge>
          <Badge variant="outline">{baseline.formTitle}</Badge>
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-4">
          {baseline.fields.map((field) => {
            const locked =
              field.writeOnce && !isEmptyValue(answerMap.get(field.id))
            return (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required ? (
                    <span className="text-destructive"> *</span>
                  ) : null}
                  {field.writeOnce ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      One-time
                    </span>
                  ) : null}
                </Label>
                {field.helpText ? (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                ) : null}
                <SurveyFieldControl
                  field={fieldAsSurveyField(field)}
                  value={values[field.id]}
                  disabled={!canEdit || locked}
                  onChange={(value) =>
                    setDraftOverrides((current) => ({
                      ...current,
                      [field.id]: value,
                    }))
                  }
                />
                {locked ? (
                  <p className="text-xs text-muted-foreground">
                    This value cannot be changed once saved.
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        {baseline.updatedAt ? (
          <p className="text-xs text-muted-foreground">
            Last updated {format(new Date(baseline.updatedAt), "dd MMM yyyy HH:mm")}
            {baseline.submittedBy
              ? ` by ${baseline.submittedBy.username}`
              : ""}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {canEdit ? (
          <Button onClick={() => void handleSave()} disabled={saveMutation.isPending}>
            Save baseline
          </Button>
        ) : null}
      </DialogFooter>
    </>
  )
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function PackageBaselineDialog({
  package: pkg,
  formId: initialFormId,
  open,
  onOpenChange,
  canEdit,
}: PackageBaselineDialogProps) {
  const formsQuery = usePackageBaselineFormsQuery(pkg?.id ?? null, open && Boolean(pkg))
  const forms = useMemo(() => formsQuery.data ?? [], [formsQuery.data])
  const [manualFormId, setManualFormId] = useState<string | null>(null)

  const activeFormId = useMemo(() => {
    if (initialFormId) return initialFormId
    if (manualFormId) return manualFormId
    if (forms.length === 1) return forms[0]!.formId
    return null
  }, [initialFormId, manualFormId, forms])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Package baseline</DialogTitle>
          <DialogDescription>
            Record one-time package information before village visit submissions for{" "}
            <span className="font-medium text-foreground">{pkg?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        {formsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : forms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No village monitoring surveys with package baseline are assigned to this
            package yet.
          </p>
        ) : (
          <>
            {forms.length > 1 && !initialFormId ? (
              <div className="space-y-2">
                <Label>Survey form</Label>
                <Select
                  value={activeFormId ?? ""}
                  onValueChange={setManualFormId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select survey form" />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map((form) => (
                      <SelectItem key={form.formId} value={form.formId}>
                        {form.formTitle}
                        {form.isBaselineComplete ? " · complete" : " · pending"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {pkg && activeFormId ? (
              <BaselineForm
                key={`${pkg.id}-${activeFormId}`}
                packageId={pkg.id}
                packageName={pkg.name}
                formId={activeFormId}
                canEdit={canEdit}
                onClose={() => onOpenChange(false)}
              />
            ) : forms.length > 1 ? (
              <p className="text-sm text-muted-foreground">
                Select a survey form to record its package baseline.
              </p>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
