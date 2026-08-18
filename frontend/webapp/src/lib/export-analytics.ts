import * as XLSX from "xlsx";
import type {
  CesmpFormInsights,
  SurveyFormAnalytics,
} from "@/modules/api/survey-types";

type Cell = string | number | boolean | null;
type Row = Cell[];
type SheetDef = {
  name: string;
  rows: Row[];
  colWidths?: Record<number, number>;
};

type PackageAnalyticsExport = {
  packageId: string;
  packageName: string;
  tehsilName: string;
  analytics: SurveyFormAnalytics;
};

type TehsilHealthRow = {
  tehsilName: string;
  accepted: number;
  pendingReview: number;
  draft: number;
  rejected: number;
  reverted: number;
  totalActivity: number;
  acceptanceRate: number;
  coverageShare: number;
  issueCategory: string;
  interpretation: string;
};

function pct(n: number, d: number, decimals = 0): string {
  if (d === 0) return "0%";
  const value = (n / d) * 100;
  return `${decimals > 0 ? value.toFixed(decimals) : Math.round(value)}%`;
}

function yesNo(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "Not Reported";
  return v ? "Yes" : "No";
}

function blank(): Row {
  return [];
}

function acceptanceBand(rate: number): string {
  if (rate < 25) return "Critical";
  if (rate < 45) return "Attention";
  if (rate < 60) return "Moderate";
  return "Healthy";
}

function coverageBand(share: number): string {
  if (share < 5) return "Critical";
  if (share < 10) return "Attention";
  if (share < 20) return "Moderate";
  return "Healthy";
}

function budgetBand(rate: number): string {
  if (rate >= 95) return "Critical";
  if (rate >= 85) return "Attention";
  if (rate >= 60) return "Moderate";
  return "Healthy";
}

function rollingAvg(values: number[], idx: number, window = 7): number {
  const slice = values.slice(Math.max(0, idx - window + 1), idx + 1);
  return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}

function applyColWidths(
  ws: XLSX.WorkSheet,
  rows: Row[],
  overrides: Record<number, number> = {},
): void {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, index) => {
      const len = cell == null ? 0 : String(cell).length;
      widths[index] = Math.min(Math.max(widths[index] ?? 10, len + 2), 56);
    });
  }
  Object.entries(overrides).forEach(([index, width]) => {
    widths[Number(index)] = width;
  });
  ws["!cols"] = widths.map((width) => ({ wch: width ?? 12 }));
}

function makeSheet(def: SheetDef): { name: string; ws: XLSX.WorkSheet } {
  const ws = XLSX.utils.aoa_to_sheet(def.rows);
  applyColWidths(ws, def.rows, def.colWidths);
  return { name: def.name, ws };
}

