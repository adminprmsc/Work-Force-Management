/**
 * Export a SurveyFormAnalytics payload to a richly formatted multi-sheet
 * Excel workbook.
 *
 * Sheets produced:
 *  1.  Cover               – report metadata, scope, generated timestamp
 *  2.  Analyst Findings    – auto-derived risk alerts (coverage gaps, budget, compliance)
 *  3.  Summary KPIs        – full KPI snapshot with acceptance rate
 *  4.  Tehsil Coverage     – accepted counts, share %, coverage health flag
 *  5.  Village Coverage    – accepted counts, share %, tehsil, coverage flag
 *  6.  Package Comparison  – stacked status breakdown + acceptance rate per package
 *  7.  Question Insights   – choice breakdowns with dominance %, numeric stats
 *  8.  Timeline (Daily)    – accepted per day + 7-day rolling average
 *  9.  C-ESMP Summary      – programme-level ESMP KPIs (if present)
 * 10.  C-ESMP Packages     – per-package budget + utilization + HSE data
 * 11.  C-ESMP Compliance   – PPE / noise / dust answer distributions
 * 12.  C-ESMP Training     – training sessions, participants, venues
 */

import * as XLSX from "xlsx";
import type { SurveyFormAnalytics, CesmpFormInsights } from "@/modules/api/survey-types";

// ─── types ────────────────────────────────────────────────────────────────────

type Cell = string | number | boolean | null;
type Row = Cell[];

interface SheetDef {
  name: string;
  rows: Row[];
  /** Column index → custom width override (chars) */
  colWidths?: Record<number, number>;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number, decimals = 0): string {
  if (d === 0) return "0%";
  const v = (n / d) * 100;
  return `${decimals > 0 ? v.toFixed(decimals) : Math.round(v)}%`;
}

function pkr(n: number): string {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function yesNo(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v ? "Yes" : "No";
}

function coverageFlag(sharePct: number): string {
  if (sharePct === 0) return "⛔ ZERO COVERAGE";
  if (sharePct < 5) return "🔴 Critical Gap";
  if (sharePct < 10) return "🟠 Below Target";
  if (sharePct < 20) return "🟡 Moderate";
  return "🟢 Adequate";
}

function budgetFlag(rate: number): string {
  if (rate >= 95) return "🔴 Near Exhausted";
  if (rate >= 85) return "🟠 High Utilization";
  if (rate >= 60) return "🟡 On Track";
  return "🟢 Underspent";
}

function acceptanceFlag(rate: number): string {
  if (rate >= 60) return "🟢 Good";
  if (rate >= 35) return "🟡 Moderate";
  if (rate >= 15) return "🟠 Low";
  return "🔴 Very Low";
}

function rollingAvg(data: number[], idx: number, window = 7): number {
  const slice = data.slice(Math.max(0, idx - window + 1), idx + 1);
  return slice.reduce((s, v) => s + v, 0) / slice.length;
}

function blank(): Row {
  return [];
}

// ─── auto column widths ───────────────────────────────────────────────────────

function applyColWidths(ws: XLSX.WorkSheet, rows: Row[], overrides: Record<number, number> = {}): void {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      const len = cell == null ? 0 : String(cell).length;
      widths[i] = Math.min(Math.max(widths[i] ?? 10, len + 2), 64);
    });
  }
  Object.entries(overrides).forEach(([i, w]) => {
    widths[Number(i)] = w;
  });
  ws["!cols"] = widths.map((w) => ({ wch: w ?? 12 }));
}

// ─── sheet helpers ────────────────────────────────────────────────────────────

