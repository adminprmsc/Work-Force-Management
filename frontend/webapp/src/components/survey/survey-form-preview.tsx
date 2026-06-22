import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SurveyFieldControl } from "@/components/survey/survey-field-control"
import { fieldIsPresentational } from "@/lib/survey"
import { fieldIsPackageBound } from "@/lib/package-field-reference"
import type { SurveyForm } from "@/modules/api/survey-types"

type SurveyFormPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: SurveyForm | null
}

export function SurveyFormPreview({
  open,
  onOpenChange,
  form,
}: SurveyFormPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{form?.title}</DialogTitle>
          {form?.description ? (
            <DialogDescription>{form.description}</DialogDescription>
          ) : (
            <DialogDescription>Read-only preview of the questionnaire.</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {(form?.fields ?? []).map((field) =>
            fieldIsPresentational(field.type) ? (
              <div key={field.id} className="pt-2">
                <p className="text-sm font-semibold">{field.label}</p>
                <Separator className="mt-1" />
              </div>
            ) : (
              <div key={field.id} className="grid gap-1.5">
                <Label>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {field.helpText ? (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                ) : null}
                {fieldIsPackageBound(field) ? (
                  <p className="text-xs text-muted-foreground">
                    Filled automatically from the procurement package when a tehsil RA
                    submits this form.
                  </p>
                ) : null}
                <SurveyFieldControl
                  field={field}
                  value={fieldIsPackageBound(field) ? "—" : undefined}
                  onChange={() => undefined}
                  disabled
                />
              </div>
            ),
          )}
          {(form?.fields ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">This form has no fields.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