function buildTehsilHealthRows(analytics: SurveyFormAnalytics): TehsilHealthRow[] {
  const acceptedTotal = analytics.byTehsil.reduce((sum, row) => sum + row.accepted, 0);
  const avgShare = analytics.byTehsil.length > 0 ? 100 / analytics.byTehsil.length : 0;

  return analytics.byTehsil
    .map((tehsil) => {
      const tehsilPackages = analytics.byProcurementPackage.filter(
        (pkg) => pkg.tehsilId === tehsil.tehsilId,
      );
      const pendingReview = tehsilPackages.reduce((sum, pkg) => sum + pkg.pendingReview, 0);
      const draft = tehsilPackages.reduce((sum, pkg) => sum + pkg.draft, 0);
      const rejected = tehsilPackages.reduce((sum, pkg) => sum + pkg.rejected, 0);
      const reverted = tehsilPackages.reduce((sum, pkg) => sum + pkg.reverted, 0);
      const totalActivity = tehsil.accepted + pendingReview + draft + rejected + reverted;
      const acceptanceRate =
        totalActivity > 0 ? Math.round((tehsil.accepted / totalActivity) * 100) : 0;
      const coverageShare =
        acceptedTotal > 0 ? Math.round((tehsil.accepted / acceptedTotal) * 100) : 0;

      let issueCategory = "Healthy";
      let interpretation = "Balanced coverage and acceptable review performance.";

      if (coverageShare < 5 || acceptanceRate < 25) {
        issueCategory = "Critical";
        interpretation =
          coverageShare < 5
            ? `Accepted-response share is only ${coverageShare}% versus an equal-distribution benchmark of ${Math.round(avgShare)}%.`
            : `Only ${acceptanceRate}% of responses from this tehsil are being accepted.`;
      } else if (
        coverageShare < 10 ||
        acceptanceRate < 45 ||
        pendingReview > tehsil.accepted
      ) {
        issueCategory = "Attention";
        interpretation =
          pendingReview > tehsil.accepted
            ? `Pending review volume (${pendingReview}) exceeds accepted volume (${tehsil.accepted}).`
            : coverageShare < 10
              ? `Coverage share is low at ${coverageShare}% compared with ${Math.round(avgShare)}% benchmark.`
              : `Acceptance rate is below target at ${acceptanceRate}%.`;
      } else if (coverageShare < 20 || acceptanceRate < 60) {
        issueCategory = "Moderate";
        interpretation = `Coverage share is ${coverageShare}% and acceptance rate is ${acceptanceRate}%; monitor but not critical.`;
      }

      return {
        tehsilName: tehsil.tehsilName,
        accepted: tehsil.accepted,
        pendingReview,
        draft,
        rejected,
        reverted,
        totalActivity,
        acceptanceRate,
        coverageShare,
        issueCategory,
        interpretation,
      };
    })
    .sort((a, b) => {
      const order = ["Critical", "Attention", "Moderate", "Healthy"];
      return (
        order.indexOf(a.issueCategory) - order.indexOf(b.issueCategory) ||
        a.acceptanceRate - b.acceptanceRate ||
        a.coverageShare - b.coverageShare
      );
    });
}

function coverSheet(
  analytics: SurveyFormAnalytics,
  dateLabel: string,
  packageLabel: string,
): SheetDef {
  const { summary, form } = analytics;
  const totalResponses =
    summary.accepted +
    summary.pendingReview +
    summary.draft +
    summary.rejected +
    summary.reverted;
  const acceptanceRate =
    totalResponses > 0 ? Math.round((summary.accepted / totalResponses) * 100) : 0;

  return {
    name: "Report Scope",
    rows: [
      ["Field", "Value"],
      ["Report Title", "Survey Form Analytics Report"],
      ["Form Title", form.title],
      ["Form Status", form.status],
      ["Package Scope", packageLabel],
      ["Date Window", dateLabel],
      [
        "Generated At",
        new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
      ],
      ["Accepted Responses", summary.accepted],
      ["Total Responses Across All Statuses", totalResponses],
      ["Overall Acceptance Rate", `${acceptanceRate}%`],
      ["Procurement Packages in Scope", summary.packageCount],
      ["Assignments in Scope", summary.assignmentCount],
      ["Tehsils with Accepted Responses", analytics.byTehsil.length],
      ["Villages with Accepted Responses", analytics.byVillage.length],
      blank(),
      [
        "Method Note",
        "Geographic and question-level analysis uses accepted responses unless a sheet explicitly states otherwise.",
      ],
    ],
    colWidths: { 0: 28, 1: 64 },
  };
}

