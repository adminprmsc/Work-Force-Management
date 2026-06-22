import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  emptyBaselineDraft,
  type BaselineFieldDraft,
} from "@/lib/survey-baseline-draft"
import { fieldHasOptions, fieldMeta } from "@/lib/survey"
import type { SurveyFieldType } from "@/modules/api/survey-types"

const BASELINE_FIELD_TYPES: SurveyFieldType[] = [
  "TEXT",
  "PARAGRAPH",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
  "DATE",
  "NUMBER",
  "CHECKBOXES",
]

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

type SurveyBaselineFieldsSectionProps = {
  fields: BaselineFieldDraft[]
  baselineTitle: string
  baselineDescription: string
  readOnly?: boolean
  onFieldsChange: (fields: BaselineFieldDraft[]) => void
  onBaselineTitleChange: (value: string) => void
  onBaselineDescriptionChange: (value: string) => void
}

export function SurveyBaselineFieldsSection({
  fields,
  baselineTitle,
  baselineDescription,
  readOnly = false,
  onFieldsChange,
  onBaselineTitleChange,
  onBaselineDescriptionChange,
}: SurveyBaselineFieldsSectionProps) {
  const addField = (type: SurveyFieldType) => {
    onFieldsChange([...fields, emptyBaselineDraft(type)])
  }

  const updateField = (key: string, patch: Partial<BaselineFieldDraft>) => {
    onFieldsChange(
      fields.map((field) => (field.key === key ? { ...field, ...patch } : field)),
    )
  }

  const removeField = (key: string) => {
    onFieldsChange(fields.filter((field) => field.key !== key))
  }

  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= fields.length) return
    const next = [...fields]
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    onFieldsChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="baseline-title">Baseline section title</Label>
        <Input
          id="baseline-title"
          value={baselineTitle}
          onChange={(e) => onBaselineTitleChange(e.target.value)}
          placeholder="e.g. Package baseline"
          disabled={readOnly}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="baseline-description">Baseline instructions</Label>
        <Textarea
          id="baseline-description"
          rows={2}
          value={baselineDescription}
          onChange={(e) => onBaselineDescriptionChange(e.target.value)}
          placeholder="Explain what the RA must record once per package"
          disabled={readOnly}
        />
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap gap-2">
          {BASELINE_FIELD_TYPES.map((type) => {
            const meta = fieldMeta(type)
            const Icon = meta.icon
            return (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addField(type)}
              >
                <Icon className="size-4" />
                {meta.label}
              </Button>
            )
          })}
        </div>
      ) : null}

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          No baseline fields yet. Add the one-time information required before
          submissions.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const meta = fieldMeta(field.type)
            const Icon = meta.icon
            return (
              <div key={field.key} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Icon className="size-3.5" />
                    {meta.label}
                  </Badge>
                  {!readOnly ? (
                    <div className="ml-auto flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === 0}
                        onClick={() => moveField(index, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === fields.length - 1}
                        onClick={() => moveField(index, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeField(field.key)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 space-y-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Field label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.key, { label: e.target.value })}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Help text (optional)</Label>
                    <Input
                      value={field.helpText}
                      onChange={(e) =>
                        updateField(field.key, { helpText: e.target.value })
                      }
                      disabled={readOnly}
                    />
                  </div>
                  {fieldHasOptions(field.type) && !readOnly ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Options</Label>
                      {field.options.map((option) => (
                        <Input
                          key={option.key}
                          value={option.label}
                          onChange={(e) =>
                            updateField(field.key, {
                              options: field.options.map((o) =>
                                o.key === option.key
                                  ? { ...o, label: e.target.value }
                                  : o,
                              ),
                            })
                          }
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateField(field.key, {
                            options: [
                              ...field.options,
                              { key: uid(), label: "" },
                            ],
                          })
                        }
                      >
                        <Plus className="size-4" />
                        Add option
                      </Button>
                    </div>
                  ) : null}
                  {!readOnly ? (
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            updateField(field.key, { required: checked })
                          }
                        />
                        Required
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={field.writeOnce}
                          onCheckedChange={(checked) =>
                            updateField(field.key, { writeOnce: checked })
                          }
                        />
                        Write once (immutable)
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
