// import { useMemo } from "react";
import {
  CalendarRange,
  // ClipboardList,
  Filter,
  Info,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAnalyticsDateLabel,
  type AnalyticsDatePreset,
} from "@/lib/survey-analytics-dates";
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
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Filter className="size-4" />
            <p className="text-xs font-medium uppercase tracking-wider">
              Current view
            </p>
          </div>
          <p className="text-lg font-semibold">
            {selectedPackage
              ? selectedPackage.packageName
              : "All procurement packages"}
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedPackage
              ? `${selectedPackage.tehsilName} · one package`
              : `${summary.packageCount} packages in programme`}
            {" · "}
            Submissions received: {dateLabel}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScopeStat
            label="Submitted"
            value={summary.submitted}
            hint="In selected window"
          />
          <ScopeStat
            label="Villages"
            value={villageCount}
            hint="With responses"
          />
          <ScopeStat
            label="Tehsils"
            value={tehsilCount}
            hint="With responses"
          />
          <ScopeStat
            label="Drafts"
            value={summary.draft}
            hint={summary.draft > 0 ? "Not in date filter" : "In progress"}
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
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-lg border bg-background/80 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPinned className="size-4" />
          Geographic coverage
        </CardTitle>
        <CardDescription>
          Where submitted responses in the current filter were recorded — useful
          for spotting uneven village or tehsil coverage.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        {hasTehsils ? (
          <div>
            <p className="mb-3 text-sm font-medium">By tehsil</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tehsil</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.byTehsil.map((row) => (
                  <TableRow key={row.tehsilId}>
                    <TableCell>{row.tehsilName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.submitted}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {hasVillages ? (
          <div>
            <p className="mb-3 text-sm font-medium">By village</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Village</TableHead>
                  <TableHead>Tehsil</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.byVillage.slice(0, 12).map((row) => (
                  <TableRow key={row.villageId}>
                    <TableCell>{row.villageName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.tehsilName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.submitted}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {analytics.byVillage.length > 12 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing top 12 villages by submission count.
              </p>
            ) : null}
          </div>
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