function analystFindingsSheet(analytics: SurveyFormAnalytics): SheetDef {
  const rows: Row[] = [
    [
      "Finding ID",
      "Severity",
      "Domain",
      "Location",
      "Metric",
      "Value",
      "Threshold / Benchmark",
      "Interpretation",
      "Recommended Action",
    ],
  ];

  const tehsilHealth = buildTehsilHealthRows(analytics);
  for (const row of tehsilHealth.filter((item) => item.issueCategory !== "Healthy")) {
    rows.push([
      `TH-${rows.length}`,
      row.issueCategory,
      "Tehsil Health",
      row.tehsilName,
      row.acceptanceRate < 45 ? "Acceptance Rate" : "Coverage Share",
      row.acceptanceRate < 45 ? `${row.acceptanceRate}%` : `${row.coverageShare}%`,
      row.acceptanceRate < 45 ? "Target >= 45%" : "Benchmark >= 10% share",
      row.interpretation,
      row.issueCategory === "Critical"
        ? "Immediate field and review follow-up required."
        : "Increase monitoring attention and review submission quality.",
    ]);
  }

  const weakPackages = analytics.byProcurementPackage
    .filter((pkg) => pkg.total > 0)
    .map((pkg) => ({
      ...pkg,
      acceptanceRate: Math.round((pkg.accepted / pkg.total) * 100),
    }))
    .filter((pkg) => pkg.acceptanceRate < 35)
    .sort((a, b) => a.acceptanceRate - b.acceptanceRate);

  for (const pkg of weakPackages) {
    rows.push([
      `PK-${rows.length}`,
      pkg.acceptanceRate < 25 ? "Critical" : "Attention",
      "Package Performance",
      `${pkg.tehsilName} / ${pkg.packageName}`,
      "Acceptance Rate",
      `${pkg.acceptanceRate}%`,
      "Target >= 45%",
      "Package-level acceptance is weak, suggesting low submission quality or high review rejection.",
      "Review field completion with contractor and supervising staff.",
    ]);
  }

  const reviewPipeline = analytics.summary.accepted + analytics.summary.pendingReview;
  const backlogRate =
    reviewPipeline > 0
      ? Math.round((analytics.summary.pendingReview / reviewPipeline) * 100)
      : 0;
  if (backlogRate >= 20) {
    rows.push([
      `RV-${rows.length}`,
      backlogRate >= 40 ? "Attention" : "Moderate",
      "Review Workflow",
      "All Scope",
      "Pending Review Share",
      `${backlogRate}%`,
      "Target < 20%",
      "A large share of reviewed responses is still awaiting acceptance decision.",
      "Clear review backlog before additional field cycles increase queue pressure.",
    ]);
  }

  const c = analytics.cesmpInsights;
  if (c) {
    if (c.summary.hseStaffHiredRate < 100) {
      rows.push([
        `CE-${rows.length}`,
        c.summary.hseStaffHiredRate < 50 ? "Critical" : "Attention",
        "C-ESMP Staffing",
        "All Scope",
        "HSE Staff Hired Rate",
        `${c.summary.hseStaffHiredRate}%`,
        "Target = 100%",
        `${c.summary.totalProcurementPackages - c.summary.hseStaffHiredPackages} packages report no HSE staff hired.`,
        "Issue compliance notices to packages without HSE staff.",
      ]);
    }

    if (c.budget.overallUtilizationRate >= 85) {
      rows.push([
        `BG-${rows.length}`,
        c.budget.overallUtilizationRate >= 95 ? "Critical" : "Attention",
        "C-ESMP Budget",
        "All Scope",
        "Budget Utilization",
        `${c.budget.overallUtilizationRate}%`,
        "Attention >= 85%",
        "Remaining ESMP budget headroom is limited.",
        "Review remaining ESMP commitments and consider supplementary allocation.",
      ]);
    }
  }

  if (rows.length === 1) {
    rows.push([
      "NF-1",
      "Healthy",
      "Overall",
      "All Scope",
      "Finding Status",
      "No major exceptions",
      "—",
      "No tehsil, package, workflow, or C-ESMP threshold breached the configured alert logic.",
      "Continue routine monitoring.",
    ]);
  }

  return {
    name: "Analyst Findings",
    rows,
    colWidths: { 0: 12, 1: 12, 2: 18, 3: 28, 4: 20, 5: 14, 6: 22, 7: 54, 8: 44 },
  };
}

