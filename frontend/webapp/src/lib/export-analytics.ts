/**
 * Export a SurveyFormAnalytics payload to a multi-sheet Excel workbook.
 *
 * Sheets produced:
 *  1. Summary          – KPI snapshot (accepted, pending, drafts, packages …)
 *  2. By Tehsil        – accepted response counts per tehsil
 *  3. By Village       – accepted response counts per village
 *  4. Package Linkage  – all procurement packages with status breakdown
 *  5. Question Insights– one row per choice-question option / numeric stat
 *  6. Submissions Over Time – daily accepted counts (non-zero days)
 *  7. C-ESMP Summary   – CESMP programme-level KPIs (if present)
 *  8. C-ESMP Packages  – per-package budget + HSE data (if present)
 *  9. C-ESMP Compliance– PPE / noise / dust pattern counts (if present)
 * 10. C-ESMP Training  – training titles + participants (if present)
 */

import * as XLSX from "xlsx";
import type { SurveyFormAnalytics } from "@/modules/api/survey-types";

type Cell = string | number | boolean | null;
type Row = Cell[];
type Sheet = { name: string; rows: Row[] };

// ─── helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): string {
  return d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`;
}

function yesNo(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v ? "Yes" : "No";
}

function buildSheet(name: string, rows: Row[]): Sheet {
  return { name, rows };
}

// ─── sheet builders ───────────────────────────────────────────────────────────

function summarySheet(
  analytics: SurveyFormAnalytics,
  dateLabel: string,
  packageLabel: string,
): Sheet {
  const { summary, form } = analytics;
  const rows: Row[] = [
    ["ESMS — Environment & Social Management System"],
    ["Form Dashboard Report"],
    [],
    ["Form Title", form.title],
    ["Form Status", form.status],
    ["Package Scope", packageLabel],
    ["Date Window", dateLabel],
    ["Generated At", new Date().toLocaleString()],
    [],
    ["KPI", "Value"],
    ["Accepted Responses", summary.accepted],
    ["Pending Review", summary.pendingReview],
    ["Draft Responses", summary.draft],
    ["Rejected Responses", summary.rejected],
    ["Reverted Responses", summary.reverted],
    ["Total Responses", summary.totalResponses],
    ["Procurement Packages", summary.packageCount],
    ["Assignments", summary.assignmentCount],
    ["Villages with Accepted Responses", analytics.byVillage.length],
    ["Tehsils with Accepted Responses", analytics.byTehsil.length],
  ];
  return buildSheet("Summary", rows);
}

function tehsilSheet(analytics: SurveyFormAnalytics): Sheet {
  const total = analytics.byTehsil.reduce((s, r) => s + r.accepted, 0);
  const rows: Row[] = [
    ["By Tehsil — Accepted Responses"],
    [],
    ["Tehsil", "Accepted", "Share (%)"],
    ...analytics.byTehsil.map((r) => [
      r.tehsilName,
      r.accepted,
      pct(r.accepted, total),
    ]),
    [],
    ["Total", total, "100%"],
  ];
  return buildSheet("By Tehsil", rows);
}

function villageSheet(analytics: SurveyFormAnalytics): Sheet {
  const total = analytics.byVillage.reduce((s, r) => s + r.accepted, 0);
  const rows: Row[] = [
    ["By Village — Accepted Responses"],
    [],
    ["Village", "Tehsil", "Accepted", "Share (%)"],
    ...analytics.byVillage.map((r) => [
      r.villageName,
      r.tehsilName,
      r.accepted,
      pct(r.accepted, total),
    ]),
    [],
    ["Total", "", total, "100%"],
  ];
  return buildSheet("By Village", rows);
}

function packageSheet(analytics: SurveyFormAnalytics): Sheet {
  const rows: Row[] = [
    ["Procurement Package Linkage"],
    [],
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
    ],
    ...analytics.byProcurementPackage.map((p) => [
      p.packageName,
      p.tehsilName,
      p.accepted,
      p.pendingReview,
      p.draft,
      p.rejected,
      p.reverted,
      p.total,
      pct(p.accepted, p.total),
    ]),
  ];
  return buildSheet("Package Linkage", rows);
}

function questionSheet(analytics: SurveyFormAnalytics): Sheet {
  const rows: Row[] = [
    ["Question-Level Insights — Accepted Responses"],
    [],
  ];

  const choiceTypes = new Set(["CHECKBOXES", "MULTIPLE_CHOICE", "DROPDOWN"]);

  let hasData = false;

  for (const field of analytics.fieldBreakdown) {
    if (
      choiceTypes.has(field.type) &&
      field.choiceCounts &&
      Object.keys(field.choiceCounts).length > 0
    ) {
      hasData = true;
      const total = Object.values(field.choiceCounts).reduce(
        (s, n) => s + n,
        0,
      );
      rows.push([`Question: ${field.label}`]);
      rows.push([
        `${field.answeredCount} responses answered`,
        `${total} total selections`,
      ]);
      rows.push(["Answer Option", "Count", "Share (%)"]);
      const sorted = Object.entries(field.choiceCounts).sort(
        ([, a], [, b]) => b - a,
      );
      for (const [answer, count] of sorted) {
        rows.push([answer, count, pct(count, total)]);
      }
      rows.push([]);
    } else if (field.numeric && field.numeric.count > 0) {
      hasData = true;
      const n = field.numeric;
      rows.push([`Question: ${field.label}  [Numeric]`]);
      rows.push([
        "Metric",
        "Average",
        "Min",
        "Max",
        "Sum",
        "Answered Responses",
      ]);
      rows.push([
        "Value",
        Number(n.avg.toFixed(2)),
        n.min,
        n.max,
        n.sum,
        n.count,
      ]);
      rows.push([]);
    }
  }

  if (!hasData) {
    rows.push([
      "No multiple-choice or numeric question data in the current filter.",
    ]);
  }

  return buildSheet("Question Insights", rows);
}

function timelineSheet(analytics: SurveyFormAnalytics): Sheet {
  const active = analytics.submissionsOverTime.filter((p) => p.count > 0);
  const rows: Row[] = [
    ["Accepted Submissions Over Time (daily, last 90 days)"],
    [],
    ["Date", "Accepted Count"],
    ...active.map((p) => [p.date, p.count]),
  ];
  if (active.length === 0) {
    rows.push(["No data in the current filter window."]);
  }
  return buildSheet("Timeline", rows);
}

function cesmpSummarySheet(analytics: SurveyFormAnalytics): Sheet | null {
  const c = analytics.cesmpInsights;
  if (!c) return null;
  const s = c.summary;
  const b = c.budget;
  const rows: Row[] = [
    ["C-ESMP Programme Summary"],
    [],
    ["Metric", "Value"],
    ["Total Contractors", s.totalContractors],
    ["Total Procurement Packages", s.totalProcurementPackages],
    ["Total Villages Covered", s.totalVillageCoverage],
    ["Total Site Visits Submitted", s.totalSiteVisitsSubmitted],
    ["HSE Staff Hired (packages)", s.hseStaffHiredPackages],
    ["HSE Staff Hire Rate", `${Math.round(s.hseStaffHiredRate * 100)}%`],
    ["C-ESMP Plan Submitted (packages)", s.cesmpPlanSubmittedPackages],
    [],
    ["Budget Utilization"],
    ["Total Allocated (PKR)", b.totalAllocated],
    ["Total Utilized (PKR)", b.totalUtilized],
    ["Total Remaining (PKR)", b.totalRemaining],
    ["Overall Utilization Rate", `${Math.round(b.overallUtilizationRate * 100)}%`],
    [],
    ["Budget by Head"],
    ["PPE (PKR)", b.byHead.ppe],
    ["HSE (PKR)", b.byHead.hse],
    ["Environmental Monitoring (PKR)", b.byHead.environmentalMonitoring],
    [],
    ["Training"],
    ["Responses with Training", c.training.responsesWithTraining],
    ["Total Participants", c.training.totalParticipants],
  ];
  return buildSheet("C-ESMP Summary", rows);
}

function cesmpPackagesSheet(analytics: SurveyFormAnalytics): Sheet | null {
  const c = analytics.cesmpInsights;
  if (!c || c.packages.length === 0) return null;
  const rows: Row[] = [
    ["C-ESMP Per-Package Data"],
    [],
    [
      "Package",
      "Tehsil",
      "Contractor",
      "Consultant",
      "Budget Allocated (PKR)",
      "Budget Utilized (PKR)",
      "Budget Remaining (PKR)",
      "Utilization Rate",
      "Villages Covered",
      "Site Visits Submitted",
      "HSE Staff Hired",
      "C-ESMP Plan Submitted",
      "PPE Budget (PKR)",
      "HSE Budget (PKR)",
      "Env. Monitoring Budget (PKR)",
    ],
    ...c.packages.map((p) => [
      p.packageName,
      p.tehsilName,
      p.contractorName,
      p.consultantName,
      p.budgetAllocated,
      p.budgetUtilized,
      p.budgetRemaining,
      `${Math.round(p.utilizationRate * 100)}%`,
      p.villagesCovered,
      p.siteVisitsSubmitted,
      yesNo(p.hseStaffHired),
      yesNo(p.cesmpPlanSubmitted),
      p.budgetByHead.ppe,
      p.budgetByHead.hse,
      p.budgetByHead.environmentalMonitoring,
    ]),
  ];
  return buildSheet("C-ESMP Packages", rows);
}

function cesmpComplianceSheet(analytics: SurveyFormAnalytics): Sheet | null {
  const c = analytics.cesmpInsights;
  if (!c) return null;

  const patterns: Array<[string, string, Record<string, number>, number]> = [
    ["PPE", "Wearing Rate", c.ppeCompliance.wearingRate.counts, c.ppeCompliance.wearingRate.total],
    ["PPE", "Good Condition", c.ppeCompliance.goodCondition.counts, c.ppeCompliance.goodCondition.total],
    ["Noise", "Level", c.noise.level.counts, c.noise.level.total],
    ["Noise", "Reduction Measures", c.noise.reductionMeasures.counts, c.noise.reductionMeasures.total],
    ["Dust", "Level", c.dust.level.counts, c.dust.level.total],
    ["Dust", "Reduction Measures", c.dust.reductionMeasures.counts, c.dust.reductionMeasures.total],
  ];

  const rows: Row[] = [
    ["C-ESMP Compliance Patterns"],
    [],
    ["Category", "Indicator", "Answer", "Count", "Total Responses", "Share (%)"],
  ];

  for (const [category, indicator, counts, total] of patterns) {
    const entries = Object.entries(counts).sort(([, a], [, b]) => b - a);
    for (const [answer, count] of entries) {
      rows.push([category, indicator, answer, count, total, pct(count, total)]);
    }
  }

  return buildSheet("C-ESMP Compliance", rows);
}

function cesmpTrainingSheet(analytics: SurveyFormAnalytics): Sheet | null {
  const c = analytics.cesmpInsights;
  if (!c || c.training.topTrainings.length === 0) return null;
  const rows: Row[] = [
    ["C-ESMP Training Data"],
    [],
    ["Training Title", "Sessions Count", "Total Participants"],
    ...c.training.topTrainings.map((t) => [t.title, t.count, t.participants]),
    [],
    ["Training Venues"],
    ["Venue", "Count"],
    ...Object.entries(c.training.venues)
      .sort(([, a], [, b]) => b - a)
      .map(([venue, count]) => [venue, count]),
  ];
  return buildSheet("C-ESMP Training", rows);
}

// ─── main export function ────────────────────────────────────────────────────

export function exportAnalyticsToExcel(
  analytics: SurveyFormAnalytics,
  dateLabel: string,
  packageLabel: string,
): void {
  const wb = XLSX.utils.book_new();

  const sheets: (Sheet | null)[] = [
    summarySheet(analytics, dateLabel, packageLabel),
    tehsilSheet(analytics),
    villageSheet(analytics),
    packageSheet(analytics),
    questionSheet(analytics),
    timelineSheet(analytics),
    cesmpSummarySheet(analytics),
    cesmpPackagesSheet(analytics),
    cesmpComplianceSheet(analytics),
    cesmpTrainingSheet(analytics),
  ];

  for (const sheet of sheets) {
    if (!sheet) continue;
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);

    // Auto column widths (capped at 60)
    const colWidths = sheet.rows.reduce<number[]>((widths, row) => {
      row.forEach((cell, i) => {
        const len = cell == null ? 0 : String(cell).length;
        widths[i] = Math.min(Math.max(widths[i] ?? 10, len + 2), 60);
      });
      return widths;
    }, []);
    ws["!cols"] = colWidths.map((w) => ({ wch: w }));

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  const filename = `ESMS_Analytics_${analytics.form.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
