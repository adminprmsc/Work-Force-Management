import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Filter,
  Hash,
  Info,
  MapPin,
  MapPinned,
  Package,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { CesmpAnalyticsDashboard } from "@/components/survey/cesmp-analytics-dashboard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatAnalyticsDateLabel,
  type AnalyticsDatePreset,
} from "@/lib/survey-analytics-dates";
import { DEMOGRAPHIC_ACCENTS, CHART_SERIES_COLORS } from "@/lib/chart-colors";
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
  SurveyFormAnalyticsFieldBreakdown,
  SurveyFormAnalyticsPackageRow,
  SurveyFormAnalyticsTehsilRow,
  SurveyFormAnalyticsTimePoint,
} from "@/modules/api/survey-types";

const CHOICE_FIELD_TYPES = new Set([
  "CHECKBOXES",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
]);

// ─── types ───────────────────────────────────────────────────────────────────

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

type TehsilAlert = {
  tehsilName: string;
  accepted: number;
  sharePct: number;
  acceptanceRate: number;
  pendingReview: number;
  rejected: number;
  tone: ImpactTone;
  issue: string;
};

type ExecutiveFinding = {
  id: string;
  title: string;
  metric: string;
  detail: string;
  tone: ImpactTone;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function AnalysisInfo({
  meaning,
  role,
}: {
  meaning: string;
  role: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Explain this analysis"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="max-w-sm">
          <div className="space-y-1">
            <p className="font-medium">What it means</p>
            <p>{meaning}</p>
            <p className="pt-1 font-medium">Why it matters</p>
            <p>{role}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function deriveTehsilAlerts(
  byTehsil: SurveyFormAnalyticsTehsilRow[],
  packages: SurveyFormAnalyticsPackageRow[],
  total: number,
): TehsilAlert[] {
  if (byTehsil.length === 0 || total === 0) return [];
  const avgShare = 100 / byTehsil.length;
  return byTehsil.map((row) => {
    const sharePct = Math.round((row.accepted / total) * 100);
    const tehsilPackages = packages.filter((pkg) => pkg.tehsilId === row.tehsilId);
    const pendingReview = tehsilPackages.reduce((sum, pkg) => sum + pkg.pendingReview, 0);
    const rejected = tehsilPackages.reduce((sum, pkg) => sum + pkg.rejected, 0);
    const draft = tehsilPackages.reduce((sum, pkg) => sum + pkg.draft, 0);
    const reverted = tehsilPackages.reduce((sum, pkg) => sum + pkg.reverted, 0);
    const totalActivity = row.accepted + pendingReview + rejected + draft + reverted;
    const acceptanceRate =
      totalActivity > 0 ? Math.round((row.accepted / totalActivity) * 100) : 0;

    let tone: ImpactTone = "positive";
    let issue = "Balanced coverage and healthy acceptance performance";

    if (sharePct < 5 || acceptanceRate < 25) {
      tone = "negative";
      issue =
        sharePct < 5
          ? `Critical gap: only ${sharePct}% coverage share vs ${Math.round(avgShare)}% average`
          : `Quality issue: only ${acceptanceRate}% of responses are accepted in this tehsil`;
    } else if (sharePct < 10 || acceptanceRate < 45 || pendingReview > row.accepted) {
      tone = "warning";
      issue =
        sharePct < 10
          ? `Low field coverage: ${sharePct}% share vs ${Math.round(avgShare)}% average`
          : pendingReview > row.accepted
            ? `Review backlog exceeds accepted volume (${pendingReview} pending vs ${row.accepted} accepted)`
            : `Below-target acceptance rate (${acceptanceRate}%) indicates submission quality issues`;
    } else if (impactToneForCoverageShare(sharePct) === "neutral") {
      tone = "neutral";
      issue = `Moderate coverage with ${acceptanceRate}% acceptance rate`;
    }

    return {
      tehsilName: row.tehsilName,
      accepted: row.accepted,
      sharePct,
      acceptanceRate,
      pendingReview,
      rejected,
      tone,
      issue,
    };
  }).sort((a, b) => a.sharePct - b.sharePct);
}

function deriveExecutiveFindings(
  analytics: SurveyFormAnalytics,
  tehsilAlerts: TehsilAlert[],
): ExecutiveFinding[] {
  const findings: ExecutiveFinding[] = [];
  const { summary } = analytics;
  const totalSubmitted =
    summary.accepted +
    summary.pendingReview +
    summary.draft +
    summary.rejected +
    summary.reverted;
  const acceptanceRate =
    totalSubmitted > 0 ? Math.round((summary.accepted / totalSubmitted) * 100) : 0;

  findings.push({
    id: "acceptance-rate",
    title: "Overall response quality",
    metric: `${acceptanceRate}%`,
    detail:
      acceptanceRate >= 60
        ? "Most submissions are clearing review successfully."
        : acceptanceRate >= 35
          ? "Acceptance is moderate; some field submissions need better quality control."
          : "Low acceptance rate suggests major issues in field submission quality.",
    tone:
      acceptanceRate >= 60
        ? "positive"
        : acceptanceRate >= 35
          ? "neutral"
          : "warning",
  });

  const weakestCoverage = tehsilAlerts[0];
  if (weakestCoverage) {
    findings.push({
      id: "weakest-tehsil",
      title: "Weakest tehsil coverage",
      metric: `${weakestCoverage.sharePct}%`,
      detail: `${weakestCoverage.tehsilName} has the lowest accepted-response share and should be prioritized for monitoring.`,
      tone: weakestCoverage.tone,
    });
  }

  const weakestQuality = [...tehsilAlerts].sort(
    (a, b) => a.acceptanceRate - b.acceptanceRate,
  )[0];
  if (weakestQuality) {
    findings.push({
      id: "weakest-quality-tehsil",
      title: "Lowest tehsil acceptance rate",
      metric: `${weakestQuality.acceptanceRate}%`,
      detail: `${weakestQuality.tehsilName} is generating the weakest acceptance outcome, indicating local submission quality or supervision issues.`,
      tone:
        weakestQuality.acceptanceRate < 25
          ? "negative"
          : weakestQuality.acceptanceRate < 45
            ? "warning"
            : "neutral",
    });
  }

  const backlogRate =
    summary.accepted + summary.pendingReview > 0
      ? Math.round(
          (summary.pendingReview / (summary.accepted + summary.pendingReview)) * 100,
        )
      : 0;
  findings.push({
    id: "review-backlog",
    title: "Review backlog pressure",
    metric: `${backlogRate}%`,
    detail:
      backlogRate >= 40
        ? "Head-office review backlog is high enough to slow feedback loops."
        : backlogRate >= 20
          ? "Pending reviews should be monitored to avoid decision delays."
          : "Review flow is healthy relative to accepted volume.",
    tone:
      backlogRate >= 40 ? "warning" : backlogRate >= 20 ? "neutral" : "positive",
  });

  const trendSeries = analytics.submissionsOverTime.filter((point) => point.count > 0);
  if (trendSeries.length >= 14) {
    const recent = trendSeries.slice(-7).reduce((sum, point) => sum + point.count, 0);
    const previous = trendSeries
      .slice(-14, -7)
      .reduce((sum, point) => sum + point.count, 0);
    const delta =
      previous > 0 ? Math.round(((recent - previous) / previous) * 100) : 0;
    findings.push({
      id: "trend",
      title: "Recent submission trend",
      metric: `${delta > 0 ? "+" : ""}${delta}%`,
      detail:
        delta >= 25
          ? "Accepted submission volume is accelerating in the latest week."
          : delta <= -25
            ? "Accepted submission volume has slowed materially in the latest week."
            : "Submission pace is broadly stable week over week.",
      tone: delta >= 25 ? "positive" : delta <= -25 ? "warning" : "neutral",
    });
  }

  return findings.slice(0, 4);
}

// ─── filters ─────────────────────────────────────────────────────────────────

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
          All charts reflect accepted responses matching the procurement package
          and date window. Package counts in the dropdown are all-time totals.
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
                  {pkg.packageName} · {pkg.tehsilName} ({pkg.total} responses)
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarRange className="size-4 text-muted-foreground" />
              <Label htmlFor="date-preset">Date window</Label>
            </div>
            <NativeSelect
              id="date-preset"
              className="w-full"
              value={datePreset}
              onChange={(e) => onDatePresetChange(e.target.value as AnalyticsDatePreset)}
            >
              <NativeSelectOption value="all">All time</NativeSelectOption>
              <NativeSelectOption value="30d">Last 30 days</NativeSelectOption>
              <NativeSelectOption value="90d">Last 90 days</NativeSelectOption>
              <NativeSelectOption value="custom">Custom range</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
        {datePreset === "custom" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="submitted-from">From</Label>
              <Input
                id="submitted-from"
                type="date"
                value={submittedFrom ?? ""}
                onChange={(e) => onCustomDateChange(e.target.value || null, submittedTo)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submitted-to">Through</Label>
              <Input
                id="submitted-to"
                type="date"
                value={submittedTo ?? ""}
                onChange={(e) => onCustomDateChange(submittedFrom, e.target.value || null)}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── KPI strip ───────────────────────────────────────────────────────────────

function ScopeStat({
  label, value, hint, tone, icon,
}: {
  label: string; value: number; hint: string; tone: ImpactTone; icon: ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-border/70 bg-card p-4 shadow-sm border-t-[3px]"
      style={{ borderTopColor: impactColor(tone) }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span style={{ color: impactColor(tone) }}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight" style={{ color: impactColor(tone) }}>
        {fmt(value)}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function ActiveScopeSummary({
  analytics, selectedPackage, dateLabel,
}: {
  analytics: SurveyFormAnalytics;
  selectedPackage: SurveyFormAnalyticsPackageRow | undefined;
  dateLabel: string;
}) {
  const { summary } = analytics;
  const totalSubmitted =
    summary.accepted +
    summary.pendingReview +
    summary.draft +
    summary.rejected +
    summary.reverted;
  const acceptanceRate = totalSubmitted > 0 ? Math.round((summary.accepted / totalSubmitted) * 100) : 0;

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="border-b bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-background shadow-sm">
            <Filter className="size-4 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Current view</p>
            <p className="text-lg font-semibold tracking-tight">
              {selectedPackage ? selectedPackage.packageName : "All procurement packages"}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedPackage
                ? `${selectedPackage.tehsilName} · single package`
                : `${summary.packageCount} packages in programme`}
              <span className="mx-1.5 text-border">·</span>
              {dateLabel}
              <span className="mx-1.5 text-border">·</span>
              {acceptanceRate}% acceptance rate
            </p>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <ScopeStat label="Accepted" value={summary.accepted} hint="In selected window" tone="positive" icon={<ClipboardCheck className="size-4" />} />
          <ScopeStat label="Pending review" value={summary.pendingReview} hint="Awaiting HO decision" tone="warning" icon={<ClipboardCheck className="size-4" />} />
          <ScopeStat label="Rejected" value={summary.rejected} hint="Not accepted" tone="negative" icon={<ClipboardCheck className="size-4" />} />
          <ScopeStat label="Villages" value={analytics.byVillage.length} hint="With accepted responses" tone="neutral" icon={<MapPin className="size-4" />} />
          <ScopeStat label="Tehsils" value={analytics.byTehsil.length} hint="With accepted responses" tone="neutral" icon={<MapPinned className="size-4" />} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Executive summary + tehsil diagnostics ──────────────────────────────────

function ExecutiveFindingsPanel({ findings }: { findings: ExecutiveFinding[] }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="border-b bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-background shadow-sm">
            <ShieldAlert className="size-4 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Executive findings
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold tracking-tight">
                Analyst summary for the current dashboard scope
              </p>
              <AnalysisInfo
                meaning="This is the short executive reading of the full dashboard. It surfaces the most important findings from coverage, acceptance quality, backlog, and recent trend."
                role="Use this first when briefing managers or auditors so they understand the main message before reading the detailed charts."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This panel synthesizes the key message from the charts below so the
              dashboard reads as one coherent briefing.
            </p>
          </div>
        </div>
      </div>
      <CardContent className="grid gap-3 p-6 lg:grid-cols-2">
        {findings.map((finding) => (
          <div
            key={finding.id}
            className={cn(
              "rounded-xl border border-l-4 p-4 shadow-sm",
              finding.tone === "negative" &&
                "border-l-[var(--impact-negative)] bg-[color-mix(in_oklch,var(--impact-negative)_6%,var(--card))]",
              finding.tone === "warning" &&
                "border-l-[var(--impact-warning)] bg-[color-mix(in_oklch,var(--impact-warning)_7%,var(--card))]",
              finding.tone === "neutral" &&
                "border-l-[var(--impact-neutral)] bg-[color-mix(in_oklch,var(--impact-neutral)_7%,var(--card))]",
              finding.tone === "positive" &&
                "border-l-[var(--impact-positive)] bg-[color-mix(in_oklch,var(--impact-positive)_7%,var(--card))]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{finding.title}</p>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      IMPACT_CHIP_CLASSES[finding.tone],
                    )}
                  >
                    {IMPACT_LABELS[finding.tone]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{finding.detail}</p>
              </div>
              <p
                className="shrink-0 text-right text-xl font-semibold tabular-nums"
                style={{ color: impactColor(finding.tone) }}
              >
                {finding.metric}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TehsilProblematicPanel({ alerts }: { alerts: TehsilAlert[] }) {
  const critical = alerts.filter((a) => a.tone === "negative" || a.tone === "warning");
  if (critical.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[color-mix(in_oklch,var(--impact-positive)_25%,transparent)] bg-[color-mix(in_oklch,var(--impact-positive)_8%,var(--card))] p-4">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--impact-positive)]" />
        <p className="text-sm text-foreground">
          No tehsil is showing a material coverage or acceptance-quality gap in the
          current scope.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {critical.length} tehsil{critical.length === 1 ? "" : "s"} need attention
      </p>
      {critical.map((a) => (
        <div
          key={a.tehsilName}
          className={cn(
            "flex items-start gap-3 rounded-lg border border-l-4 p-3",
            a.tone === "negative"
              ? "border-[var(--impact-negative)] bg-[color-mix(in_oklch,var(--impact-negative)_7%,var(--card))]"
              : "border-[var(--impact-warning)] bg-[color-mix(in_oklch,var(--impact-warning)_7%,var(--card))]",
          )}
        >
          <ShieldAlert
            className={cn("mt-0.5 size-4 shrink-0", a.tone === "negative" ? "text-[var(--impact-negative)]" : "text-[var(--impact-warning)]")}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{a.tehsilName}</span>
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", IMPACT_CHIP_CLASSES[a.tone])}>
                {IMPACT_LABELS[a.tone]}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{a.issue}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Coverage share: {a.sharePct}% · Acceptance rate: {a.acceptanceRate}% ·
              Pending: {a.pendingReview} · Rejected: {a.rejected}
            </p>
          </div>
          <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
            {a.accepted} resp.
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Geographic section ───────────────────────────────────────────────────────

function GeographicDemographics({ analytics }: { analytics: SurveyFormAnalytics }) {
  const hasTehsils = analytics.byTehsil.length > 0;
  const hasVillages = analytics.byVillage.length > 0;

  const tehsilTotal = analytics.byTehsil.reduce((s, r) => s + r.accepted, 0);
  const villageTotal = analytics.byVillage.reduce((s, r) => s + r.accepted, 0);

  // Donut data for tehsil distribution
  const tehsilPieData = useMemo(
    () =>
      analytics.byTehsil.map((r, i) => ({
        name: r.tehsilName,
        value: r.accepted,
        fill: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length],
      })),
    [analytics.byTehsil],
  );

  // Donut data for top 8 villages
  const villagePieData = useMemo(
    () =>
      analytics.byVillage.slice(0, 8).map((r, i) => ({
        name: r.villageName,
        value: r.accepted,
        tehsil: r.tehsilName,
        fill: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length],
      })),
    [analytics.byVillage],
  );

  // Horizontal bar data comparing tehsils
  const tehsilBarData = useMemo(
    () =>
      analytics.byTehsil.map((r) => ({
        name: r.tehsilName.length > 14 ? r.tehsilName.slice(0, 14) + "…" : r.tehsilName,
        full: r.tehsilName,
        accepted: r.accepted,
        share: tehsilTotal > 0 ? Math.round((r.accepted / tehsilTotal) * 100) : 0,
        fill: impactColorForCoverageShare(
          tehsilTotal > 0 ? Math.round((r.accepted / tehsilTotal) * 100) : 0,
        ),
      })),
    [analytics.byTehsil, tehsilTotal],
  );

  const tehsilAlerts = useMemo(
    () =>
      deriveTehsilAlerts(
        analytics.byTehsil,
        analytics.byProcurementPackage,
        tehsilTotal,
      ),
    [analytics.byProcurementPackage, analytics.byTehsil, tehsilTotal],
  );

  const tehsilChartConfig: ChartConfig = {
    accepted: { label: "Accepted responses", color: "var(--chart-1)" },
  };

  if (!hasTehsils && !hasVillages) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPinned className="size-4" />Geographic coverage
          </CardTitle>
          <CardDescription>No accepted responses match the current filters.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Coverage diagnostics panel */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-[var(--impact-warning)]" />
            Tehsil health diagnostics
            <AnalysisInfo
              meaning="This combines two things for each tehsil: how much accepted response coverage it has, and how well its responses are clearing review."
              role="Use this to identify which tehsils are weak because they are under-covered, producing low-quality submissions, or creating review backlog."
            />
          </CardTitle>
          <CardDescription>
            Combines two signals into one analyst view: response coverage share and
            acceptance quality. A tehsil is flagged only when representation or
            review performance is materially weak.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <TehsilProblematicPanel alerts={tehsilAlerts} />
        </CardContent>
      </Card>

      {/* Tehsil comparison: donut + bar side by side */}
      {hasTehsils ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPinned className={cn("size-4", DEMOGRAPHIC_ACCENTS.tehsil.icon)} />
              Tehsil response distribution
              <AnalysisInfo
                meaning="This shows how accepted responses are distributed across tehsils. The donut shows relative share and the bars show absolute accepted count."
                role="Use this to see whether monitoring activity is concentrated in only a few tehsils or spread across the programme."
              />
            </CardTitle>
            <CardDescription>
              Use this section for distribution only: the donut shows proportional
              share, while the bar chart compares absolute accepted volume by tehsil.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
            {/* Donut */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Share of accepted responses · {fmt(tehsilTotal)} total
              </p>
              <ChartContainer config={{}} className="h-[260px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]!;
                      const pct = tehsilTotal > 0 ? Math.round((Number(d.value) / tehsilTotal) * 100) : 0;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-muted-foreground">{fmt(Number(d.value))} responses · {pct}%</p>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={tehsilPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="42%"
                    outerRadius="72%"
                    paddingAngle={2}
                    label={({ percent }: { name?: string; percent?: number }) =>
                      (percent ?? 0) > 0.05 ? `${Math.round((percent ?? 0) * 100)}%` : ""
                    }
                    labelLine={false}
                  >
                    {tehsilPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* legend */}
              <div className="mt-3 flex flex-wrap gap-2">
                {tehsilPieData.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Horizontal bar */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Absolute count comparison
              </p>
              <ChartContainer config={tehsilChartConfig} className="h-[260px] w-full">
                <BarChart
                  data={tehsilBarData}
                  layout="vertical"
                  margin={{ left: 8, right: 32, top: 4, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]!.payload as (typeof tehsilBarData)[0];
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                          <p className="font-medium">{d.full}</p>
                          <p className="text-muted-foreground">{fmt(d.accepted)} responses · {d.share}% share</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="accepted" radius={[0, 4, 4, 0]}>
                    {tehsilBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Village donut */}
      {hasVillages ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className={cn("size-4", DEMOGRAPHIC_ACCENTS.village.icon)} />
              Village concentration
              <AnalysisInfo
                meaning="This shows which villages contribute most of the accepted responses inside the current scope."
                role="Use this to spot whether evidence is concentrated in a small set of villages and where field coverage may need widening."
              />
            </CardTitle>
            <CardDescription>
              This section highlights where accepted responses are concentrated at
              village level after the tehsil picture above.
              {analytics.byVillage.length > 8
                ? ` Showing 8 of ${analytics.byVillage.length} villages.`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
            {/* Donut */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Village share · {fmt(villageTotal)} total
              </p>
              <ChartContainer config={{}} className="h-[260px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]!.payload as (typeof villagePieData)[0];
                      const pct = villageTotal > 0 ? Math.round((Number(payload[0]!.value) / villageTotal) * 100) : 0;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-muted-foreground">{d.tehsil}</p>
                          <p className="text-muted-foreground">{fmt(Number(payload[0]!.value))} responses · {pct}%</p>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={villagePieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="38%"
                    outerRadius="68%"
                    paddingAngle={2}
                    label={({ percent }: { name?: string; percent?: number }) =>
                      (percent ?? 0) > 0.06 ? `${Math.round((percent ?? 0) * 100)}%` : ""
                    }
                    labelLine={false}
                  >
                    {villagePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Ranked list */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ranked by accepted responses</p>
              {analytics.byVillage.slice(0, 12).map((row, i) => {
                const sharePct = villageTotal > 0 ? Math.round((row.accepted / villageTotal) * 100) : 0;
                const tone = impactToneForCoverageShare(sharePct);
                const color = impactColorForCoverageShare(sharePct);
                const widthPct = villageTotal > 0 ? Math.round((row.accepted / analytics.byVillage[0]!.accepted) * 100) : 0;
                return (
                  <div key={row.villageId} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length] }} />
                        <span className="truncate text-sm font-medium">{row.villageName}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{row.tehsilName}</span>
                        <span className={cn("rounded px-1 py-0.5 text-[10px] font-medium", IMPACT_CHIP_CLASSES[tone])}>{IMPACT_LABELS[tone]}</span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{row.accepted}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${widthPct}%`, background: impactBarGradient(color) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ─── Package linkage ──────────────────────────────────────────────────────────

function ProcurementPackageLinkage({
  packages,
  selectedPackageId,
  onPackageChange,
}: {
  packages: SurveyFormAnalyticsPackageRow[];
  selectedPackageId: string | null;
  onPackageChange: (packageId: string | null) => void;
}) {
  const rows = useMemo(() => {
    const scoped = selectedPackageId
      ? packages.filter((p) => p.packageId === selectedPackageId)
      : packages;
    return scoped.filter((p) => p.total > 0);
  }, [packages, selectedPackageId]);

  // Stacked bar chart data: accepted / pending / draft / rejected
  const barData = useMemo(
    () =>
      rows.map((p) => ({
        name: p.packageName.length > 18 ? p.packageName.slice(0, 18) + "…" : p.packageName,
        full: p.packageName,
        tehsil: p.tehsilName,
        accepted: p.accepted,
        pending: p.pendingReview,
        draft: p.draft,
        rejected: p.rejected,
        total: p.total,
        acceptanceRate: p.total > 0 ? Math.round((p.accepted / p.total) * 100) : 0,
      })),
    [rows],
  );

  const stackedConfig: ChartConfig = {
    accepted: { label: "Accepted", color: "var(--impact-positive)" },
    pending: { label: "Pending", color: "var(--impact-warning)" },
    draft: { label: "Draft", color: "var(--impact-neutral)" },
    rejected: { label: "Rejected", color: "var(--impact-negative)" },
  };

  if (rows.length === 0) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4" />Procurement package linkage
          </CardTitle>
          <CardDescription>No response activity for current filters.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="size-4 text-primary" />
          Procurement package — response status comparison
          <AnalysisInfo
            meaning="This compares procurement packages by accepted, pending, draft, and rejected responses, along with package-level acceptance rate."
            role="Use this to see which packages are performing well, which ones are stalled in review, and where contractor or field-team follow-up is needed."
          />
        </CardTitle>
        <CardDescription>
          Stacked bars show accepted / pending / draft / rejected per package.
          Click a table row to drill into that package.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Stacked bar */}
        <ChartContainer config={stackedConfig} className="h-[260px] w-full">
          <BarChart data={barData} margin={{ left: 8, right: 8, top: 8, bottom: 40 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              tick={{ fontSize: 10 }}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]!.payload as (typeof barData)[0];
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                    <p className="font-medium">{d.full}</p>
                    <p className="text-muted-foreground">{d.tehsil}</p>
                    <p>Accepted: <strong>{d.accepted}</strong> ({d.acceptanceRate}%)</p>
                    <p>Pending: <strong>{d.pending}</strong></p>
                    <p>Draft: <strong>{d.draft}</strong></p>
                    <p>Rejected: <strong>{d.rejected}</strong></p>
                    <p>Total: <strong>{d.total}</strong></p>
                  </div>
                );
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="accepted" stackId="a" fill="var(--impact-positive)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="var(--impact-warning)" />
            <Bar dataKey="draft" stackId="a" fill="var(--impact-neutral)" />
            <Bar dataKey="rejected" stackId="a" fill="var(--impact-negative)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Tehsil</TableHead>
                <TableHead className="text-right">Accepted</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Draft</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acceptance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((pkg) => {
                const rate = pkg.total > 0 ? Math.round((pkg.accepted / pkg.total) * 100) : 0;
                const selected = pkg.packageId === selectedPackageId;
                return (
                  <TableRow
                    key={pkg.packageId}
                    className={cn("cursor-pointer", selected && "bg-primary/5")}
                    onClick={() => onPackageChange(selected ? null : pkg.packageId)}
                  >
                    <TableCell className="font-medium">{pkg.packageName}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.tehsilName}</TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--impact-positive)]">{pkg.accepted}</TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--impact-warning)]">{pkg.pendingReview}</TableCell>
                    <TableCell className="text-right tabular-nums">{pkg.draft}</TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--impact-negative)]">{pkg.rejected}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{pkg.total}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium",
                        rate >= 60 ? IMPACT_CHIP_CLASSES.positive :
                        rate >= 35 ? IMPACT_CHIP_CLASSES.neutral :
                        rate >= 15 ? IMPACT_CHIP_CLASSES.warning :
                        IMPACT_CHIP_CLASSES.negative
                      )}>
                        {rate}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Question insights ────────────────────────────────────────────────────────

function ChoiceFieldBreakdown({ field }: { field: SurveyFormAnalyticsFieldBreakdown }) {
  const rows = useMemo(
    () =>
      Object.entries(field.choiceCounts ?? {})
        .map(([answer, count], i) => ({
          answer,
          count,
          fill: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length],
        }))
        .sort((a, b) => b.count - a.count),
    [field.choiceCounts],
  );
  const total = rows.reduce((s, r) => s + r.count, 0);
  const config = Object.fromEntries(
    rows.map((r) => [r.answer, { label: r.answer, color: r.fill }]),
  ) satisfies ChartConfig;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{field.label}</p>
          <p className="text-xs text-muted-foreground">{field.answeredCount} responses · {fmt(total)} selections</p>
        </div>
        <Badge variant="outline" className="tabular-nums">{rows.length} options</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
        <ChartContainer config={config} className="mx-auto h-[160px] w-full max-w-[160px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={rows} dataKey="count" nameKey="answer" innerRadius={36} outerRadius={68} paddingAngle={2}>
              {rows.map((r, i) => <Cell key={i} fill={r.fill} />)}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="space-y-1.5">
          {rows.map((row) => {
            const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
            const w = total > 0 ? Math.round((row.count / rows[0]!.count) * 100) : 0;
            return (
              <div key={row.answer} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: row.fill }} />
                    <span className="truncate text-muted-foreground">{row.answer}</span>
                  </div>
                  <span className="shrink-0 tabular-nums font-medium">{row.count} ({pct}%)</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${w}%`, background: impactBarGradient(row.fill) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NumericFieldBreakdown({ field }: { field: SurveyFormAnalyticsFieldBreakdown }) {
  const numeric = field.numeric;
  if (!numeric) return null;
  const gaugeData = [
    { name: "Avg", value: Number(numeric.avg.toFixed(1)), fill: "var(--chart-1)" },
    { name: "Min", value: numeric.min, fill: "var(--chart-3)" },
    { name: "Max", value: numeric.max, fill: "var(--chart-2)" },
  ];
  const config: ChartConfig = {
    Avg: { label: "Average", color: "var(--chart-1)" },
    Min: { label: "Min", color: "var(--chart-3)" },
    Max: { label: "Max", color: "var(--chart-2)" },
  };
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{field.label}</p>
          <p className="text-xs text-muted-foreground">Numeric summary · {numeric.count} answered</p>
        </div>
        <Hash className="size-4 text-muted-foreground" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ChartContainer
          config={config}
          className="h-[180px] min-w-0 w-full overflow-visible"
        >
          <BarChart data={gaugeData} margin={{ left: 12, right: 12, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              allowDecimals
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {gaugeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-2 content-start">
          {[
            { label: "Average", value: numeric.avg, color: "var(--chart-1)" },
            { label: "Min", value: numeric.min, color: "var(--chart-3)" },
            { label: "Max", value: numeric.max, color: "var(--chart-2)" },
            { label: "Sum", value: numeric.sum, color: "var(--chart-4)" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: s.color }}>
                {Number.isInteger(s.value) ? fmt(s.value) : s.value.toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionDemographics({ fields }: { fields: SurveyFormAnalyticsFieldBreakdown[] }) {
  const choiceFields = useMemo(
    () => fields.filter((f) => CHOICE_FIELD_TYPES.has(f.type) && f.choiceCounts && Object.keys(f.choiceCounts).length > 0),
    [fields],
  );
  const numericFields = useMemo(
    () => fields.filter((f) => f.numeric && f.numeric.count > 0),
    [fields],
  );

  // Radar chart for multi-choice field comparison (up to 8 fields, top answer share)
  const radarData = useMemo(() => {
    return choiceFields.slice(0, 8).map((f) => {
      const counts = Object.values(f.choiceCounts ?? {});
      const total = counts.reduce((s, n) => s + n, 0);
      const top = Math.max(...counts, 0);
      return {
        subject: f.label.length > 22 ? f.label.slice(0, 22) + "…" : f.label,
        fullLabel: f.label,
        dominance: total > 0 ? Math.round((top / total) * 100) : 0,
        answered: f.answeredCount,
      };
    });
  }, [choiceFields]);

  const radarConfig: ChartConfig = {
    dominance: { label: "Top-answer dominance %", color: "var(--chart-1)" },
  };

  if (choiceFields.length === 0 && numericFields.length === 0) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" />Question-level insights
          </CardTitle>
          <CardDescription>No multiple-choice or numeric answers in the current filter.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4 text-primary" />
          Question-level insights
          <AnalysisInfo
            meaning="This shows how people are answering form questions. It highlights whether one answer dominates or whether responses are mixed."
            role="Use this to interpret what field teams are actually reporting, not just how many forms were submitted."
          />
        </CardTitle>
        <CardDescription>
          Radar shows how concentrated each field's answers are (high % = one dominant answer).
          Drill into individual questions below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Radar overview */}
        {radarData.length >= 3 ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Answer dominance radar — % of responses picking the top answer per question
            </p>
            <ChartContainer config={radarConfig} className="mx-auto h-[280px] max-w-[500px] w-full">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <Radar
                  dataKey="dominance"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]!.payload as (typeof radarData)[0];
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{d.fullLabel}</p>
                        <p className="text-muted-foreground">Top-answer dominance: {d.dominance}%</p>
                        <p className="text-muted-foreground">{d.answered} responses answered</p>
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ChartContainer>
          </div>
        ) : null}

        {/* Individual choice breakdowns */}
        {choiceFields.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Choice fields ({choiceFields.length})
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {choiceFields.map((f) => <ChoiceFieldBreakdown key={f.fieldId} field={f} />)}
            </div>
          </div>
        ) : null}

        {/* Numeric breakdowns */}
        {numericFields.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Numeric fields ({numericFields.length})
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {numericFields.map((f) => <NumericFieldBreakdown key={f.fieldId} field={f} />)}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── Submissions timeline ─────────────────────────────────────────────────────

function SubmissionsOverTime({ series }: { series: SurveyFormAnalyticsTimePoint[] }) {
  const chartData = useMemo(
    () =>
      series
        .filter((p) => p.count > 0)
        .map((p) => ({ date: p.date, label: p.date.slice(5), count: p.count })),
    [series],
  );

  // 7-day rolling average
  const withRolling = useMemo(() => {
    return chartData.map((d, i) => {
      const window = chartData.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((s, x) => s + x.count, 0) / window.length;
      return { ...d, rolling: Math.round(avg * 10) / 10 };
    });
  }, [chartData]);

  const config: ChartConfig = {
    count: { label: "Daily accepted", color: "var(--chart-1)" },
    rolling: { label: "7-day avg", color: "var(--chart-2)" },
  };

  if (chartData.length === 0) return null;

  const peak = Math.max(...chartData.map((d) => d.count));
  const peakDay = chartData.find((d) => d.count === peak);
  const totalInWindow = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              Submission trend — accepted responses
              <AnalysisInfo
                meaning="This tracks accepted responses over time and compares each day with the recent 7-day average."
                role="Use this to understand whether field reporting is accelerating, stable, or slowing down over the selected period."
              />
            </CardTitle>
            <CardDescription>
              Daily volume + 7-day rolling average. Identify acceleration and slowdown periods.
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <div className="rounded-lg border bg-card px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Peak day</p>
              <p className="text-lg font-semibold tabular-nums text-[var(--chart-1)]">{peak}</p>
              <p className="text-[10px] text-muted-foreground">{peakDay?.label}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">In window</p>
              <p className="text-lg font-semibold tabular-nums text-[var(--chart-2)]">{fmt(totalInWindow)}</p>
              <p className="text-[10px] text-muted-foreground">total</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={withRolling} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                    <p className="font-medium">{label}</p>
                    <p>Daily: <strong>{payload.find(p => p.dataKey === "count")?.value}</strong></p>
                    <p>7-day avg: <strong>{payload.find(p => p.dataKey === "rolling")?.value}</strong></p>
                  </div>
                );
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="count" fill="var(--chart-1)" radius={[3, 3, 0, 0]} opacity={0.8} />
            <Line dataKey="rolling" type="monotone" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyFilterState() {
  return (
    <Card className="border-dashed shadow-sm">
      <CardContent className="flex items-start gap-3 p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">No data for this filter</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try selecting all packages, widening the date window, or waiting for more accepted responses.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

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
  const selectedPackage = packages.find((p) => p.packageId === selectedPackageId);
  const dateLabel = formatAnalyticsDateLabel(submittedFrom, submittedTo);
  const hasResponses = (analytics?.summary.accepted ?? 0) > 0;
  const executiveFindings = useMemo(() => {
    if (!analytics) return [];
    const tehsilTotal = analytics.byTehsil.reduce((sum, row) => sum + row.accepted, 0);
    const tehsilAlerts = deriveTehsilAlerts(
      analytics.byTehsil,
      analytics.byProcurementPackage,
      tehsilTotal,
    );
    return deriveExecutiveFindings(analytics, tehsilAlerts);
  }, [analytics]);

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
        <ActiveScopeSummary analytics={analytics} selectedPackage={selectedPackage} dateLabel={dateLabel} />
      ) : null}

      {analytics && hasResponses ? (
        <ExecutiveFindingsPanel findings={executiveFindings} />
      ) : null}

      {!hasResponses && analytics ? <EmptyFilterState /> : null}

      {analytics && hasResponses ? (
        <>
          <ProcurementPackageLinkage
            packages={packages}
            selectedPackageId={selectedPackageId}
            onPackageChange={onPackageChange}
          />

          {analytics.cesmpInsights ? (
            <CesmpAnalyticsDashboard insights={analytics.cesmpInsights} selectedPackageId={selectedPackageId} />
          ) : null}

          <GeographicDemographics analytics={analytics} />

          <QuestionDemographics fields={analytics.fieldBreakdown} />

          <SubmissionsOverTime series={analytics.submissionsOverTime} />
        </>
      ) : null}
    </div>
  );
}