function summarySheet(
  analytics: SurveyFormAnalytics,
  dateLabel: string,
  packageLabel: string,
): SheetDef {
  const { summary } = analytics;
  const totalResponses =
    summary.accepted +
    summary.pendingReview +
    summary.draft +
    summary.rejected +
    summary.reverted;

  return {
    name: "Summary",
    rows: [
      ["Metric", "Value", "Rate / Share", "Scope"],
      ["Accepted", summary.accepted, pct(summary.accepted, totalResponses), `${packageLabel} | ${dateLabel}`],
      ["Pending Review", summary.pendingReview, pct(summary.pendingReview, totalResponses), `${packageLabel} | ${dateLabel}`],
      ["Draft", summary.draft, pct(summary.draft, totalResponses), `${packageLabel} | ${dateLabel}`],
      ["Rejected", summary.rejected, pct(summary.rejected, totalResponses), `${packageLabel} | ${dateLabel}`],
      ["Reverted", summary.reverted, pct(summary.reverted, totalResponses), `${packageLabel} | ${dateLabel}`],
      ["Total Responses", totalResponses, "100%", `${packageLabel} | ${dateLabel}`],
      ["Procurement Packages", summary.packageCount, "", `${packageLabel} | ${dateLabel}`],
      ["Assignments", summary.assignmentCount, "", `${packageLabel} | ${dateLabel}`],
      ["Tehsils with Accepted Responses", analytics.byTehsil.length, "", `${packageLabel} | ${dateLabel}`],
      ["Villages with Accepted Responses", analytics.byVillage.length, "", `${packageLabel} | ${dateLabel}`],
    ],
    colWidths: { 0: 28, 1: 14, 2: 14, 3: 30 },
  };
}

function tehsilSheet(analytics: SurveyFormAnalytics): SheetDef {
  const rows = buildTehsilHealthRows(analytics);
  return {
    name: "Tehsil Health",
    rows: [
      [
        "Tehsil",
        "Accepted",
        "Pending Review",
        "Draft",
        "Rejected",
        "Reverted",
        "Total Activity",
        "Acceptance Rate",
        "Coverage Share of Accepted",
        "Issue Category",
        "Interpretation",
      ],
      ...rows.map((row) => [
        row.tehsilName,
        row.accepted,
        row.pendingReview,
        row.draft,
        row.rejected,
        row.reverted,
        row.totalActivity,
        `${row.acceptanceRate}%`,
        `${row.coverageShare}%`,
        row.issueCategory,
        row.interpretation,
      ]),
    ],
    colWidths: { 0: 22, 1: 10, 2: 14, 3: 10, 4: 10, 5: 10, 6: 14, 7: 14, 8: 20, 9: 16, 10: 56 },
  };
}

function villageSheet(analytics: SurveyFormAnalytics): SheetDef {
  const totalAccepted = analytics.byVillage.reduce((sum, row) => sum + row.accepted, 0);
  const rows = [...analytics.byVillage].sort((a, b) => b.accepted - a.accepted);
  return {
    name: "Village Health",
    rows: [
      ["Village", "Tehsil", "Accepted", "Share of Accepted", "Coverage Band"],
      ...rows.map((row) => {
        const share = totalAccepted > 0 ? Math.round((row.accepted / totalAccepted) * 100) : 0;
        return [row.villageName, row.tehsilName, row.accepted, `${share}%`, coverageBand(share)];
      }),
    ],
    colWidths: { 0: 28, 1: 22, 2: 10, 3: 18, 4: 16 },
  };
}

function packageSheet(analytics: SurveyFormAnalytics): SheetDef {
  const rows = [...analytics.byProcurementPackage]
    .filter((pkg) => pkg.total > 0)
    .sort((a, b) => (b.accepted - a.accepted) || a.packageName.localeCompare(b.packageName));

  return {
    name: "Package Performance",
    rows: [
      [
        "Package",
        "Tehsil",
        "Accepted",
        "Pending Review",
        "Draft",
        "Rejected",
        "Reverted",
        "Total",
        "Acceptance Rate",
        "Performance Band",
      ],
      ...rows.map((pkg) => {
        const rate = Math.round((pkg.accepted / pkg.total) * 100);
        return [
          pkg.packageName,
          pkg.tehsilName,
          pkg.accepted,
          pkg.pendingReview,
          pkg.draft,
          pkg.rejected,
          pkg.reverted,
          pkg.total,
          `${rate}%`,
          acceptanceBand(rate),
        ];
      }),
    ],
    colWidths: { 0: 34, 1: 20, 2: 10, 3: 14, 4: 10, 5: 10, 6: 10, 7: 10, 8: 14, 9: 16 },
  };
}

