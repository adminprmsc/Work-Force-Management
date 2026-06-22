import { format } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { answerableFields, formatAnswerValue } from "@/lib/survey-answers"
import { fieldIsPresentational } from "@/lib/survey"
import type { SurveyResponse } from "@/modules/api/survey-types"

type SurveyResponseDetailProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  response: SurveyResponse | null
}

export function SurveyResponseDetail({
  open,
  onOpenChange,
  response,
}: SurveyResponseDetailProps) {
  const fields = response?.formRevision.fields ?? []
  const answerMap = new Map(
    (response?.answers ?? []).map((answer) => [answer.fieldId, answer.value]),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{response?.form.title}</DialogTitle>
          <DialogDescription>
            {response ? (
              <>
                {response.tehsil.name} · {response.village.name}
                {response.settlement ? ` · ${response.settlement.name}` : ""} · by{" "}
                {response.respondent.username}
                <span className="mt-1 block text-xs">
                  Submitted against form version {response.formRevision.version}
                </span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 border-b bg-muted/20 px-6 py-2 text-xs text-muted-foreground">
          <Badge variant={response?.status === "SUBMITTED" ? "default" : "secondary"}>
            {response?.status === "SUBMITTED" ? "Submitted" : "Draft"}
          </Badge>
          {response?.submittedAt ? (
            <span>
              Submitted {format(new Date(response.submittedAt), "dd MMM yyyy, HH:mm")}
            </span>
          ) : (
            <span>
              Started {response ? format(new Date(response.createdAt), "dd MMM yyyy") : ""}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {fields.map((field) =>
            fieldIsPresentational(field.type) ? (
              <div key={field.id} className="pt-2">
                <p className="text-sm font-semibold">{field.label}</p>
                <Separator className="mt-1" />
              </div>
            ) : (
              <div key={field.id} className="grid gap-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </p>
                <p className="text-sm">
                  {formatAnswerValue(field, answerMap.get(field.id))}
                </p>
              </div>
            ),
          )}
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No answers recorded.</p>
          ) : answerableFields(fields).length === 0 ? (
            <p className="text-sm text-muted-foreground">No answers recorded.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
