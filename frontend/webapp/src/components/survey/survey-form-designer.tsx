import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { PackageBaselineRequirements } from "@/components/compliance/package-baseline-requirements"
import { SurveyBaselineFieldsSection } from "@/components/survey/survey-baseline-fields-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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

type OptionDraft = { key: string; label: string; endsForm: boolean }

type SectionMode = "always" | "optional" | "conditional"

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
    | "computedVillageRemaining"
    | "computedVisitDeductions"
  /** SECTION_BREAK: how this section behaves */
  sectionMode: SectionMode
  /** SECTION_BREAK conditional: draft key of the controlling question */
  visibleWhenFieldKey: string
  /** SECTION_BREAK conditional: option value that must match */
  visibleWhenEquals: string
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function isFollowUpDraft(field: FieldDraft): boolean {
  return field.type !== "SECTION_BREAK" && field.visibleWhenFieldKey.trim().length > 0
}

function answerBranchKeys(fields: FieldDraft[], parentKey: string, answer: string): Set<string> {
  const keys = new Set<string>()
  const queue = fields
    .filter(
      (field) =>
        field.type !== "SECTION_BREAK" &&
        field.visibleWhenFieldKey === parentKey &&
        field.visibleWhenEquals === answer,
    )
    .map((field) => field.key)
  while (queue.length > 0) {
    const current = queue.pop()
    if (!current || keys.has(current)) continue
    keys.add(current)
    for (const field of fields) {
      if (field.type === "SECTION_BREAK") continue
      if (field.visibleWhenFieldKey === current) queue.push(field.key)
    }
  }
  return keys
}

function followUpKeys(fields: FieldDraft[], rootKey: string): Set<string> {
  const keys = new Set<string>()
  const queue = [rootKey]
  while (queue.length > 0) {
    const current = queue.pop()
    if (!current) continue
    for (const field of fields) {
      if (field.type === "SECTION_BREAK") continue
      if (field.visibleWhenFieldKey === current && !keys.has(field.key)) {
        keys.add(field.key)
        queue.push(field.key)
      }
    }
  }
  return keys
}

function swapBlocks(fields: FieldDraft[], keyA: string, keyB: string): FieldDraft[] {
  const blockA = followUpKeys(fields, keyA)
  const blockB = followUpKeys(fields, keyB)
  blockA.add(keyA)
  blockB.add(keyB)
  const itemsA = fields.filter((field) => blockA.has(field.key))
  const itemsB = fields.filter((field) => blockB.has(field.key))
  const next: FieldDraft[] = []
  let placedA = false
  let placedB = false
  for (const field of fields) {
    if (blockA.has(field.key)) {
      if (!placedA) {
        next.push(...itemsB)
        placedA = true
      }
      continue
    }
    if (blockB.has(field.key)) {
      if (!placedB) {
        next.push(...itemsA)
        placedB = true
      }
      continue
    }
    next.push(field)
  }
  return next
}

function budgetBehaviorFromField(field: SurveyField): FieldDraft["budgetBehavior"] {
  const config = field.config ?? {}
  if (config.packageReference) return config.packageReference
  if (config.computedRemainingBudget) return "computedRemaining"
  if (config.computedVillageRemainingBudget) return "computedVillageRemaining"
  if (config.computedVisitDeductions) return "computedVisitDeductions"
  if (config.budgetEffect) return config.budgetEffect
  return ""
}

function sectionModeFromField(field: SurveyField): SectionMode {
  const config = field.config ?? {}
  if (config.optional) return "optional"
  if (config.visibleWhen) return "conditional"
  return "always"
}