function questionSheet(analytics: SurveyFormAnalytics): SheetDef {
  const choiceTypes = new Set(["CHECKBOXES", "MULTIPLE_CHOICE", "DROPDOWN"]);
  const rows: Row[] = [
    [
      "Question",
      "Question Type",
      "Answer Option / Metric",
      "Value",
      "Share",
      "Answered Responses",
      "Interpretation",
    ],
  ];

  for (const field of analytics.fieldBreakdown) {
    if (
      choiceTypes.has(field.type) &&
      field.choiceCounts &&
      Object.keys(field.choiceCounts).length > 0
    ) {
      const sorted = Object.entries(field.choiceCounts).sort(([, a], [, b]) => b - a);
      const totalSelections = sorted.reduce((sum, [, count]) => sum + count, 0);
      const topShare = totalSelections > 0 ? Math.round((sorted[0]![1] / totalSelections) * 100) : 0;
      sorted.forEach(([answer, count], index) => {
        rows.push([
          field.label,
          field.type,
          answer,
          count,
          pct(count, totalSelections),
          field.answeredCount,
          index === 0
            ? topShare >= 70
              ? "Dominant answer pattern."
              : topShare >= 50
                ? "Moderately concentrated answer pattern."
                : "Answers are relatively distributed."
            : "",
        ]);
      });
    } else if (field.numeric && field.numeric.count > 0) {
      const numeric = field.numeric;
      rows.push(
        [field.label, "NUMERIC", "Average", Number(numeric.avg.toFixed(2)), "", numeric.count, "Mean across answered responses."],
        [field.label, "NUMERIC", "Min", numeric.min, "", numeric.count, "Lowest observed value."],
        [field.label, "NUMERIC", "Max", numeric.max, "", numeric.count, "Highest observed value."],
        [field.label, "NUMERIC", "Sum", numeric.sum, "", numeric.count, "Total of all numeric responses."],
      );
    }
  }

  if (rows.length === 1) {
    rows.push(["No question-level numeric or choice data available.", "", "", "", "", "", ""]);
  }

  return {
    name: "Question Insights",
    rows,
    colWidths: { 0: 34, 1: 20, 2: 28, 3: 12, 4: 12, 5: 16, 6: 42 },
  };
}

function packageDetailSummarySheet(
  packages: PackageAnalyticsExport[],
  dateLabel: string,
): SheetDef {
  const rows: Row[] = [
    [
      "Package",
      "Tehsil",
      "Accepted",
      "Pending Review",
      "Draft",
      "Rejected",
      "Reverted",
      "Total Responses",
      "Acceptance Rate",
      "Villages Covered",
      "Tehsils Covered",
      "Date Window",
    ],
  ];

  for (const item of packages) {
    const summary = item.analytics.summary;
    const total =
      summary.accepted +
      summary.pendingReview +
      summary.draft +
      summary.rejected +
      summary.reverted;
    rows.push([
      item.packageName,
      item.tehsilName,
      summary.accepted,
      summary.pendingReview,
      summary.draft,
      summary.rejected,
      summary.reverted,
      total,
      pct(summary.accepted, total),
      item.analytics.byVillage.length,
      item.analytics.byTehsil.length,
      dateLabel,
    ]);
  }

  return {
    name: "Package Detail",
    rows,
    colWidths: { 0: 34, 1: 18, 2: 10, 3: 14, 4: 10, 5: 10, 6: 10, 7: 12, 8: 14, 9: 14, 10: 14, 11: 16 },
  };
}

