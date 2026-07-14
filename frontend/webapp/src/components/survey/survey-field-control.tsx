import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SurveyAttachmentField } from "@/components/survey/survey-attachment-field"
import { SurveyAttachmentDisplay } from "@/components/survey/survey-attachment-display"
import type { SurveyAttachmentUploadContext } from "@/lib/survey-attachment"
import type { SurveyField } from "@/modules/api/survey-types"

type SurveyFieldControlProps = {
  field: SurveyField
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  uploadContext?: SurveyAttachmentUploadContext
}

export function SurveyFieldControl({
  field,
  value,
  onChange,
  disabled,
  uploadContext,
}: SurveyFieldControlProps) {
  const options = field.config?.options ?? []

  switch (field.type) {
    case "PARAGRAPH":
      return (
        <Textarea
          rows={3}
          disabled={disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "NUMBER":
      return (
        <Input
          type="number"
          disabled={disabled}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
        />
      )

    case "DATE":
      return (
        <Input
          type="date"
          disabled={disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "TIME":
      return (
        <Input
          type="time"
          disabled={disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "CNIC":
      return (
        <Input
          inputMode="numeric"
          placeholder="#####-#######-#"
          disabled={disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "EMAIL":
      return (
        <Input
          type="email"
          placeholder="name@example.com"
          disabled={disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "CONTACT":
      return (
        <Input
          type="tel"
          placeholder="03XX-XXXXXXX"
          disabled={disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "DROPDOWN":
      return (
        <NativeSelect
          className="w-full"
          disabled={disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <NativeSelectOption value="">Select…</NativeSelectOption>
          {options.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )

    case "MULTIPLE_CHOICE":
      return (
        <RadioGroup
          disabled={disabled}
          value={(value as string) ?? ""}
          onValueChange={(next) => onChange(next)}
          className="gap-2"
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
              <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )

    case "CHECKBOXES": {
      const selected = Array.isArray(value) ? (value as string[]) : []
      const toggle = (optionValue: string) => {
        onChange(
          selected.includes(optionValue)
            ? selected.filter((v) => v !== optionValue)
            : [...selected, optionValue],
        )
      }
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                disabled={disabled}
                checked={selected.includes(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )
    }

    case "FILE":
    case "IMAGE":
      if (disabled) {
        return <SurveyAttachmentDisplay field={field} value={value} />
      }
      return (
        <SurveyAttachmentField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          uploadContext={uploadContext}
        />
      )

    case "TEXT":
    default:
      return (
        <Input
          disabled={disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}
