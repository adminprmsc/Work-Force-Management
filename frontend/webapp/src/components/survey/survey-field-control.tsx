import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { SurveyField } from "@/modules/api/survey-types"

type FileValue = { url?: string; name?: string }

type SurveyFieldControlProps = {
  field: SurveyField
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
}

export function SurveyFieldControl({
  field,
  value,
  onChange,
  disabled,
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
    case "IMAGE": {
      const file = (value as FileValue) ?? {}
      return (
        <div className="grid gap-2">
          <Input
            placeholder="File URL"
            disabled={disabled}
            value={file.url ?? ""}
            onChange={(e) => onChange({ ...file, url: e.target.value })}
          />
          <Input
            placeholder="File name (optional)"
            disabled={disabled}
            value={file.name ?? ""}
            onChange={(e) => onChange({ ...file, name: e.target.value })}
          />
        </div>
      )
    }

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
