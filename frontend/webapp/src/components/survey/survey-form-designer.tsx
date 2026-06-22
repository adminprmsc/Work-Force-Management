import { useState } from "react"
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { PackageBaselineRequirements } from "@/components/compliance/package-baseline-requirements"
import { SurveyBaselineFieldsSection } from "@/components/survey/survey-baseline-fields-section"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateSurveyFormMutation,
  useUpdateSurveyFormMutation,
} from "@/hooks/api/survey-hooks"
import { SURVEY_FIELD_META, fieldHasOptions, fieldMeta } from "@/lib/survey"
import {
  BUDGET_EFFECT_LABELS,
  PACKAGE_FIELD_REFERENCE_LABELS,
  packageReferencesForFieldType,
} from "@/lib/package-field-reference"
import {
  baselineDraftFromField,
  baselineDraftToInput,
  type BaselineFieldDraft,
} from "@/lib/survey-baseline-draft"
import { cn } from "@/lib/utils"
import type {
  PackageFieldReference,
  SurveyField,
  SurveyFieldBudgetEffect,
  SurveyFieldInput,
  SurveyFieldType,
  SurveyForm,
} from "@/modules/api/survey-types"

type OptionDraft = { key: string; label: string }

type FieldDraft = {
  key: string
  type: SurveyFieldType
  label: string
  helpText: string
  required: boolean
  options: OptionDraft[]
  min: string
  max: string
  integer: boolean
  maxLength: string
  packageReference: PackageFieldReference | ""
  budgetBehavior:
    | ""
    | PackageFieldReference
    | "DEDUCT"
    | "ADD"
    | "computedRemaining"
    | "computedVisitDeductions"
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function budgetBehaviorFromField(field: SurveyField): FieldDraft["budgetBehavior"] {
  const config = field.config ?? {}
  if (config.packageReference) return config.packageReference
  if (config.computedRemainingBudget) return "computedRemaining"
  if (config.computedVisitDeductions) return "computedVisitDeductions"
  if (config.budgetEffect) return config.budgetEffect
  return ""
}

function draftFromField(field: SurveyField): FieldDraft {
  const config = field.config ?? {}
  return {
    key: uid(),
    type: field.type,
    label: field.label,
    helpText: field.helpText ?? "",
    required: field.required,
    options: (config.options ?? []).map((option) => ({
      key: uid(),
      label: option.label,
    })),
    min: config.min !== undefined ? String(config.min) : "",
    max: config.max !== undefined ? String(config.max) : "",
    integer: Boolean(config.integer),
    maxLength: config.maxLength !== undefined ? String(config.maxLength) : "",
    packageReference: config.packageReference ?? "",
    budgetBehavior: budgetBehaviorFromField(field),
  }
}

function emptyDraft(type: SurveyFieldType): FieldDraft {
  return {
    key: uid(),
    type,
    label: "",
    helpText: "",
    required: false,
    options: fieldHasOptions(type)
      ? [
          { key: uid(), label: "Option 1" },
          { key: uid(), label: "Option 2" },
        ]
      : [],
    min: "",
    max: "",
    integer: false,
    maxLength: "",
    packageReference: "",
    budgetBehavior: "",
  }
}

function toFieldInput(draft: FieldDraft, index: number): SurveyFieldInput {
  const meta = fieldMeta(draft.type)
  let config: SurveyFieldInput["config"] = null
  const behavior = draft.budgetBehavior

  if (behavior === "DEDUCT" || behavior === "ADD") {
    config = { budgetEffect: behavior as SurveyFieldBudgetEffect }
  } else if (behavior === "computedRemaining") {
    config = { computedRemainingBudget: true, readOnly: true }
  } else if (behavior === "computedVisitDeductions") {
    config = { computedVisitDeductions: true, readOnly: true }
  } else if (behavior) {
    config = {
      packageReference: behavior as PackageFieldReference,
      readOnly: true,
      snapshotOnSubmit: true,
    }
  } else if (meta.hasOptions) {
    const options = draft.options
      .map((option) => option.label.trim())
      .filter((label) => label.length > 0)
      .map((label) => ({ value: label, label }))
    config = { options }
  } else if (draft.type === "NUMBER") {
    const next: NonNullable<SurveyFieldInput["config"]> = {}
    if (draft.min.trim() !== "") next.min = Number(draft.min)
    if (draft.max.trim() !== "") next.max = Number(draft.max)
    if (draft.integer) next.integer = true
    config = Object.keys(next).length > 0 ? next : null
  } else if (draft.type === "TEXT" || draft.type === "PARAGRAPH") {
    if (draft.maxLength.trim() !== "") {
      config = { maxLength: Number(draft.maxLength) }
    }
  }

  return {
    type: draft.type,
    label: draft.label.trim(),
    helpText: draft.helpText.trim() || null,
    required: behavior
      ? false
      : meta.presentational
        ? false
        : draft.required,
    order: index,
    config,
  }
}

type SurveyFormDesignerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: SurveyForm | null
  /** Published forms: only name and description can change. */
  fieldsLocked?: boolean
}