function packageQuestionSheet(packages: PackageAnalyticsExport[]): SheetDef {
  const choiceTypes = new Set(["CHECKBOXES", "MULTIPLE_CHOICE", "DROPDOWN"]);
  const rows: Row[] = [
    [
      "Package",
      "Tehsil",
      "Question",
      "Question Type",
      "Answer Option / Metric",
      "Value",
      "Share",
      "Answered Responses",
      "Interpretation",
    ],
  ];

  for (const item of packages) {
    for (const field of item.analytics.fieldBreakdown) {
      if (
        choiceTypes.has(field.type) &&
        field.choiceCounts &&
        Object.keys(field.choiceCounts).length > 0
      ) {
        const sorted = Object.entries(field.choiceCounts).sort(([, a], [, b]) => b - a);
        const totalSelections = sorted.reduce((sum, [, count]) => sum + count, 0);
        const topShare =
          totalSelections > 0
            ? Math.round((sorted[0]![1] / totalSelections) * 100)
            : 0;
        sorted.forEach(([answer, count], index) => {
          rows.push([
            item.packageName,
            item.tehsilName,
            field.label,
            field.type,
            answer,
            count,
            pct(count, totalSelections),
            field.answeredCount,
            index === 0
              ? topShare >= 70
                ? "Dominant answer pattern within this package."
                : topShare >= 50
                  ? "Moderately concentrated answers within this package."
                  : "Answers are distributed within this package."
              : "",
          ]);
        });
      } else if (field.numeric && field.numeric.count > 0) {
        const numeric = field.numeric;
        rows.push(
          [
            item.packageName,
            item.tehsilName,
            field.label,
            "NUMERIC",
            "Average",
            Number(numeric.avg.toFixed(2)),
            "",
            numeric.count,
            "Mean across answered responses for this package.",
          ],
          [
            item.packageName,
            item.tehsilName,
            field.label,
            "NUMERIC",
            "Min",
            numeric.min,
            "",
            numeric.count,
            "Lowest observed value for this package.",
          ],
          [
            item.packageName,
            item.tehsilName,
            field.label,
            "NUMERIC",
            "Max",
            numeric.max,
            "",
            numeric.count,
            "Highest observed value for this package.",
          ],
          [
            item.packageName,
            item.tehsilName,
            field.label,
            "NUMERIC",
            "Sum",
            numeric.sum,
            "",
            numeric.count,
            "Total of numeric responses for this package.",
          ],
        );
      }
    }
  }

  return {
    name: "Package Question Detail",
    rows,
    colWidths: { 0: 28, 1: 18, 2: 32, 3: 18, 4: 26, 5: 12, 6: 12, 7: 16, 8: 40 },
  };
}

function packageTimelineSheet(packages: PackageAnalyticsExport[]): SheetDef {
  const rows: Row[] = [
    ["Package", "Tehsil", "Date", "Accepted Responses"],
  ];

  for (const item of packages) {
    item.analytics.submissionsOverTime
      .filter((point) => point.count > 0)
      .forEach((point) => {
        rows.push([item.packageName, item.tehsilName, point.date, point.count]);
      });
  }

  return {
    name: "Package Timeline",
    rows,
    colWidths: { 0: 28, 1: 18, 2: 14, 3: 18 },
  };
}

function packageCesmpSheet(packages: PackageAnalyticsExport[]): SheetDef | null {
  const rows: Row[] = [
    [
      "Package",
      "Tehsil",
      "Contractor",
      "Consultant",
      "Allocated",
      "Utilized",
      "Remaining",
      "Utilization Rate",
      "Budget Band",
      "Villages Covered",
      "Site Visits Submitted",
      "HSE Staff Hired",
      "C-ESMP Plan Submitted",
    ],
  ];

  let hasRows = false;
  for (const item of packages) {
    const insights = item.analytics.cesmpInsights;
    if (!insights) continue;
    const pkg = insights.packages.find((entry) => entry.packageId === item.packageId);
    if (!pkg) continue;
    hasRows = true;
    rows.push([
      pkg.packageName,
      pkg.tehsilName,
      pkg.contractorName,
      pkg.consultantName,
      pkg.budgetAllocated,
      pkg.budgetUtilized,
      pkg.budgetRemaining,
      `${pkg.utilizationRate}%`,
      budgetBand(pkg.utilizationRate),
      pkg.villagesCovered,
      pkg.siteVisitsSubmitted,
      yesNo(pkg.hseStaffHired),
      yesNo(pkg.cesmpPlanSubmitted),
    ]);
  }

  if (!hasRows) return null;

  return {
    name: "Package C-ESMP Detail",
    rows,
    colWidths: { 0: 28, 1: 18, 2: 22, 3: 22, 4: 14, 5: 14, 6: 14, 7: 14, 8: 14, 9: 12, 10: 16, 11: 16, 12: 20 },
  };
}

