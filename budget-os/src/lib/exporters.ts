// Builds a full "Monthly Financial Review" and downloads it as PDF, Excel
// (.xlsx) or CSV. All export libraries are imported dynamically so they only
// load when the user actually exports.

import { peso, pct } from "./currency";
import {
  categoryComparisonFull,
  currentMonthKey,
  financialHealth,
  monthLabel,
  monthlySeries,
  paydayCycleAnalysis,
  savingsRate,
  totalDebt,
  totalExpenses,
  totalIncome,
} from "./finance";
import { reviewInsights } from "./insights";
import { getWorkspaceName } from "./workspace";
import { BudgetData } from "./types";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Shared data assembly so every format shows the same review.
function buildReview(data: BudgetData) {
  const key = currentMonthKey();
  const income = totalIncome(data.incomes, key);
  const expenses = totalExpenses(data.expenses, key);
  const health = financialHealth(data);
  const cycle = paydayCycleAnalysis(data);
  return {
    key,
    period: monthLabel(key),
    income,
    expenses,
    net: income - expenses,
    savingsRate: savingsRate(data, key),
    debt: totalDebt(data.debts),
    health,
    cycle,
    categories: categoryComparisonFull(data),
    trend: monthlySeries(data, 6),
    insights: reviewInsights(data),
  };
}

// ---------------------------------------------------------------- CSV ------
export function exportCSV(data: BudgetData) {
  const r = buildReview(data);
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const row = (cells: (string | number)[]) => cells.map(esc).join(",");
  const lines: string[] = [];

  lines.push(`${getWorkspaceName()} — Monthly Financial Review`);
  lines.push(`Period,${r.period}`);
  lines.push(`Generated,${new Date().toLocaleDateString("en-PH")}`);
  lines.push("");
  lines.push("INCOME SUMMARY");
  lines.push(row(["Total Income", r.income]));
  lines.push(row(["Total Expenses", r.expenses]));
  lines.push(row(["Net (savings)", r.net]));
  lines.push(row(["Savings Rate %", Math.round(r.savingsRate)]));
  lines.push(row(["Financial Health", `${r.health.score}/100 (${r.health.grade})`]));
  lines.push("");
  lines.push("PAYDAY CYCLE");
  lines.push(row(["Spent this cycle", r.cycle.spentThisCycle]));
  lines.push(row(["Spent previous cycle", r.cycle.spentPrevCycle]));
  lines.push(row(["Daily burn rate", Math.round(r.cycle.burnRate)]));
  lines.push(row(["Remaining before payday", r.cycle.remainingBeforePayday]));
  lines.push("");
  lines.push("CATEGORY COMPARISON (this vs last month)");
  lines.push(row(["Category", "This Month", "Last Month", "Change", "% Change"]));
  for (const c of r.categories)
    lines.push(row([c.category, c.thisAmt, c.lastAmt, c.delta, `${Math.round(c.pctChange)}%`]));
  lines.push("");
  lines.push("DEBTS");
  lines.push(row(["Name", "Balance", "Rate/mo %", "Monthly Payment"]));
  for (const d of data.debts)
    lines.push(row([d.name, d.balance, d.interestRate, d.monthlyPayment]));
  lines.push("");
  lines.push("SAVINGS GOALS");
  lines.push(row(["Goal", "Saved", "Target", "Progress %"]));
  for (const g of data.goals)
    lines.push(row([g.name, g.current, g.target, Math.round((g.current / (g.target || 1)) * 100)]));
  lines.push("");
  lines.push("AI RECOMMENDATIONS");
  for (const i of r.insights) lines.push(row([i.title, i.text]));

  triggerDownload(
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
    `cris-budget-review-${r.key}.csv`
  );
}