function makeSheet(def: SheetDef): { name: string; ws: XLSX.WorkSheet } {
  const ws = XLSX.utils.aoa_to_sheet(def.rows);
  applyColWidths(ws, def.rows, def.colWidths ?? {});
  return { name: def.name, ws };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. COVER SHEET
// ═══════════════════════════════════════════════════════════════════════════════

function coverSheet(
  analytics: SurveyFormAnalytics,
  dateLabel: string,
  packageLabel: string,
): SheetDef {
  const { summary, form } = analytics;
  const totalSubmitted = summary.accepted + summary.pendingReview + summary.draft + summary.rejected + summary.reverted;
  const acceptanceRate = totalSubmitted > 0 ? Math.round((summary.accepted / totalSubmitted) * 100) : 0;

  const rows: Row[] = [
    ["ESMS — Environment & Social Management System"],
    ["Work Force Management Platform — Analytics Report"],
    blank(),
    ["Form Title", form.title],
    ["Form Status", form.status],
    ["Package Scope", packageLabel],
    ["Date Window", dateLabel],
    ["Report Generated", new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })],
    blank(),
    ["━━ SCOPE SUMMARY ━━"],
    ["Accepted Responses (in scope)", summary.accepted],
    ["Total Submitted (all statuses)", totalSubmitted],
    ["Overall Acceptance Rate", `${acceptanceRate}%`],
    ["Procurement Packages", summary.packageCount],
    ["Tehsils with Accepted Responses", analytics.byTehsil.length],
    ["Villages with Accepted Responses", analytics.byVillage.length],
    blank(),
    ["━━ CONTENTS ━━"],
    ["Sheet", "Description"],
    ["Cover", "This page — report metadata and scope"],
    ["Analyst Findings", "Auto-derived risk alerts: coverage gaps, budget, compliance"],
    ["Summary KPIs", "Full KPI snapshot with rate analysis"],
    ["Tehsil Coverage", "Accepted counts, share %, and coverage health per tehsil"],
    ["Village Coverage", "Top villages by accepted count with coverage rating"],
    ["Package Comparison", "Status breakdown + acceptance rate per procurement package"],
    ["Question Insights", "Choice and numeric field answer distributions"],
    ["Timeline", "Daily accepted submissions + 7-day rolling average"],
    ...(analytics.cesmpInsights
      ? [
          ["C-ESMP Summary", "Programme-level ESMP KPIs"],
          ["C-ESMP Packages", "Per-package budget utilization and HSE data"],
          ["C-ESMP Compliance", "PPE, dust, noise answer distributions"],
          ["C-ESMP Training", "Training sessions, participants, venues"],
        ]
      : []),
    blank(),
    ["Note: All data reflects ACCEPTED responses only unless otherwise stated."],
    ["Figures are as of the generated timestamp above."],
  ];

  return { name: "Cover", rows, colWidths: { 0: 42, 1: 48 } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ANALYST FINDINGS
// ═══════════════════════════════════════════════════════════════════════════════

function analystFindingsSheet(analytics: SurveyFormAnalytics): SheetDef {
  const rows: Row[] = [
    ["ANALYST FINDINGS — Auto-Derived Risk Alerts"],
    ["Generated by ESMS analytics engine based on accepted responses in current scope."],
    blank(),
  ];

  let findingIndex = 1;

  // ── Coverage gap analysis ──
  const tehsilTotal = analytics.byTehsil.reduce((s, r) => s + r.accepted, 0);
  const avgShare = analytics.byTehsil.length > 0 ? 100 / analytics.byTehsil.length : 0;

  const criticalTehsils = analytics.byTehsil
    .map((r) => ({
      name: r.tehsilName,
      accepted: r.accepted,
      sharePct: tehsilTotal > 0 ? Math.round((r.accepted / tehsilTotal) * 100) : 0,
    }))
    .filter((r) => r.sharePct < 10)
    .sort((a, b) => a.sharePct - b.sharePct);

  if (criticalTehsils.length > 0) {
    rows.push([`Finding ${findingIndex++}`, "COVERAGE GAP — Under-represented tehsils", "PRIORITY: HIGH"]);
    rows.push(["", "Tehsil", "Accepted", "Share %", "Expected Share", "Gap", "Status"]);
    for (const t of criticalTehsils) {
      const gap = Math.round(avgShare - t.sharePct);
      rows.push([
        "",
        t.name,
        t.accepted,
        `${t.sharePct}%`,
        `${Math.round(avgShare)}%`,
        gap > 0 ? `-${gap}pp` : `+${Math.abs(gap)}pp`,
        coverageFlag(t.sharePct),
      ]);
    }
    rows.push(["", "Action: Increase monitoring visits and follow-up in flagged tehsils."]);
    rows.push(blank());
  }

  // ── Package acceptance rate ──
  const lowAcceptPkgs = analytics.byProcurementPackage
    .filter((p) => p.total >= 5 && p.total > 0)
    .map((p) => ({ ...p, rate: Math.round((p.accepted / p.total) * 100) }))
    .filter((p) => p.rate < 35)
    .sort((a, b) => a.rate - b.rate);

  if (lowAcceptPkgs.length > 0) {
    rows.push([`Finding ${findingIndex++}`, "LOW ACCEPTANCE RATE — Procurement packages", "PRIORITY: HIGH"]);
    rows.push(["", "Package", "Tehsil", "Accepted", "Total", "Rate", "Status"]);
    for (const p of lowAcceptPkgs) {
      rows.push([
        "",
        p.packageName,
        p.tehsilName,
        p.accepted,
        p.total,
        `${p.rate}%`,
        acceptanceFlag(p.rate),
      ]);
    }
    rows.push(["", "Action: Review submission quality; brief field teams on form completion standards."]);
    rows.push(blank());
  }

  // ── High pending volume ──
  const totalPending = analytics.byProcurementPackage.reduce((s, p) => s + p.pendingReview, 0);
  const totalAccepted = analytics.summary.accepted;
  const pendingRatio = (totalAccepted + totalPending) > 0
    ? Math.round((totalPending / (totalAccepted + totalPending)) * 100)
    : 0;

  if (pendingRatio >= 30) {
    rows.push([`Finding ${findingIndex++}`, "HIGH PENDING REVIEW BACKLOG", pendingRatio >= 50 ? "PRIORITY: HIGH" : "PRIORITY: MEDIUM"]);
    rows.push(["", `${totalPending} responses are pending review (${pendingRatio}% of accepted+pending combined).`]);
    rows.push(["", "Action: Accelerate HO review cycle to prevent field team morale impact."]);
    rows.push(blank());
  }

  // ── Timeline: recent acceleration / slowdown ──
  const activeDays = analytics.submissionsOverTime.filter((p) => p.count > 0);
  if (activeDays.length >= 14) {
    const counts = activeDays.map((d) => d.count);
    const recentHalf = counts.slice(-7).reduce((s, v) => s + v, 0);
    const prevHalf = counts.slice(-14, -7).reduce((s, v) => s + v, 0);
    const change = prevHalf > 0 ? Math.round(((recentHalf - prevHalf) / prevHalf) * 100) : 0;
    if (Math.abs(change) >= 25) {
      const direction = change > 0 ? "ACCELERATION" : "SLOWDOWN";
      const priority = Math.abs(change) >= 50 ? "PRIORITY: HIGH" : "PRIORITY: MEDIUM";
      rows.push([`Finding ${findingIndex++}`, `SUBMISSION ${direction} — Last 7 vs previous 7 days`, priority]);
      rows.push(["", `Last 7 days: ${recentHalf} accepted`, `Previous 7 days: ${prevHalf} accepted`, `Change: ${change > 0 ? "+" : ""}${change}%`]);
      if (change < 0) {
        rows.push(["", "Action: Investigate field access issues, team attendance, and site conditions."]);
      } else {
        rows.push(["", "Note: Positive trend — ensure quality is maintained during accelerated submissions."]);
      }
      rows.push(blank());
    }
  }

  // ── C-ESMP specific findings ──
  const c = analytics.cesmpInsights;
  if (c) {
    // HSE staffing
    if (c.summary.hseStaffHiredRate < 1 && c.summary.totalProcurementPackages > 0) {
      const missingPkgs = c.summary.totalProcurementPackages - c.summary.hseStaffHiredPackages;
      const priority = c.summary.hseStaffHiredRate < 0.5 ? "PRIORITY: HIGH" : "PRIORITY: MEDIUM";
      rows.push([`Finding ${findingIndex++}`, "HSE STAFF NOT HIRED — Multiple packages", priority]);
      rows.push(["", `${missingPkgs} of ${c.summary.totalProcurementPackages} packages have not hired HSE staff.`]);
      rows.push(["", "Action: Issue NOC/compliance notice to contractors missing HSE appointments."]);
      rows.push(blank());
    }

    // Budget utilization
    if (c.budget.overallUtilizationRate >= 85) {
      const priority = c.budget.overallUtilizationRate >= 95 ? "PRIORITY: HIGH" : "PRIORITY: MEDIUM";
      rows.push([`Finding ${findingIndex++}`, "ESMP BUDGET — High utilization", priority]);
      rows.push(["", `Overall utilization: ${Math.round(c.budget.overallUtilizationRate)}%`]);
      rows.push(["", `Remaining: ${pkr(c.budget.totalRemaining)} of ${pkr(c.budget.totalAllocated)}`]);
      rows.push(["", "Action: Review remaining ESMP commitments and prepare supplementary budget if needed."]);
      rows.push(blank());
    }

    // PPE compliance
    const ppeCounts = c.ppeCompliance.wearingRate.counts;
    const ppeTotal = c.ppeCompliance.wearingRate.total;
    const lowPpeCount = (ppeCounts["None"] ?? 0) + (ppeCounts["Some"] ?? 0);
    const lowPpePct = ppeTotal > 0 ? Math.round((lowPpeCount / ppeTotal) * 100) : 0;
    if (lowPpePct >= 20) {
      rows.push([`Finding ${findingIndex++}`, "PPE NON-COMPLIANCE — Workers not wearing PPE", lowPpePct >= 40 ? "PRIORITY: HIGH" : "PRIORITY: MEDIUM"]);
      rows.push(["", `${lowPpePct}% of site visits report "None" or "Some" workers wearing PPE.`]);
      rows.push(["", "Action: Issue PPE compliance directive; conduct spot checks at sites."]);
      rows.push(blank());
    }

    // Dust
    const dustCounts = c.dust.level.counts;
    const dustTotal = c.dust.level.total;
    const highDustCount = Object.entries(dustCounts)
      .filter(([k]) => k.toLowerCase().includes("high") || k.toLowerCase().includes("extreme"))
      .reduce((s, [, v]) => s + v, 0);
    const highDustPct = dustTotal > 0 ? Math.round((highDustCount / dustTotal) * 100) : 0;
    if (highDustPct >= 20) {
      rows.push([`Finding ${findingIndex++}`, "DUST EXPOSURE — Elevated fugitive dust reported", highDustPct >= 40 ? "PRIORITY: HIGH" : "PRIORITY: MEDIUM"]);
      rows.push(["", `${highDustPct}% of site visits report high or extreme dust levels.`]);
      rows.push(["", "Action: Mandate water sprinkling at all active sites; increase inspection frequency."]);
      rows.push(blank());
    }
  }

  if (findingIndex === 1) {
    rows.push(["✅ No critical findings identified in the current scope."]);
    rows.push(["All tehsils, packages, and compliance indicators are within acceptable thresholds."]);
  }

  rows.push(blank());
  rows.push(["━━ END OF ANALYST FINDINGS ━━"]);

  return {
    name: "Analyst Findings",
    rows,
    colWidths: { 0: 14, 1: 52, 2: 32, 3: 16, 4: 16, 5: 14, 6: 24 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SUMMARY KPIs
// ═══════════════════════════════════════════════════════════════════════════════

function summarySheet(
  analytics: SurveyFormAnalytics,
  dateLabel: string,
  packageLabel: string,
): SheetDef {
  const { summary } = analytics;
  const totalSubmitted = summary.accepted + summary.pendingReview + summary.draft + summary.rejected + summary.reverted;
  const acceptanceRate = totalSubmitted > 0 ? Math.round((summary.accepted / totalSubmitted) * 100) : 0;
  const reviewPendingRate = totalSubmitted > 0 ? Math.round((summary.pendingReview / totalSubmitted) * 100) : 0;
  const rejectionRate = totalSubmitted > 0 ? Math.round((summary.rejected / totalSubmitted) * 100) : 0;

  const rows: Row[] = [
    ["Summary KPIs"],
    [`Scope: ${packageLabel} | ${dateLabel}`],
    blank(),
    ["━━ RESPONSE PIPELINE ━━"],
    ["Status", "Count", "Share of Total", "Notes"],
    ["Accepted", summary.accepted, `${acceptanceRate}%`, "Used for all analytics below"],
    ["Pending Review", summary.pendingReview, `${reviewPendingRate}%`, "Awaiting HO acceptance"],
    ["Draft", summary.draft, `${totalSubmitted > 0 ? Math.round((summary.draft / totalSubmitted) * 100) : 0}%`, "Incomplete field submissions"],
    ["Rejected", summary.rejected, `${rejectionRate}%`, "Returned to field team"],
    ["Reverted", summary.reverted, `${totalSubmitted > 0 ? Math.round((summary.reverted / totalSubmitted) * 100) : 0}%`, "Sent back for revision"],
    ["━━ TOTAL ━━", totalSubmitted, "100%", ""],
    blank(),
    ["━━ PROGRAMME SCOPE ━━"],
    ["Procurement Packages in Scope", summary.packageCount],
    ["Assignments Covered", summary.assignmentCount],
    ["Tehsils with Accepted Responses", analytics.byTehsil.length],
    ["Villages with Accepted Responses", analytics.byVillage.length],
    blank(),
    ["━━ QUALITY INDICATORS ━━"],
    ["Indicator", "Value", "Rating"],
    ["Overall Acceptance Rate", `${acceptanceRate}%`, acceptanceFlag(acceptanceRate)],
    ["Rejection Rate", `${rejectionRate}%`, rejectionRate <= 10 ? "🟢 Low" : rejectionRate <= 25 ? "🟡 Moderate" : "🔴 High"],
    ["Review Backlog Rate", `${reviewPendingRate}%`, reviewPendingRate <= 20 ? "🟢 Healthy" : reviewPendingRate <= 40 ? "🟡 Monitor" : "🔴 Backlog"],
  ];

  return { name: "Summary KPIs", rows, colWidths: { 0: 36, 1: 16, 2: 18, 3: 42 } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TEHSIL COVERAGE
// ═══════════════════════════════════════════════════════════════════════════════

function tehsilSheet(analytics: SurveyFormAnalytics): SheetDef {
  const total = analytics.byTehsil.reduce((s, r) => s + r.accepted, 0);
  const avgShare = analytics.byTehsil.length > 0 ? 100 / analytics.byTehsil.length : 0;

  const sorted = [...analytics.byTehsil].sort((a, b) => b.accepted - a.accepted);

  const rows: Row[] = [
    ["Tehsil Coverage Analysis"],
    ["Sorted by accepted responses (descending). Coverage flag = share vs equal-distribution baseline."],
    blank(),
    ["Rank", "Tehsil", "Accepted", "Share (%)", "Expected Share", "Deviation (pp)", "Coverage Flag"],
    ...sorted.map((r, i) => {
      const sharePct = total > 0 ? Math.round((r.accepted / total) * 100) : 0;
      const deviation = sharePct - Math.round(avgShare);
      return [
        i + 1,
        r.tehsilName,
        r.accepted,
        `${sharePct}%`,
        `${Math.round(avgShare)}%`,
        deviation >= 0 ? `+${deviation}pp` : `${deviation}pp`,
        coverageFlag(sharePct),
      ];
    }),
    blank(),
    ["TOTAL", "", total, "100%", "", "", ""],
    blank(),
    ["Coverage Flag Key"],
    ["🟢 Adequate", "≥ 20% share"],
    ["🟡 Moderate", "10%–19% share"],
    ["🟠 Below Target", "5%–9% share"],
    ["🔴 Critical Gap", "1%–4% share"],
    ["⛔ ZERO COVERAGE", "0 accepted responses"],
  ];

  return {
    name: "Tehsil Coverage",
    rows,
    colWidths: { 0: 8, 1: 28, 2: 12, 3: 12, 4: 16, 5: 16, 6: 22 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. VILLAGE COVERAGE
// ═══════════════════════════════════════════════════════════════════════════════

function villageSheet(analytics: SurveyFormAnalytics): SheetDef {
  const total = analytics.byVillage.reduce((s, r) => s + r.accepted, 0);
  const sorted = [...analytics.byVillage].sort((a, b) => b.accepted - a.accepted);

  const rows: Row[] = [
    ["Village Coverage Analysis"],
    ["All villages with accepted responses, sorted by count (descending)."],
    blank(),
    ["Rank", "Village", "Tehsil", "Accepted", "Share (%)", "Coverage Flag"],
    ...sorted.map((r, i) => {
      const sharePct = total > 0 ? Math.round((r.accepted / total) * 100) : 0;
      return [
        i + 1,
        r.villageName,
        r.tehsilName,
        r.accepted,
        `${sharePct}%`,
        coverageFlag(sharePct),
      ];
    }),
    blank(),
    ["TOTAL", "", "", total, "100%", ""],
  ];

  return {
    name: "Village Coverage",
    rows,
    colWidths: { 0: 8, 1: 30, 2: 22, 3: 12, 4: 12, 5: 22 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. PACKAGE COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════

function packageSheet(analytics: SurveyFormAnalytics): SheetDef {
  const sorted = [...analytics.byProcurementPackage]
    .filter((p) => p.total > 0)
    .sort((a, b) => b.accepted - a.accepted);

  const totals = sorted.reduce(
    (acc, p) => ({
      accepted: acc.accepted + p.accepted,
      pendingReview: acc.pendingReview + p.pendingReview,
      draft: acc.draft + p.draft,
      rejected: acc.rejected + p.rejected,
      reverted: acc.reverted + p.reverted,
      total: acc.total + p.total,
    }),
    { accepted: 0, pendingReview: 0, draft: 0, rejected: 0, reverted: 0, total: 0 },
  );

  const rows: Row[] = [
    ["Procurement Package — Response Status Comparison"],
    ["Sorted by accepted responses. Acceptance rate = accepted ÷ total."],
    blank(),
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
      "Rate Flag",
    ],
    ...sorted.map((p) => {
      const rate = p.total > 0 ? Math.round((p.accepted / p.total) * 100) : 0;
      return [
        p.packageName,
        p.tehsilName,
        p.accepted,
        p.pendingReview,
        p.draft,
        p.rejected,
        p.reverted,
        p.total,
        `${rate}%`,
        acceptanceFlag(rate),
      ];
    }),
    blank(),
    [
      "PROGRAMME TOTAL",
      "",
      totals.accepted,
      totals.pendingReview,
      totals.draft,
      totals.rejected,
      totals.reverted,
      totals.total,
      pct(totals.accepted, totals.total),
      acceptanceFlag(totals.total > 0 ? Math.round((totals.accepted / totals.total) * 100) : 0),
    ],
    blank(),
    ["Acceptance Rate Flag Key"],
    ["🟢 Good", "≥ 60% acceptance"],
    ["🟡 Moderate", "35%–59% acceptance"],
    ["🟠 Low", "15%–34% acceptance"],
    ["🔴 Very Low", "< 15% acceptance"],
  ];

  return {
    name: "Package Comparison",
    rows,
    colWidths: { 0: 34, 1: 22, 2: 12, 3: 16, 4: 10, 5: 12, 6: 12, 7: 10, 8: 16, 9: 20 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. QUESTION INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════════

function questionSheet(analytics: SurveyFormAnalytics): SheetDef {
  const choiceTypes = new Set(["CHECKBOXES", "MULTIPLE_CHOICE", "DROPDOWN"]);
  const rows: Row[] = [
    ["Question-Level Insights — Accepted Responses"],
    ["Choice fields: answer distribution with dominance analysis. Numeric fields: descriptive stats."],
    blank(),
  ];

  let hasData = false;

  for (const field of analytics.fieldBreakdown) {
    if (
      choiceTypes.has(field.type) &&
      field.choiceCounts &&
      Object.keys(field.choiceCounts).length > 0
    ) {
      hasData = true;
      const sorted = Object.entries(field.choiceCounts).sort(([, a], [, b]) => b - a);
      const total = sorted.reduce((s, [, n]) => s + n, 0);
      const topCount = sorted[0]?.[1] ?? 0;
      const dominancePct = total > 0 ? Math.round((topCount / total) * 100) : 0;

      rows.push([`▶ ${field.label}`, "", `Type: ${field.type}`, `${field.answeredCount} answered`, `${total} selections`, `Top-answer dominance: ${dominancePct}%`]);
      rows.push(["Rank", "Answer Option", "Count", "Share (%)", "Of Answers", "Dominance Flag"]);

      sorted.forEach(([answer, count], i) => {
        const sharePct = total > 0 ? Math.round((count / total) * 100) : 0;
        const domFlag = i === 0 && dominancePct >= 70
          ? "🔴 Highly dominant"
          : i === 0 && dominancePct >= 50
          ? "🟡 Moderately dominant"
          : i === 0
          ? "🟢 Distributed"
          : "";
        rows.push([i + 1, answer, count, `${sharePct}%`, `${field.answeredCount} responses`, domFlag]);
      });
      rows.push(blank());
    } else if (field.numeric && field.numeric.count > 0) {
      hasData = true;
      const n = field.numeric;
      const range = n.max - n.min;
      rows.push([`▶ ${field.label}`, "", "Type: Numeric", `${n.count} answered`]);
      rows.push(["Metric", "Value", "Context"]);
      rows.push(["Average", Number(n.avg.toFixed(2)), "Mean across all answered responses"]);
      rows.push(["Min", n.min, "Lowest single response"]);
      rows.push(["Max", n.max, "Highest single response"]);
      rows.push(["Sum", n.sum, "Total across all answered responses"]);
      rows.push(["Range", Number(range.toFixed(2)), "Max − Min"]);
      rows.push(["Responses Answered", n.count, ""]);
      rows.push(blank());
    }
  }

  if (!hasData) {
    rows.push(["No multiple-choice or numeric question data in the current filter."]);
  }

  return {
    name: "Question Insights",
    rows,
    colWidths: { 0: 8, 1: 44, 2: 12, 3: 12, 4: 18, 5: 24 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. TIMELINE — daily + 7-day rolling avg
// ═══════════════════════════════════════════════════════════════════════════════

function timelineSheet(analytics: SurveyFormAnalytics): SheetDef {
  const active = analytics.submissionsOverTime.filter((p) => p.count > 0);
  const counts = active.map((p) => p.count);

  const total = counts.reduce((s, v) => s + v, 0);
  const peak = Math.max(...counts, 0);
  const peakDay = active.find((p) => p.count === peak)?.date ?? "—";
  const avgPerDay = active.length > 0 ? (total / active.length).toFixed(1) : "0";

  const rows: Row[] = [
    ["Accepted Submissions — Daily Timeline"],
    ["Includes 7-day rolling average. Only days with ≥ 1 accepted response are shown."],
    blank(),
    ["Overall Total", total, "Peak Day", peakDay, "Peak Count", peak, "Avg/Active Day", avgPerDay],
    blank(),
    ["Date", "Accepted", "7-Day Rolling Avg", "vs Rolling Avg"],
    ...active.map((p, i) => {
      const avg = rollingAvg(counts, i, 7);
      const vsAvg = avg > 0 ? Math.round(((p.count - avg) / avg) * 100) : 0;
      return [
        p.date,
        p.count,
        Number(avg.toFixed(1)),
        vsAvg >= 0 ? `+${vsAvg}%` : `${vsAvg}%`,
      ];
    }),
  ];

  if (active.length === 0) {
    rows.push(["No accepted responses in the current filter window."]);
  }

  return {
    name: "Timeline",
    rows,
    colWidths: { 0: 14, 1: 12, 2: 20, 3: 18 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9–12. C-ESMP SHEETS
// ═══════════════════════════════════════════════════════════════════════════════

function cesmpSummarySheet(c: CesmpFormInsights): SheetDef {
  const s = c.summary;
  const b = c.budget;
  const remaining = b.totalRemaining;
  const utilizationPct = Math.round(b.overallUtilizationRate);

  const rows: Row[] = [
    ["C-ESMP Programme Summary"],
    blank(),
    ["━━ PROGRAMME SCOPE ━━"],
    ["Metric", "Value", "Notes"],
    ["Total Contractors", s.totalContractors, ""],
    ["Total Procurement Packages", s.totalProcurementPackages, ""],
    ["Total Villages Covered", s.totalVillageCoverage, ""],
    ["Total Site Visits Submitted", s.totalSiteVisitsSubmitted, ""],
    ["HSE Staff Hired (packages)", s.hseStaffHiredPackages, `${s.totalProcurementPackages - s.hseStaffHiredPackages} packages NOT compliant`],
    ["HSE Hire Rate", `${Math.round(s.hseStaffHiredRate * 100)}%`, s.hseStaffHiredRate < 0.5 ? "⚠️ Below 50% — escalation required" : ""],
    ["C-ESMP Plan Submitted", s.cesmpPlanSubmittedPackages, `of ${s.totalProcurementPackages} packages`],
    blank(),
    ["━━ ESMP BUDGET UTILIZATION ━━"],
    ["Metric", "Amount (PKR)", "Notes"],
    ["Total Allocated", b.totalAllocated, ""],
    ["Total Utilized", b.totalUtilized, ""],
    ["Total Remaining", remaining, remaining < 0 ? "⚠️ OVER BUDGET" : ""],
    ["Overall Utilization Rate", `${utilizationPct}%`, budgetFlag(utilizationPct)],
    blank(),
    ["━━ BUDGET BY HEAD ━━"],
    ["Head", "Amount (PKR)", "Share of Utilized"],
    ["PPE", b.byHead.ppe, pct(b.byHead.ppe, b.totalUtilized, 1)],
    ["HSE", b.byHead.hse, pct(b.byHead.hse, b.totalUtilized, 1)],
    ["Environmental Monitoring", b.byHead.environmentalMonitoring, pct(b.byHead.environmentalMonitoring, b.totalUtilized, 1)],
    blank(),
    ["━━ TRAINING ━━"],
    ["Responses with Training Data", c.training.responsesWithTraining, ""],
    ["Total Participants", c.training.totalParticipants, ""],
  ];

  return { name: "C-ESMP Summary", rows, colWidths: { 0: 38, 1: 20, 2: 44 } };
}

function cesmpPackagesSheet(c: CesmpFormInsights): SheetDef {
  const sorted = [...c.packages].sort((a, b) => b.utilizationRate - a.utilizationRate);

  const rows: Row[] = [
    ["C-ESMP Per-Package Data — Sorted by Budget Utilization (highest first)"],
    blank(),
    [
      "Package",
      "Tehsil",
      "Contractor",
      "Consultant",
      "Allocated (PKR)",
      "Utilized (PKR)",
      "Remaining (PKR)",
      "Utilization %",
      "Budget Flag",
      "Villages",
      "Site Visits",
      "HSE Staff Hired",
      "C-ESMP Plan",
      "PPE Budget (PKR)",
      "HSE Budget (PKR)",
      "Env. Mon. Budget (PKR)",
    ],
    ...sorted.map((p) => {
      const uRate = Math.round(p.utilizationRate);
      return [
        p.packageName,
        p.tehsilName,
        p.contractorName,
        p.consultantName,
        p.budgetAllocated,
        p.budgetUtilized,
        p.budgetRemaining,
        `${uRate}%`,
        budgetFlag(uRate),
        p.villagesCovered,
        p.siteVisitsSubmitted,
        yesNo(p.hseStaffHired),
        yesNo(p.cesmpPlanSubmitted),
        p.budgetByHead.ppe,
        p.budgetByHead.hse,
        p.budgetByHead.environmentalMonitoring,
      ];
    }),
    blank(),
    ["Budget Flag Key"],
    ["🟢 Underspent", "< 60% utilized"],
    ["🟡 On Track", "60%–84% utilized"],
    ["🟠 High Utilization", "85%–94% utilized"],
    ["🔴 Near Exhausted", "≥ 95% utilized"],
  ];

  return {
    name: "C-ESMP Packages",
    rows,
    colWidths: { 0: 30, 1: 18, 2: 22, 3: 22, 4: 18, 5: 18, 6: 18, 7: 14, 8: 22, 9: 10, 10: 12, 11: 16, 12: 16 },
  };
}

function cesmpComplianceSheet(c: CesmpFormInsights): SheetDef {
  const patterns: Array<{ category: string; indicator: string; insight: CesmpFormInsights["ppeCompliance"]["wearingRate"] }> = [
    { category: "PPE", indicator: "Wearing Rate", insight: c.ppeCompliance.wearingRate },
    { category: "PPE", indicator: "Good Condition", insight: c.ppeCompliance.goodCondition },
    { category: "Noise", indicator: "Level", insight: c.noise.level },
    { category: "Noise", indicator: "Reduction Measures", insight: c.noise.reductionMeasures },
    { category: "Dust", indicator: "Level", insight: c.dust.level },
    { category: "Dust", indicator: "Reduction Measures", insight: c.dust.reductionMeasures },
  ];

  const rows: Row[] = [
    ["C-ESMP Compliance Patterns — Answer Distributions"],
    ["Each row = one answer option for a compliance indicator. Sorted by count descending."],
    blank(),
    ["Category", "Indicator", "Answer", "Count", "Total Responses", "Share (%)", "Notes"],
  ];

  for (const { category, indicator, insight } of patterns) {
    const sorted = Object.entries(insight.counts).sort(([, a], [, b]) => b - a);
    sorted.forEach(([answer, count], i) => {
      const sharePct = Math.round((count / insight.total) * 100);
      let note = "";
      if (category === "PPE" && indicator === "Wearing Rate") {
        if (["none", "some"].includes(answer.toLowerCase()) && sharePct >= 20) {
          note = `⚠️ ${sharePct}% non-compliant — action required`;
        }
      }
      if (category === "Dust" && indicator === "Level") {
        if ((answer.toLowerCase().includes("high") || answer.toLowerCase().includes("extreme")) && sharePct >= 20) {
          note = `⚠️ Elevated dust risk — ${sharePct}% of visits`;
        }
      }
      rows.push([
        i === 0 ? category : "",
        i === 0 ? indicator : "",
        answer,
        count,
        insight.total,
        `${sharePct}%`,
        note,
      ]);
    });
    rows.push(blank());
  }

  return {
    name: "C-ESMP Compliance",
    rows,
    colWidths: { 0: 14, 1: 24, 2: 30, 3: 10, 4: 18, 5: 12, 6: 44 },
  };
}

function cesmpTrainingSheet(c: CesmpFormInsights): SheetDef | null {
  if (c.training.topTrainings.length === 0) return null;

  const rows: Row[] = [
    ["C-ESMP Training Data"],
    blank(),
    ["━━ TRAINING SESSIONS ━━"],
    ["Training Title", "Sessions Count", "Total Participants", "Avg Participants/Session"],
    ...c.training.topTrainings.map((t) => [
      t.title,
      t.count,
      t.participants,
      t.count > 0 ? Math.round(t.participants / t.count) : 0,
    ]),
    blank(),
    ["Programme Total", c.training.topTrainings.reduce((s, t) => s + t.count, 0), c.training.totalParticipants, ""],
    blank(),
    ["━━ TRAINING VENUES ━━"],
    ["Venue", "Count", "Share (%)"],
    ...Object.entries(c.training.venues)
      .sort(([, a], [, b]) => b - a)
      .map(([venue, count]) => {
        const total = Object.values(c.training.venues).reduce((s, v) => s + v, 0);
        return [venue, count, pct(count, total)];
      }),
  ];

  return { name: "C-ESMP Training", rows, colWidths: { 0: 44, 1: 18, 2: 20, 3: 24 } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function exportAnalyticsToExcel(
  analytics: SurveyFormAnalytics,
  dateLabel: string,
  packageLabel: string,
): void {
  const wb = XLSX.utils.book_new();

  const c = analytics.cesmpInsights ?? null;

  const sheetDefs: SheetDef[] = [
    coverSheet(analytics, dateLabel, packageLabel),
    analystFindingsSheet(analytics),
    summarySheet(analytics, dateLabel, packageLabel),
    tehsilSheet(analytics),
    villageSheet(analytics),
    packageSheet(analytics),
    questionSheet(analytics),
    timelineSheet(analytics),
    ...(c
      ? [
          cesmpSummarySheet(c),
          cesmpPackagesSheet(c),
          cesmpComplianceSheet(c),
          ...(cesmpTrainingSheet(c) ? [cesmpTrainingSheet(c)!] : []),
        ]
      : []),
  ];

  for (const def of sheetDefs) {
    const { name, ws } = makeSheet(def);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const safeTitle = analytics.form.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `ESMS_Report_${safeTitle}_${dateStamp}.xlsx`;

  XLSX.writeFile(wb, filename);
}