export function SurveyFormDesigner({
  open,
  onOpenChange,
  form,
  fieldsLocked = false,
}: SurveyFormDesignerProps) {
  const isEdit = Boolean(form)
  const createMutation = useCreateSurveyFormMutation()
  const updateMutation = useUpdateSurveyFormMutation()
  const saving = createMutation.isPending || updateMutation.isPending

  const [title, setTitle] = useState(() => form?.title ?? "")
  const [description, setDescription] = useState(() => form?.description ?? "")
  const [requiresPackageBaseline, setRequiresPackageBaseline] = useState(
    () => form?.requiresPackageBaseline ?? false,
  )
  const [baselineTitle, setBaselineTitle] = useState(
    () => form?.baselineTitle ?? "Package baseline",
  )
  const [baselineDescription, setBaselineDescription] = useState(
    () => form?.baselineDescription ?? "",
  )
  const [baselineFields, setBaselineFields] = useState<BaselineFieldDraft[]>(() =>
    (form?.baselineFields ?? []).map(baselineDraftFromField),
  )
  const [fields, setFields] = useState<FieldDraft[]>(() =>
    (form?.fields ?? []).map(draftFromField),
  )

  const addField = (type: SurveyFieldType) => {
    setFields((prev) => [...prev, emptyDraft(type)])
  }

  const updateField = (key: string, patch: Partial<FieldDraft>) => {
    setFields((prev) =>
      prev.map((field) => (field.key === key ? { ...field, ...patch } : field)),
    )
  }

  const removeField = (key: string) => {
    setFields((prev) => prev.filter((field) => field.key !== key))
  }

  const moveField = (index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSave = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error("Form name is required")
      return
    }
    for (const field of fields) {
      if (!field.label.trim()) {
        toast.error("Every field needs a label")
        return
      }
      if (fieldHasOptions(field.type)) {
        const valid = field.options.filter((o) => o.label.trim().length > 0)
        if (valid.length === 0) {
          toast.error(`"${field.label || "Choice field"}" needs at least one option`)
          return
        }
      }
    }

    const payloadFields = fields.map((field, index) => toFieldInput(field, index))

    const payloadBaselineFields = baselineFields.map((field, index) =>
      baselineDraftToInput(field, index),
    )

    try {
      if (form) {
        await updateMutation.mutateAsync({
          id: form.id,
          input: {
            title: trimmedTitle,
            description: description.trim() || null,
            ...(fieldsLocked
              ? {}
              : {
                  fields: payloadFields,
                  requiresPackageBaseline,
                  baselineTitle: baselineTitle.trim() || null,
                  baselineDescription: baselineDescription.trim() || null,
                  baselineFields: payloadBaselineFields,
                }),
          },
        })
        toast.success(fieldsLocked ? "Form details updated" : "Form updated")
      } else {
        await createMutation.mutateAsync({
          title: trimmedTitle,
          description: description.trim() || null,
          requiresPackageBaseline,
          baselineTitle: baselineTitle.trim() || null,
          baselineDescription: baselineDescription.trim() || null,
          fields: payloadFields,
          baselineFields: requiresPackageBaseline ? payloadBaselineFields : [],
        })
        toast.success("Draft form created")
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save form")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>
            {isEdit
              ? fieldsLocked
                ? "Edit form details"
                : "Edit form"
              : "Create form"}
          </DialogTitle>
          <DialogDescription>
            {fieldsLocked
              ? "Update the form name or description. Archive the form first to add or change fields."
              : "Build the questionnaire RAs will fill during site visits. Draft and archived forms can be edited freely before publishing."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-[220px_1fr]">
          {!fieldsLocked ? (
          <aside className="border-b bg-muted/30 p-4 md:border-r md:border-b-0">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Add field
            </p>
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
              {SURVEY_FIELD_META.map((meta) => {
                const Icon = meta.icon
                return (
                  <Button
                    key={meta.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => addField(meta.type)}
                  >
                    <Icon className="mr-2 size-4" />
                    {meta.label}
                  </Button>
                )
              })}
            </div>
          </aside>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="grid gap-2">
              <Label htmlFor="survey-form-title">Form name</Label>
              <Input
                id="survey-form-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Resettlement site visit survey"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="survey-form-description">Description (optional)</Label>
              <Textarea
                id="survey-form-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Guidance for the RA filling this form"
                rows={2}
              />
            </div>

            <Separator />

            {!fieldsLocked ? (
              <div className="space-y-3 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="requires-baseline" className="text-base">
                      Village monitoring form
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable when repeat submissions need one-time package baseline
                      fields before RAs can start.
                    </p>
                  </div>
                  <Switch
                    id="requires-baseline"
                    checked={requiresPackageBaseline}
                    onCheckedChange={setRequiresPackageBaseline}
                  />
                </div>
                {requiresPackageBaseline ? (
                  <PackageBaselineRequirements
                    variant="compact"
                    title="Required before submissions"
                    description="RAs must complete these one-time fields on the procurement package."
                    fields={baselineFields.map((field, index) => ({
                      id: field.key,
                      type: field.type,
                      label: field.label || `Field ${index + 1}`,
                      helpText: field.helpText || null,
                      required: field.required,
                      writeOnce: field.writeOnce,
                      order: index,
                      config: null,
                    }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Standalone survey — no package baseline gate. Submissions can
                    start as soon as the form is assigned.
                  </p>
                )}
              </div>
            ) : form?.requiresPackageBaseline ? (
              <PackageBaselineRequirements
                variant="compact"
                fields={form.baselineFields}
              />
            ) : null}

            {!fieldsLocked && requiresPackageBaseline ? (
              <>
                <Separator />
                <SurveyBaselineFieldsSection
                  fields={baselineFields}
                  baselineTitle={baselineTitle}
                  baselineDescription={baselineDescription}
                  onFieldsChange={setBaselineFields}
                  onBaselineTitleChange={setBaselineTitle}
                  onBaselineDescriptionChange={setBaselineDescription}
                />
              </>
            ) : null}

            <Separator />

            {fieldsLocked ? (
              <p className="text-sm text-muted-foreground">
                Fields are locked while the form is published. Archive it to add or
                change questions, then republish.
              </p>
            ) : null}

            {fields.length === 0 && !fieldsLocked ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No fields yet. Add fields from the panel on the left.
              </div>
            ) : fields.length > 0 ? (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <FieldEditor
                    key={field.key}
                    field={field}
                    index={index}
                    total={fields.length}
                    readOnly={fieldsLocked}
                    onChange={(patch) => updateField(field.key, patch)}
                    onRemove={() => removeField(field.key)}
                    onMove={(direction) => moveField(index, direction)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving
              ? "Saving…"
              : isEdit
                ? fieldsLocked
                  ? "Save details"
                  : "Save changes"
                : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type FieldEditorProps = {
  field: FieldDraft
  index: number
  total: number
  readOnly?: boolean
  onChange: (patch: Partial<FieldDraft>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

function FieldEditor({
  field,
  index,
  total,
  readOnly = false,
  onChange,
  onRemove,
  onMove,
}: FieldEditorProps) {
  const meta = fieldMeta(field.type)
  const Icon = meta.icon
  const isSection = field.type === "SECTION_BREAK"
  const packageReferenceOptions = packageReferencesForFieldType(field.type)

  const addOption = () => {
    onChange({
      options: [...field.options, { key: uid(), label: "" }],
    })
  }
  const updateOption = (key: string, label: string) => {
    onChange({
      options: field.options.map((option) =>
        option.key === key ? { ...option, label } : option,
      ),
    })
  }
  const removeOption = (key: string) => {
    onChange({ options: field.options.filter((option) => option.key !== key) })
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <GripVertical className="size-4 text-muted-foreground" />
        <Badge variant="secondary" className="gap-1">
          <Icon className="size-3.5" />
          {meta.label}
        </Badge>
        <span className="text-xs text-muted-foreground">Field {index + 1}</span>
        <div className="ml-auto flex items-center gap-1">
          {!readOnly ? (
            <>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            title="Move up"
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            title="Move down"
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onRemove} title="Remove field">
            <Trash2 className="size-4" />
          </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">{isSection ? "Section title" : "Question label"}</Label>
          <Input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={isSection ? "Section heading" : "Enter the question"}
            disabled={readOnly}
          />
        </div>

        {!isSection ? (
          <div className="grid gap-1.5">
            <Label className="text-xs">Help text (optional)</Label>
            <Input
              value={field.helpText}
              onChange={(e) => onChange({ helpText: e.target.value })}
              placeholder="Extra guidance shown under the question"
              disabled={readOnly}
            />
          </div>
        ) : null}

        {!isSection && field.type === "NUMBER" && !readOnly ? (
          <div className="grid gap-1.5">
            <Label className="text-xs">Budget &amp; package behavior</Label>
            <NativeSelect
              className="w-full"
              value={field.budgetBehavior}
              onChange={(e) =>
                onChange({
                  budgetBehavior: e.target.value as FieldDraft["budgetBehavior"],
                  packageReference: "",
                  required: e.target.value ? false : field.required,
                })
              }
            >
              <NativeSelectOption value="">User enters amount manually</NativeSelectOption>
              {packageReferenceOptions.map((reference) => (
                <NativeSelectOption key={reference} value={reference}>
                  Package: {PACKAGE_FIELD_REFERENCE_LABELS[reference]}
                </NativeSelectOption>
              ))}
              <NativeSelectOption value="DEDUCT">
                {BUDGET_EFFECT_LABELS.DEDUCT}
              </NativeSelectOption>
              <NativeSelectOption value="ADD">
                {BUDGET_EFFECT_LABELS.ADD}
              </NativeSelectOption>
              <NativeSelectOption value="computedRemaining">
                Show remaining budget (auto-calculated)
              </NativeSelectOption>
              <NativeSelectOption value="computedVisitDeductions">
                Show total deducted on this visit (auto-calculated)
              </NativeSelectOption>
            </NativeSelect>
            {field.budgetBehavior === "DEDUCT" ? (
              <p className="text-xs text-muted-foreground">
                When submitted, this amount is added to the package&apos;s total
                expenses (deducted from the remaining budget).
              </p>
            ) : null}
            {field.budgetBehavior === "computedRemaining" ? (
              <p className="text-xs text-muted-foreground">
                Read-only. Updates live as deduct fields are filled: allocated
                budget minus prior submissions minus this visit.
              </p>
            ) : null}
            {field.budgetBehavior &&
            field.budgetBehavior !== "DEDUCT" &&
            field.budgetBehavior !== "ADD" &&
            field.budgetBehavior !== "computedRemaining" &&
            field.budgetBehavior !== "computedVisitDeductions" ? (
              <p className="text-xs text-muted-foreground">
                Read-only at submission. Value comes from the assigned package.
              </p>
            ) : null}
          </div>
        ) : null}

        {field.budgetBehavior && readOnly ? (
          <Badge variant="outline">
            Budget behavior:{" "}
            {field.budgetBehavior === "DEDUCT" || field.budgetBehavior === "ADD"
              ? BUDGET_EFFECT_LABELS[field.budgetBehavior]
              : field.budgetBehavior === "computedRemaining"
                ? "Remaining budget (calculated)"
                : field.budgetBehavior === "computedVisitDeductions"
                  ? "Visit deductions (calculated)"
                  : PACKAGE_FIELD_REFERENCE_LABELS[
                      field.budgetBehavior as PackageFieldReference
                    ]}
          </Badge>
        ) : null}

        {meta.hasOptions && !readOnly && !field.budgetBehavior ? (
          <div className="grid gap-1.5">
            <Label className="text-xs">Options</Label>
            <div className="space-y-1.5">
              {field.options.map((option) => (
                <div key={option.key} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(option.key, e.target.value)}
                    placeholder="Option label"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeOption(option.key)}
                    title="Remove option"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-fit" onClick={addOption}>
              <Plus className="mr-2 size-4" />
              Add option
            </Button>
          </div>
        ) : null}

        {field.type === "NUMBER" && !readOnly && !field.budgetBehavior ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                className="w-28"
                value={field.min}
                onChange={(e) => onChange({ min: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                className="w-28"
                value={field.max}
                onChange={(e) => onChange({ max: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={field.integer}
                onCheckedChange={(checked) => onChange({ integer: checked })}
              />
              Whole numbers only
            </label>
          </div>
        ) : null}

        {field.type === "TEXT" || field.type === "PARAGRAPH" ? (
          !readOnly && !field.budgetBehavior ? (
          <div className="grid gap-1.5">
            <Label className="text-xs">Max length (optional)</Label>
            <Input
              type="number"
              className="w-36"
              value={field.maxLength}
              onChange={(e) => onChange({ maxLength: e.target.value })}
            />
          </div>
          ) : null
        ) : null}

        {!isSection && !readOnly && !field.budgetBehavior ? (
          <label className={cn("flex items-center gap-2 text-sm")}>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onChange({ required: checked })}
            />
            Required
          </label>
        ) : null}
      </div>
    </div>
  )
}