// --------------------------------------------------------------- Excel -----
export async function exportXLSX(data: BudgetData) {
  const r = buildReview(data);
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = getWorkspaceName();
  wb.created = new Date();

  const green = "FF217048";
  const headerStyle = (row: any) => {
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.eachCell((c: any) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: green } };
    });
  };

  // Summary sheet
  const s = wb.addWorksheet("Summary");
  s.columns = [{ width: 26 }, { width: 22 }];
  s.addRow([`Monthly Financial Review — ${r.period}`]);
  s.getRow(1).font = { bold: true, size: 14, color: { argb: green } };
  s.addRow([]);
  headerStyle(s.addRow(["Metric", "Value"]));
  s.addRow(["Total Income", r.income]);
  s.addRow(["Total Expenses", r.expenses]);
  s.addRow(["Net (savings)", r.net]);
  s.addRow(["Savings Rate", `${Math.round(r.savingsRate)}%`]);
  s.addRow(["Total Debt", r.debt]);
  s.addRow(["Financial Health", `${r.health.score}/100 (${r.health.grade})`]);
  s.addRow(["Daily Burn Rate", Math.round(r.cycle.burnRate)]);
  s.addRow(["Remaining Before Payday", r.cycle.remainingBeforePayday]);

  // Category comparison sheet
  const c = wb.addWorksheet("Categories");
  c.columns = [{ width: 20 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 12 }];
  headerStyle(c.addRow(["Category", "This Month", "Last Month", "Change", "% Change"]));
  for (const cat of r.categories)
    c.addRow([cat.category, cat.thisAmt, cat.lastAmt, cat.delta, `${Math.round(cat.pctChange)}%`]);

  // Trend sheet
  const t = wb.addWorksheet("Monthly Trend");
  t.columns = [{ width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];
  headerStyle(t.addRow(["Month", "Income", "Expenses", "Net"]));
  for (const p of r.trend) t.addRow([p.label, p.income, p.expenses, p.net]);

  // Debts + Goals sheet
  const d = wb.addWorksheet("Debts & Goals");
  d.columns = [{ width: 22 }, { width: 15 }, { width: 15 }, { width: 15 }];
  headerStyle(d.addRow(["Debt", "Balance", "Rate/mo", "Payment"]));
  for (const x of data.debts) d.addRow([x.name, x.balance, `${x.interestRate}%`, x.monthlyPayment]);
  d.addRow([]);
  headerStyle(d.addRow(["Goal", "Saved", "Target", "Progress"]));
  for (const g of data.goals)
    d.addRow([g.name, g.current, g.target, `${Math.round((g.current / (g.target || 1)) * 100)}%`]);

  // Insights sheet
  const i = wb.addWorksheet("AI Review");
  i.columns = [{ width: 28 }, { width: 80 }];
  headerStyle(i.addRow(["Insight", "Detail"]));
  for (const ins of r.insights) i.addRow([ins.title, ins.text]);

  const buf = await wb.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `cris-budget-review-${r.key}.xlsx`
  );
}

// ---------------------------------------------------------------- PDF ------
export async function exportPDF(data: BudgetData) {
  const r = buildReview(data);
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor("#217048");
  doc.text(`${getWorkspaceName()} — Monthly Financial Review`, 14, 20);
  doc.setFontSize(11);
  doc.setTextColor("#475569");
  doc.text(`Period: ${r.period}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PH")}`, 14, 34);

  autoTable(doc, {
    startY: 42,
    head: [["Summary", "Value"]],
    body: [
      ["Total Income", peso(r.income)],
      ["Total Expenses", peso(r.expenses)],
      ["Net (savings)", peso(r.net)],
      ["Savings Rate", pct(r.savingsRate)],
      ["Total Debt", peso(r.debt)],
      ["Financial Health", `${r.health.score}/100 (${r.health.grade})`],
      ["Daily Burn Rate", peso(Math.round(r.cycle.burnRate))],
      ["Remaining Before Payday", peso(r.cycle.remainingBeforePayday)],
    ],
    theme: "striped",
    headStyles: { fillColor: [33, 112, 72] },
  });

  autoTable(doc, {
    head: [["Category", "This Month", "Last Month", "% Change"]],
    body: r.categories.map((c) => [
      c.category,
      peso(c.thisAmt),
      peso(c.lastAmt),
      `${c.delta >= 0 ? "+" : ""}${Math.round(c.pctChange)}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [33, 112, 72] },
  });

  if (data.debts.length) {
    autoTable(doc, {
      head: [["Debt", "Balance", "Rate/mo", "Payment"]],
      body: data.debts.map((d) => [d.name, peso(d.balance), `${d.interestRate}%`, peso(d.monthlyPayment)]),
      theme: "striped",
      headStyles: { fillColor: [139, 92, 246] },
    });
  }

  if (data.goals.length) {
    autoTable(doc, {
      head: [["Savings Goal", "Saved", "Target", "Progress"]],
      body: data.goals.map((g) => [
        g.name,
        peso(g.current),
        peso(g.target),
        pct((g.current / (g.target || 1)) * 100),
      ]),
      theme: "striped",
      headStyles: { fillColor: [14, 165, 233] },
    });
  }

  // AI recommendations
  const afterTables = (doc as any).lastAutoTable?.finalY ?? 60;
  doc.setFontSize(13);
  doc.setTextColor("#217048");
  doc.text("AI Recommendations", 14, afterTables + 12);
  doc.setFontSize(10);
  doc.setTextColor("#334155");
  let y = afterTables + 20;
  for (const ins of r.insights) {
    const lines = doc.splitTextToSize(`• ${ins.title}: ${ins.text}`, 180);
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, 14, y);
    y += lines.length * 5 + 3;
  }

  doc.save(`cris-budget-review-${r.key}.pdf`);
}