function timelineSheet(analytics: SurveyFormAnalytics): SheetDef {
  const active = analytics.submissionsOverTime.filter((point) => point.count > 0);
  const counts = active.map((point) => point.count);
  return {
    name: "Submission Timeline",
    rows: [
      ["Date", "Accepted Responses", "7-Day Rolling Average", "Variance vs Rolling Average"],
      ...active.map((point, index) => {
        const average = rollingAvg(counts, index, 7);
        const variance = average > 0 ? Math.round(((point.count - average) / average) * 100) : 0;
        return [
          point.date,
          point.count,
          Number(average.toFixed(1)),
          `${variance > 0 ? "+" : ""}${variance}%`,
        ];
      }),
    ],
    colWidths: { 0: 14, 1: 18, 2: 22, 3: 24 },
  };
}

function cesmpSummarySheet(c: CesmpFormInsights): SheetDef {
  return {
    name: "C-ESMP Summary",
    rows: [
      ["Metric", "Value", "Interpretation"],
      ["Total Contractors", c.summary.totalContractors, ""],
      ["Total Procurement Packages", c.summary.totalProcurementPackages, ""],
      ["Total Villages Covered", c.summary.totalVillageCoverage, ""],
      ["Total Site Visits Submitted", c.summary.totalSiteVisitsSubmitted, ""],
      [
        "HSE Staff Hired Rate",
        `${c.summary.hseStaffHiredRate}%`,
        c.summary.hseStaffHiredRate < 100
          ? "Not all packages report HSE staff hired."
          : "All packages report HSE staff hired.",
      ],
      [
        "C-ESMP Budget Utilization",
        `${c.budget.overallUtilizationRate}%`,
        `${budgetBand(c.budget.overallUtilizationRate)} budget pressure.`,
      ],
      ["Total Budget Allocated", c.budget.totalAllocated, ""],
      ["Total Budget Utilized", c.budget.totalUtilized, ""],
      ["Total Budget Remaining", c.budget.totalRemaining, ""],
      ["Training Responses", c.training.responsesWithTraining, ""],
      ["Training Participants", c.training.totalParticipants, ""],
    ],
    colWidths: { 0: 30, 1: 18, 2: 48 },
  };
}

function cesmpPackagesSheet(c: CesmpFormInsights): SheetDef {
  const rows = [...c.packages].sort((a, b) => b.utilizationRate - a.utilizationRate);
  return {
    name: "C-ESMP Packages",
    rows: [
      [
        "Package",
        "Tehsil",
        "Contractor",
        "Consultant",
        "Allocated",
        "Utilized",
        "Remaining",
        "Utilization Rate",
        "Budget Band",
        "Villages Covered",
        "Site Visits Submitted",
        "HSE Staff Hired",
        "C-ESMP Plan Submitted",
      ],
      ...rows.map((pkg) => [
        pkg.packageName,
        pkg.tehsilName,
        pkg.contractorName,
        pkg.consultantName,
        pkg.budgetAllocated,
        pkg.budgetUtilized,
        pkg.budgetRemaining,
        `${pkg.utilizationRate}%`,
        budgetBand(pkg.utilizationRate),
        pkg.villagesCovered,
        pkg.siteVisitsSubmitted,
        yesNo(pkg.hseStaffHired),
        yesNo(pkg.cesmpPlanSubmitted),
      ]),
    ],
    colWidths: { 0: 28, 1: 18, 2: 22, 3: 22, 4: 14, 5: 14, 6: 14, 7: 14, 8: 14, 9: 12, 10: 16, 11: 16, 12: 20 },
  };
}