function draftFromField(field: SurveyField): FieldDraft {
  const config = field.config ?? {}
  const equals = config.visibleWhen?.equals
  return {
    key: field.id,
    type: field.type,
    label: field.label,
    helpText: field.helpText ?? "",
    required: field.required,
    options: (config.options ?? []).map((option) => ({
      key: uid(),
      label: option.label,
      endsForm: option.endsForm === true,
    })),
    min: config.min !== undefined ? String(config.min) : "",
    max: config.max !== undefined ? String(config.max) : "",
    integer: Boolean(config.integer),
    maxLength: config.maxLength !== undefined ? String(config.maxLength) : "",
    packageReference: config.packageReference ?? "",
    budgetBehavior: budgetBehaviorFromField(field),
    sectionMode: sectionModeFromField(field),
    visibleWhenFieldKey: config.visibleWhen?.fieldId ?? "",
    visibleWhenEquals: Array.isArray(equals)
      ? (equals[0] ?? "")
      : (equals ?? ""),
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
          { key: uid(), label: "Option 1", endsForm: false },
          { key: uid(), label: "Option 2", endsForm: false },
        ]
      : [],
    min: "",
    max: "",
    integer: false,
    maxLength: "",
    packageReference: "",
    budgetBehavior: "",
    sectionMode: "always",
    visibleWhenFieldKey: "",
    visibleWhenEquals: "",
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
  } else if (behavior === "computedVillageRemaining") {
    config = { computedVillageRemainingBudget: true, readOnly: true }
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
      .map((option) => ({
        label: option.label.trim(),
        endsForm: option.endsForm,
      }))
      .filter((option) => option.label.length > 0)
      .map((option) => ({
        value: option.label,
        label: option.label,
        ...(option.endsForm ? { endsForm: true as const } : {}),
      }))
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

  if (draft.type === "SECTION_BREAK") {
    if (draft.sectionMode === "optional") {
      config = { ...(config ?? {}), optional: true }
    } else if (
      draft.sectionMode === "conditional" &&
      draft.visibleWhenFieldKey &&
      draft.visibleWhenEquals.trim()
    ) {
      config = {
        ...(config ?? {}),
        visibleWhen: {
          fieldId: draft.visibleWhenFieldKey,
          equals: draft.visibleWhenEquals.trim(),
        },
      }
    }
  }

  if (
    draft.type !== "SECTION_BREAK" &&
    draft.visibleWhenFieldKey &&
    draft.visibleWhenEquals.trim()
  ) {
    config = {
      ...(config ?? {}),
      visibleWhen: {
        fieldId: draft.visibleWhenFieldKey,
        equals: draft.visibleWhenEquals.trim(),
      },
    }
  }

  return {
    id: draft.key,
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

function BranchingGuide() {
  return (
    <Collapsible defaultOpen className="rounded-xl border bg-muted/20">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium">
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
        How to branch a question or end the form
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-4 pb-4 text-sm text-muted-foreground">
        <ol className="list-decimal space-y-1.5 pl-4">
          <li>Add a Multiple Choice, Dropdown, or Checkboxes question.</li>
          <li>
            Next to each answer, choose <span className="text-foreground">Continue</span> or{" "}
            <span className="text-foreground">End the form</span>.
          </li>
          <li>
            <span className="text-foreground">Continue</span>, then{" "}
            <span className="text-foreground">Add question</span>, asks that question only when
            this answer is chosen. That question can branch again.
          </li>
          <li>
            <span className="text-foreground">End the form</span> skips every question after this
            one. Remove any questions already under that answer first.
          </li>
        </ol>
        <div className="rounded-lg border bg-background px-3 py-2.5">
          <p className="font-medium text-foreground">Example</p>
          <p className="mt-1">What is the status of the construction site?</p>
          <ul className="mt-1.5 space-y-1 pl-4">
            <li>
              <span className="text-foreground">Operational</span> — Continue, and add nothing.
              The rest of the survey stays open.
            </li>
            <li>
              <span className="text-foreground">Dormant</span> — Continue, then add “How long has
              the site been dormant?”
              <ul className="mt-1 space-y-1 pl-4">
                <li>More than 7 days — End the form. Later questions are skipped.</li>
                <li>Less than 7 days — Continue. The rest of the survey stays open.</li>
              </ul>
            </li>
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
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

  const addFollowUp = (parentKey: string, answer: string, type: SurveyFieldType) => {
    const label = answer.trim()
    if (!label) {
      toast.error("Name the answer before adding a question for it")
      return
    }
    setFields((prev) => {
      const draft = emptyDraft(type)
      draft.visibleWhenFieldKey = parentKey
      draft.visibleWhenEquals = answer
      const branch = answerBranchKeys(prev, parentKey, answer)
      branch.add(parentKey)
      let insertAt = prev.findIndex((field) => field.key === parentKey)
      prev.forEach((field, index) => {
        if (branch.has(field.key)) insertAt = Math.max(insertAt, index)
      })
      const next = [...prev]
      next.splice(insertAt + 1, 0, draft)
      return next
    })
  }

  const updateField = (key: string, patch: Partial<FieldDraft>) => {
    setFields((prev) => {
      const current = prev.find((field) => field.key === key)
      let next = prev.map((field) => (field.key === key ? { ...field, ...patch } : field))
      if (!current || !patch.options) return next

      const renamed = new Map<string, string>()
      for (const option of current.options) {
        const updated = patch.options.find((entry) => entry.key === option.key)
        if (updated && updated.label !== option.label) {
          renamed.set(option.label, updated.label)
        }
      }
      const removedLabels = new Set(
        current.options
          .filter((option) => !patch.options?.some((entry) => entry.key === option.key))
          .map((option) => option.label),
      )
      if (renamed.size > 0) {
        next = next.map((field) => {
          if (field.visibleWhenFieldKey !== key) return field
          const label = renamed.get(field.visibleWhenEquals)
          return label !== undefined ? { ...field, visibleWhenEquals: label } : field
        })
      }
      if (removedLabels.size > 0) {
        const drop = new Set<string>()
        for (const field of next) {
          if (field.visibleWhenFieldKey === key && removedLabels.has(field.visibleWhenEquals)) {
            drop.add(field.key)
            for (const nested of followUpKeys(next, field.key)) drop.add(nested)
          }
        }
        next = next.filter((field) => !drop.has(field.key))
      }
      return next
    })
  }

  const removeField = (key: string) => {
    setFields((prev) => {
      const drop = followUpKeys(prev, key)
      drop.add(key)
      return prev
        .filter((field) => !drop.has(field.key))
        .map((field) =>
          field.visibleWhenFieldKey === key
            ? { ...field, visibleWhenFieldKey: "", visibleWhenEquals: "" }
            : field,
        )
    })
  }

  const moveField = (key: string, direction: -1 | 1) => {
    setFields((prev) => {
      const field = prev.find((entry) => entry.key === key)
      if (!field) return prev
      const siblings = isFollowUpDraft(field)
        ? prev.filter(
            (entry) =>
              entry.type !== "SECTION_BREAK" &&
              entry.visibleWhenFieldKey === field.visibleWhenFieldKey &&
              entry.visibleWhenEquals === field.visibleWhenEquals,
          )
        : prev.filter((entry) => !isFollowUpDraft(entry))
      const index = siblings.findIndex((entry) => entry.key === key)
      const neighbor = siblings[index + direction]
      if (!neighbor) return prev
      return swapBlocks(prev, key, neighbor.key)
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
      if (
        field.type === "SECTION_BREAK" &&
        field.visibleWhenFieldKey &&
        !field.visibleWhenEquals.trim()
      ) {
        toast.error(
          `"${field.label || "Section"}" needs the answer that should show it (e.g. Yes)`,
        )
        return
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
              : "Build the questionnaire RAs will fill during site visits. Each answer can open more questions, or end the form."}
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

            {!fieldsLocked ? <BranchingGuide /> : null}

            {fields.length === 0 && !fieldsLocked ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No fields yet. Add fields from the panel on the left.
              </div>
            ) : fields.length > 0 ? (
              <div className="space-y-3">
                {fields.map((field, index) =>
                  isFollowUpDraft(field) ? null : (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      index={index}
                      total={fields.length}
                      allFields={fields}
                      readOnly={fieldsLocked}
                      depth={0}
                      onChange={(patch) => updateField(field.key, patch)}
                      onRemove={() => removeField(field.key)}
                      onMove={(direction) => moveField(field.key, direction)}
                      onAddFollowUp={(answer, type) => addFollowUp(field.key, answer, type)}
                      onPatchField={updateField}
                      onRemoveField={removeField}
                      onMoveField={moveField}
                      onCreateFollowUp={addFollowUp}
                    />
                  ),
                )}
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
  allFields: FieldDraft[]
  readOnly?: boolean
  depth?: number
  onChange: (patch: Partial<FieldDraft>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
  onAddFollowUp: (answer: string, type: SurveyFieldType) => void
  onPatchField: (key: string, patch: Partial<FieldDraft>) => void
  onRemoveField: (key: string) => void
  onMoveField: (key: string, direction: -1 | 1) => void
  onCreateFollowUp: (parentKey: string, answer: string, type: SurveyFieldType) => void
}

function FieldEditor({
  field,
  index,
  allFields,
  readOnly = false,
  depth = 0,
  onChange,
  onRemove,
  onMove,
  onAddFollowUp,
  onPatchField,
  onRemoveField,
  onMoveField,
  onCreateFollowUp,
}: FieldEditorProps) {
  const meta = fieldMeta(field.type)
  const Icon = meta.icon
  const isSection = field.type === "SECTION_BREAK"
  const packageReferenceOptions = packageReferencesForFieldType(field.type)
  const controllerCandidates = allFields
    .slice(0, index)
    .filter(
      (candidate) =>
        candidate.type === "MULTIPLE_CHOICE" ||
        candidate.type === "DROPDOWN" ||
        candidate.type === "CHECKBOXES",
    )
  const selectedController = controllerCandidates.find(
    (candidate) => candidate.key === field.visibleWhenFieldKey,
  )
  const controllerOptions = (selectedController?.options ?? [])
    .map((option) => option.label.trim())
    .filter((label) => label.length > 0)

  const followUp = isFollowUpDraft(field)
  const siblings = followUp
    ? allFields.filter(
        (entry) =>
          entry.type !== "SECTION_BREAK" &&
          entry.visibleWhenFieldKey === field.visibleWhenFieldKey &&
          entry.visibleWhenEquals === field.visibleWhenEquals,
      )
    : allFields.filter((entry) => !isFollowUpDraft(entry))
  const siblingIndex = siblings.findIndex((entry) => entry.key === field.key)
  const [followUpType, setFollowUpType] = useState<Record<string, SurveyFieldType>>({})

  const addOption = () => {
    onChange({
      options: [...field.options, { key: uid(), label: "", endsForm: false }],
    })
  }
  const updateOption = (key: string, patch: Partial<OptionDraft>) => {
    onChange({
      options: field.options.map((option) =>
        option.key === key ? { ...option, ...patch } : option,
      ),
    })
  }
  const removeOption = (key: string) => {
    onChange({ options: field.options.filter((option) => option.key !== key) })
  }

  return (
    <div className={cn(depth > 0 && "ml-4 border-l border-dashed pl-3")}>
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <GripVertical className="size-4 text-muted-foreground" />
        <Badge variant="secondary" className="gap-1">
          <Icon className="size-3.5" />
          {meta.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {followUp ? `When “${field.visibleWhenEquals}”` : `Field ${index + 1}`}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {!readOnly ? (
            <>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={siblingIndex <= 0}
            onClick={() => onMove(-1)}
            title="Move up"
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={siblingIndex < 0 || siblingIndex >= siblings.length - 1}
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

        {isSection && !readOnly ? (
          <div className="grid gap-2 rounded-md border border-dashed bg-muted/20 p-3">
            <div className="space-y-1">
              <Label className="text-xs">Section behavior</Label>
              <p className="text-xs text-muted-foreground">
                Choose whether users must fill this section, or can skip it.
              </p>
            </div>
            <NativeSelect
              className="w-full"
              value={field.sectionMode}
              onChange={(e) => {
                const mode = e.target.value as SectionMode
                onChange({
                  sectionMode: mode,
                  visibleWhenFieldKey: mode === "conditional" ? field.visibleWhenFieldKey : "",
                  visibleWhenEquals: mode === "conditional" ? field.visibleWhenEquals : "",
                })
              }}
            >
              <NativeSelectOption value="always">Always visible</NativeSelectOption>
              <NativeSelectOption value="optional">Optional — user selects Yes/No to fill</NativeSelectOption>
              <NativeSelectOption value="conditional">Conditional — depends on another question</NativeSelectOption>
            </NativeSelect>
            {field.sectionMode === "optional" ? (
              <p className="text-xs text-muted-foreground">
                Users will see a Yes/No toggle. If No, the section fields are hidden and not required.
              </p>
            ) : null}
            {field.sectionMode === "conditional" ? (
              <>
                <NativeSelect
                  className="w-full"
                  value={field.visibleWhenFieldKey}
                  onChange={(e) =>
                    onChange({
                      visibleWhenFieldKey: e.target.value,
                      visibleWhenEquals: "",
                    })
                  }
                >
                  <NativeSelectOption value="">Select controlling question…</NativeSelectOption>
                  {controllerCandidates.map((candidate) => (
                    <NativeSelectOption key={candidate.key} value={candidate.key}>
                      {candidate.label.trim() || "Untitled question"}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {field.visibleWhenFieldKey ? (
                  <NativeSelect
                    className="w-full"
                    value={field.visibleWhenEquals}
                    onChange={(e) => onChange({ visibleWhenEquals: e.target.value })}
                  >
                    <NativeSelectOption value="">Select answer…</NativeSelectOption>
                    {controllerOptions.map((option) => (
                      <NativeSelectOption key={option} value={option}>
                        {option}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                ) : null}
                {controllerCandidates.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add a Multiple Choice or Dropdown question above this section first.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

        {isSection && readOnly && field.sectionMode !== "always" ? (
          <Badge variant="outline">
            {field.sectionMode === "optional"
              ? "Optional section"
              : `Conditional section${field.visibleWhenEquals ? ` · equals "${field.visibleWhenEquals}"` : ""}`}
          </Badge>
        ) : null}

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
              <NativeSelectOption value="computedVillageRemaining">
                Show village remaining budget (auto-calculated)
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
            {field.budgetBehavior === "computedVillageRemaining" ? (
              <p className="text-xs text-muted-foreground">
                Read-only. Shows the visited village&apos;s allocation minus its
                prior submissions minus this visit.
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

        {meta.hasOptions && !field.budgetBehavior ? (
          <div className="grid gap-2">
            <Label className="text-xs">Answers</Label>
            <div className="space-y-2">
              {field.options.map((option) => {
                const answer = option.label.trim()
                const followUps = allFields.filter(
                  (entry) =>
                    entry.type !== "SECTION_BREAK" &&
                    entry.visibleWhenFieldKey === field.key &&
                    entry.visibleWhenEquals === option.label,
                )
                return (
                  <div key={option.key} className="space-y-2 rounded-md border bg-muted/20 p-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={option.label}
                        onChange={(e) => updateOption(option.key, { label: e.target.value })}
                        placeholder="Answer"
                        disabled={readOnly}
                      />
                      <NativeSelect
                        className="w-44 shrink-0"
                        value={option.endsForm ? "end" : "continue"}
                        disabled={readOnly || (followUps.length > 0 && !option.endsForm)}
                        onChange={(e) =>
                          updateOption(option.key, { endsForm: e.target.value === "end" })
                        }
                      >
                        <NativeSelectOption value="continue">Continue</NativeSelectOption>
                        <NativeSelectOption value="end">End the form</NativeSelectOption>
                      </NativeSelect>
                      {!readOnly ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeOption(option.key)}
                          title="Remove answer"
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                    {option.endsForm ? (
                      <p className="text-xs text-muted-foreground">
                        Choosing {answer ? `“${answer}”` : "this answer"} finishes the form. Later questions are skipped.
                      </p>
                    ) : null}
                    {followUps.length > 0 ? (
                      <div className="space-y-2">
                        {followUps.map((child) => (
                          <FieldEditor
                            key={child.key}
                            field={child}
                            index={allFields.findIndex((entry) => entry.key === child.key)}
                            total={allFields.length}
                            allFields={allFields}
                            readOnly={readOnly}
                            depth={depth + 1}
                            onChange={(patch) => onPatchField(child.key, patch)}
                            onRemove={() => onRemoveField(child.key)}
                            onMove={(direction) => onMoveField(child.key, direction)}
                            onAddFollowUp={(nextAnswer, type) =>
                              onCreateFollowUp(child.key, nextAnswer, type)
                            }
                            onPatchField={onPatchField}
                            onRemoveField={onRemoveField}
                            onMoveField={onMoveField}
                            onCreateFollowUp={onCreateFollowUp}
                          />
                        ))}
                      </div>
                    ) : null}
                    {!readOnly && !option.endsForm ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <NativeSelect
                          className="w-44"
                          value={followUpType[option.key] ?? "MULTIPLE_CHOICE"}
                          onChange={(e) =>
                            setFollowUpType((current) => ({
                              ...current,
                              [option.key]: e.target.value as SurveyFieldType,
                            }))
                          }
                        >
                          {SURVEY_FIELD_META.filter((item) => item.type !== "SECTION_BREAK").map(
                            (item) => (
                              <NativeSelectOption key={item.type} value={item.type}>
                                {item.label}
                              </NativeSelectOption>
                            ),
                          )}
                        </NativeSelect>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onAddFollowUp(
                              option.label,
                              followUpType[option.key] ?? "MULTIPLE_CHOICE",
                            )
                          }
                        >
                          <Plus className="mr-2 size-4" />
                          Add question
                        </Button>
                      </div>
                    ) : null}
                    {!readOnly && followUps.length > 0 && !option.endsForm ? (
                      <p className="text-xs text-muted-foreground">
                        Remove these questions before this answer can end the form.
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
            {!readOnly ? (
              <Button variant="outline" size="sm" className="w-fit" onClick={addOption}>
                <Plus className="mr-2 size-4" />
                Add answer
              </Button>
            ) : null}
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
    </div>
  )
}
