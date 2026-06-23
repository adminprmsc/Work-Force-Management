// import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  CalendarRange,
  // ClipboardList,
  ClipboardCheck,
  Filter,
  Info,
  MapPin,
  MapPinned,
  Package,
} from "lucide-react";

import { CesmpAnalyticsDashboard } from "@/components/survey/cesmp-analytics-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  formatAnalyticsDateLabel,
  type AnalyticsDatePreset,
} from "@/lib/survey-analytics-dates";
import {
  DEMOGRAPHIC_ACCENTS,
} from "@/lib/chart-colors";
import {
  IMPACT_CHIP_CLASSES,
  IMPACT_LABELS,
  impactBarGradient,
  impactColor,
  impactColorForCoverageShare,
  impactToneForCoverageShare,
  type ImpactTone,
} from "@/lib/impact-colors";
import { cn } from "@/lib/utils";
import type {
  SurveyFormAnalytics,
  // SurveyFormAnalyticsFieldBreakdown,
  SurveyFormAnalyticsPackageRow,
} from "@/modules/api/survey-types";

// const CHOICE_FIELD_TYPES = new Set([
//   "CHECKBOXES",
//   "MULTIPLE_CHOICE",
//   "DROPDOWN",
// ]);

type FormAnalyticsDashboardProps = {
  analytics: SurveyFormAnalytics | undefined;
  selectedPackageId: string | null;
  onPackageChange: (packageId: string | null) => void;
  datePreset: AnalyticsDatePreset;
  submittedFrom: string | null;
  submittedTo: string | null;
  onDatePresetChange: (preset: AnalyticsDatePreset) => void;
  onCustomDateChange: (from: string | null, to: string | null) => void;
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
};