function cesmpComplianceSheet(c: CesmpFormInsights): SheetDef {
  const patterns: Array<{
    category: string;
    indicator: string;
    counts: Record<string, number>;
    total: number;
  }> = [
    {
      category: "PPE",
      indicator: "Wearing Rate",
      counts: c.ppeCompliance.wearingRate.counts,
      total: c.ppeCompliance.wearingRate.total,
    },
    {
      category: "PPE",
      indicator: "Good Condition",
      counts: c.ppeCompliance.goodCondition.counts,
      total: c.ppeCompliance.goodCondition.total,
    },
    {
      category: "Noise",
      indicator: "Level",
      counts: c.noise.level.counts,
      total: c.noise.level.total,
    },
    {
      category: "Noise",
      indicator: "Reduction Measures",
      counts: c.noise.reductionMeasures.counts,
      total: c.noise.reductionMeasures.total,
    },
    {
      category: "Dust",
      indicator: "Level",
      counts: c.dust.level.counts,
      total: c.dust.level.total,
    },
    {
      category: "Dust",
      indicator: "Reduction Measures",
      counts: c.dust.reductionMeasures.counts,
      total: c.dust.reductionMeasures.total,
    },
  ];

  const rows: Row[] = [["Category", "Indicator", "Answer", "Count", "Total Responses", "Share", "Interpretation"]];
  for (const pattern of patterns) {
    Object.entries(pattern.counts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([answer, count]) => {
        rows.push([
          pattern.category,
          pattern.indicator,
          answer,
          count,
          pattern.total,
          pct(count, pattern.total),
          "",
        ]);
      });
  }

  return {
    name: "C-ESMP Compliance",
    rows,
    colWidths: { 0: 14, 1: 24, 2: 30, 3: 10, 4: 16, 5: 12, 6: 28 },
  };
}

function cesmpTrainingSheet(c: CesmpFormInsights): SheetDef | null {
  if (c.training.topTrainings.length === 0) return null;
  const venueTotal = Object.values(c.training.venues).reduce((sum, value) => sum + value, 0);
  return {
    name: "C-ESMP Training",
    rows: [
      ["Section", "Name", "Count", "Participants / Share"],
      ...c.training.topTrainings.map((row) => [
        "Training",
        row.title,
        row.count,
        row.participants,
      ]),
      ...Object.entries(c.training.venues)
        .sort(([, a], [, b]) => b - a)
        .map(([venue, count]) => ["Venue", venue, count, pct(count, venueTotal)]),
    ],
    colWidths: { 0: 14, 1: 40, 2: 12, 3: 18 },
  };
}

export function exportAnalyticsToExcel(
  analytics: SurveyFormAnalytics,
  dateLabel: string,
  packageLabel: string,
  packageExports: PackageAnalyticsExport[] = [],
): void {
  const workbook = XLSX.utils.book_new();
  const cesmp = analytics.cesmpInsights ?? null;

  const sheets: Array<SheetDef | null> = [
    coverSheet(analytics, dateLabel, packageLabel),
    analystFindingsSheet(analytics),
    summarySheet(analytics, dateLabel, packageLabel),
    tehsilSheet(analytics),
    villageSheet(analytics),
    packageSheet(analytics),
    questionSheet(analytics),
    timelineSheet(analytics),
    ...(packageExports.length > 0
      ? [
          packageDetailSummarySheet(packageExports, dateLabel),
          packageQuestionSheet(packageExports),
          packageTimelineSheet(packageExports),
          packageCesmpSheet(packageExports),
        ]
      : []),
    cesmp ? cesmpSummarySheet(cesmp) : null,
    cesmp ? cesmpPackagesSheet(cesmp) : null,
    cesmp ? cesmpComplianceSheet(cesmp) : null,
    cesmp ? cesmpTrainingSheet(cesmp) : null,
  ];

  for (const sheet of sheets) {
    if (!sheet) continue;
    const { name, ws } = makeSheet(sheet);
    XLSX.utils.book_append_sheet(workbook, ws, name);
  }

  const safeTitle = analytics.form.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `ESMS_Report_${safeTitle}_${stamp}.xlsx`);
}
