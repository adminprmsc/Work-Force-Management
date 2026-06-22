import type { SurveyFormBaselineField } from "@/modules/api/survey-types"
import { cn } from "@/lib/utils"

type PackageBaselineRequirementsProps = {
  variant?: "default" | "compact"
  className?: string
  title?: string
  description?: string
  fields?: SurveyFormBaselineField[]
}

export function PackageBaselineRequirements({
  variant = "default",
  className,
  title = "Package baseline (one-time)",
  description = "The tehsil RA must record this information on the procurement package before survey submissions can begin.",
  fields = [],
}: PackageBaselineRequirementsProps) {
  const compact = variant === "compact"

  if (fields.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1">{description}</p>
        <p className="mt-2">
          Add baseline fields in the form designer when village monitoring is enabled.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-muted/20",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="space-y-1">
        <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <ol className="mt-3 space-y-2">
        {fields.map((field, index) => (
          <li
            key={field.id ?? `${field.label}-${index}`}
            className="flex gap-3 rounded-lg border bg-background/80 px-3 py-2.5 text-sm"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium leading-snug">
                {field.label}
                {field.required ? (
                  <span className="text-destructive"> *</span>
                ) : null}
                {field.writeOnce ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    One-time
                  </span>
                ) : null}
              </p>
              {field.helpText ? (
                <p className="mt-0.5 text-muted-foreground">{field.helpText}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