function DashboardFilters({
  packages,
  selectedPackageId,
  onPackageChange,
  datePreset,
  submittedFrom,
  submittedTo,
  onDatePresetChange,
  onCustomDateChange,
}: {
  packages: SurveyFormAnalyticsPackageRow[];
  selectedPackageId: string | null;
  onPackageChange: (packageId: string | null) => void;
  datePreset: AnalyticsDatePreset;
  submittedFrom: string | null;
  submittedTo: string | null;
  onDatePresetChange: (preset: AnalyticsDatePreset) => void;
  onCustomDateChange: (from: string | null, to: string | null) => void;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Dashboard filters</CardTitle>
        <CardDescription>
          All charts and tables below reflect only submitted responses that
          match the procurement package and submission date window you choose.
          Package counts in the dropdown are all-time totals to help you pick a
          package.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              <Label htmlFor="package-filter">Procurement package</Label>
            </div>
            <NativeSelect
              id="package-filter"
              className="w-full"
              value={selectedPackageId ?? ""}
              onChange={(e) => onPackageChange(e.target.value || null)}
            >
              <NativeSelectOption value="">
                All packages — compare across the full programme
              </NativeSelectOption>
              {packages.map((pkg) => (
                <NativeSelectOption key={pkg.packageId} value={pkg.packageId}>
                  {pkg.packageName} · {pkg.tehsilName} ({pkg.total} responses
                  all-time)
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              Narrow KPIs to one contract package, or keep the overview to see
              programme-wide patterns.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarRange className="size-4 text-muted-foreground" />
              <Label htmlFor="date-preset">Submission date window</Label>
            </div>
            <NativeSelect
              id="date-preset"
              className="w-full"
              value={datePreset}
              onChange={(e) =>
                onDatePresetChange(e.target.value as AnalyticsDatePreset)
              }
            >
              <NativeSelectOption value="all">All time</NativeSelectOption>
              <NativeSelectOption value="30d">Last 30 days</NativeSelectOption>
              <NativeSelectOption value="90d">Last 90 days</NativeSelectOption>
              <NativeSelectOption value="custom">
                Custom range
              </NativeSelectOption>
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              Counts responses by when they were submitted, not when the site
              visit occurred.
            </p>
          </div>
        </div>

        {datePreset === "custom" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="submitted-from">Submitted from</Label>
              <Input
                id="submitted-from"
                type="date"
                value={submittedFrom ?? ""}
                onChange={(e) =>
                  onCustomDateChange(e.target.value || null, submittedTo)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submitted-to">Submitted through</Label>
              <Input
                id="submitted-to"
                type="date"
                value={submittedTo ?? ""}
                onChange={(e) =>
                  onCustomDateChange(submittedFrom, e.target.value || null)
                }
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ActiveScopeSummary({
  analytics,
  selectedPackage,
  dateLabel,
}: {
  analytics: SurveyFormAnalytics;
  selectedPackage: SurveyFormAnalyticsPackageRow | undefined;
  dateLabel: string;
}) {
  const { summary } = analytics;
  const villageCount = analytics.byVillage.length;
  const tehsilCount = analytics.byTehsil.length;

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="border-b bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-background shadow-sm">
              <Filter className="size-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Current view
              </p>
              <p className="text-lg font-semibold tracking-tight">
                {selectedPackage
                  ? selectedPackage.packageName
                  : "All procurement packages"}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPackage
                  ? `${selectedPackage.tehsilName} · single package scope`
                  : `${summary.packageCount} packages in programme`}
                <span className="mx-1.5 text-border">·</span>
                Submissions: {dateLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScopeStat
            label="Submitted"
            value={summary.submitted}
            hint="In selected window"
            tone="positive"
            icon={<ClipboardCheck className="size-4" />}
          />
          <ScopeStat
            label="Villages"
            value={villageCount}
            hint="With responses"
            tone="neutral"
            icon={<MapPin className="size-4" />}
          />
          <ScopeStat
            label="Tehsils"
            value={tehsilCount}
            hint="With responses"
            tone="neutral"
            icon={<MapPinned className="size-4" />}
          />
          <ScopeStat
            label="Drafts"
            value={summary.draft}
            hint={summary.draft > 0 ? "Outside date filter" : "In progress"}
            tone={summary.draft > 0 ? "warning" : "neutral"}
            icon={<Package className="size-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScopeStat({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  tone: ImpactTone;
  icon: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card p-4 shadow-sm",
        "border-t-[3px]",
      )}
      style={{ borderTopColor: impactColor(tone) }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className="opacity-90" style={{ color: impactColor(tone) }}>
          {icon}
        </span>
      </div>
      <p
        className="mt-2 text-2xl font-semibold tabular-nums tracking-tight"
        style={{ color: impactColor(tone) }}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function DemographicBarRow({
  label,
  sublabel,
  value,
  max,
  sharePct,
}: {
  label: string;
  sublabel?: string;
  value: number;
  max: number;
  sharePct: number;
}) {
  const widthPct = max > 0 ? Math.round((value / max) * 100) : 0;
  const tone = impactToneForCoverageShare(sharePct);
  const color = impactColorForCoverageShare(sharePct);

  return (
    <div className="group rounded-lg border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/20">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full ring-2 ring-background"
              style={{ backgroundColor: color }}
            />
            <p className="truncate text-sm font-medium">{label}</p>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                IMPACT_CHIP_CLASSES[tone],
              )}
            >
              {IMPACT_LABELS[tone]}
            </span>
          </div>
          {sublabel ? (
            <p className="mt-0.5 truncate pl-4.5 text-xs text-muted-foreground">
              {sublabel}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">{value}</p>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {sharePct}%
          </p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/70">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${widthPct}%`,
            background: impactBarGradient(color),
          }}
        />
      </div>
    </div>
  );
}

function DemographicSection({
  title,
  subtitle,
  total,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  total: number;
  accent: (typeof DEMOGRAPHIC_ACCENTS)[keyof typeof DEMOGRAPHIC_ACCENTS];
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-muted/10 p-4 shadow-sm",
        "border-l-4",
        accent.border,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums",
            accent.chip,
          )}
        >
          {total} total
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function GeographicDemographics({
  analytics,
}: {
  analytics: SurveyFormAnalytics;
}) {
  const hasVillages = analytics.byVillage.length > 0;
  const hasTehsils = analytics.byTehsil.length > 0;

  const tehsilTotal = analytics.byTehsil.reduce(
    (sum, row) => sum + row.submitted,
    0,
  );
  const villageTotal = analytics.byVillage.reduce(
    (sum, row) => sum + row.submitted,
    0,
  );
  const maxTehsil = Math.max(...analytics.byTehsil.map((r) => r.submitted), 1);
  const villageRows = analytics.byVillage.slice(0, 12);
  const maxVillage = Math.max(...villageRows.map((r) => r.submitted), 1);

  if (!hasVillages && !hasTehsils) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPinned className="size-4" />
            Geographic coverage
          </CardTitle>
          <CardDescription>
            No submitted responses match the current package and date filters.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPinned className={cn("size-4", DEMOGRAPHIC_ACCENTS.tehsil.icon)} />
          Geographic demographics
        </CardTitle>
        <CardDescription>
          Submission distribution by tehsil and village — colour reflects
          coverage strength (green = well represented, red = monitoring gap).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
        {hasTehsils ? (
          <DemographicSection
            title="By tehsil"
            subtitle="Administrative coverage of submitted site visits"
            total={tehsilTotal}
            accent={DEMOGRAPHIC_ACCENTS.tehsil}
          >
            {analytics.byTehsil.map((row) => (
              <DemographicBarRow
                key={row.tehsilId}
                label={row.tehsilName}
                value={row.submitted}
                max={maxTehsil}
                sharePct={
                  tehsilTotal > 0
                    ? Math.round((row.submitted / tehsilTotal) * 100)
                    : 0
                }
              />
            ))}
          </DemographicSection>
        ) : null}

        {hasVillages ? (
          <DemographicSection
            title="By village"
            subtitle="Top villages by submission count"
            total={villageTotal}
            accent={DEMOGRAPHIC_ACCENTS.village}
          >
            {villageRows.map((row) => (
              <DemographicBarRow
                key={row.villageId}
                label={row.villageName}
                sublabel={row.tehsilName}
                value={row.submitted}
                max={maxVillage}
                sharePct={
                  villageTotal > 0
                    ? Math.round((row.submitted / villageTotal) * 100)
                    : 0
                }
              />
            ))}
            {analytics.byVillage.length > 12 ? (
              <p className="pt-1 text-center text-xs text-muted-foreground">
                Showing top 12 of {analytics.byVillage.length} villages.
              </p>
            ) : null}
          </DemographicSection>
        ) : null}
      </CardContent>
    </Card>
  );
}

// function QuestionDemographics({
//   fields,
// }: {
//   fields: SurveyFormAnalyticsFieldBreakdown[];
// }) {
//   const choiceFields = useMemo(
//     () =>
//       fields.filter(
//         (field) =>
//           CHOICE_FIELD_TYPES.has(field.type) &&
//           field.choiceCounts &&
//           Object.keys(field.choiceCounts).length > 0,
//       ),
//     [fields],
//   );

//   // if (choiceFields.length === 0) {
//   //   return (
//   //     <Card className="border-border/80 shadow-sm">
//   //       <CardHeader>
//   //         <CardTitle className="flex items-center gap-2 text-base">
//   //           <ClipboardList className="size-4" />
//   //           Response patterns by question
//   //         </CardTitle>
//   //         <CardDescription>
//   //           No multiple-choice answers in the current filter yet. Submit more
//   //           site visits or widen the date window.
//   //         </CardDescription>
//   //       </CardHeader>
//   //     </Card>
//   //   );
//   // }

//   return <></>;
// }

// function ChoiceFieldBreakdown({
//   field,
// }: {
//   field: SurveyFormAnalyticsFieldBreakdown;
// }) {
//   const rows = Object.entries(field.choiceCounts ?? {})
//     .map(([answer, count]) => ({ answer, count }))
//     .sort((a, b) => b.count - a.count);
//   const total = rows.reduce((sum, row) => sum + row.count, 0);

//   return (
//     <div className="rounded-lg border p-4">
//       <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
//         <div>
//           <p className="font-medium">{field.label}</p>
//           <p className="text-xs text-muted-foreground">
//             {field.answeredCount} responses answered this question
//           </p>
//         </div>
//         <p className="text-xs text-muted-foreground">
//           {total} total selections
//         </p>
//       </div>
//       <div className="space-y-2">
//         {rows.map((row) => {
//           const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
//           return (
//             <div key={row.answer} className="space-y-1">
//               <div className="flex items-center justify-between text-sm">
//                 <span>{row.answer}</span>
//                 <span className="tabular-nums text-muted-foreground">
//                   {row.count} ({pct}%)
//                 </span>
//               </div>
//               <div className="h-2 overflow-hidden rounded-full bg-muted">
//                 <div
//                   className="h-full rounded-full bg-primary/70"
//                   style={{ width: `${pct}%` }}
//                 />
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

function EmptyFilterState() {
  return (
    <Card className="border-dashed shadow-sm">
      <CardContent className="flex items-start gap-3 p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">No data for this filter</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try selecting all packages, widening the submission date window, or
            waiting for more site visits to be submitted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function FormAnalyticsDashboard({
  analytics,
  selectedPackageId,
  onPackageChange,
  datePreset,
  submittedFrom,
  submittedTo,
  onDatePresetChange,
  onCustomDateChange,
}: FormAnalyticsDashboardProps) {
  const packages = analytics?.byProcurementPackage ?? [];
  const selectedPackage = packages.find(
    (pkg) => pkg.packageId === selectedPackageId,
  );
  const dateLabel = formatAnalyticsDateLabel(submittedFrom, submittedTo);
  const hasResponses = (analytics?.summary.submitted ?? 0) > 0;

  return (
    <div className="space-y-6">
      <DashboardFilters
        packages={packages}
        selectedPackageId={selectedPackageId}
        onPackageChange={onPackageChange}
        datePreset={datePreset}
        submittedFrom={submittedFrom}
        submittedTo={submittedTo}
        onDatePresetChange={onDatePresetChange}
        onCustomDateChange={onCustomDateChange}
      />

      {analytics ? (
        <ActiveScopeSummary
          analytics={analytics}
          selectedPackage={selectedPackage}
          dateLabel={dateLabel}
        />
      ) : null}

      {!hasResponses && analytics ? <EmptyFilterState /> : null}

      {analytics?.cesmpInsights && hasResponses ? (
        <CesmpAnalyticsDashboard
          insights={analytics.cesmpInsights}
          selectedPackageId={selectedPackageId}
        />
      ) : null}

      {analytics && hasResponses ? (
        <>
          <GeographicDemographics analytics={analytics} />
          {/* <QuestionDemographics fields={analytics.fieldBreakdown} /> */}
        </>
      ) : null}
    </div>
  );
}
