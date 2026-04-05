import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExpenseRecord, FinancialReportResponse, ReportPharmacyHeader } from "@/api/types";

const ACCENT: [number, number, number] = [42, 157, 143];
const HEADER_H_MM = 30;

function pdfMoney(n: number, code: string): string {
  const fd = code === "USD" ? 2 : 0;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: code,
    minimumFractionDigits: fd,
    maximumFractionDigits: fd,
  }).format(n);
}

function drawPharmacyHeader(doc: jsPDF, p: ReportPharmacyHeader) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, w, HEADER_H_MM, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(14, HEADER_H_MM - 1, w - 14, HEADER_H_MM - 1);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(p.name, 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const addr = doc.splitTextToSize(p.address, w - 28);
  doc.text(addr, 14, 19);
  const contactY = 19 + Math.min(addr.length, 2) * 4;
  doc.text(`${p.phoneE164}  ·  ${p.email}`, 14, Math.min(contactY, HEADER_H_MM - 4));
}

function lastTableBottom(doc: jsPDF): number {
  const lt = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return lt?.finalY ?? HEADER_H_MM + 8;
}

export function downloadFinancialReportPdf(
  r: FinancialReportResponse,
  opts: { fromYmd: string; toYmd: string; periodTitle: string; generatedLabel: string }
) {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  drawPharmacyHeader(doc, r.pharmacy);

  doc.setTextColor(35, 35, 35);
  let y = HEADER_H_MM + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(opts.periodTitle, 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 75, 75);
  doc.text(`${opts.fromYmd}  →  ${opts.toYmd}`, 14, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Total sales", "Total expenses", "Net", "Sales count", "Inventory added (units)"]],
    body: [
      [
        pdfMoney(r.totalSales, r.pharmacy.currencyCode),
        pdfMoney(r.totalExpenses, r.pharmacy.currencyCode),
        pdfMoney(r.netAmount, r.pharmacy.currencyCode),
        String(r.saleCount),
        String(r.inventoryUnitsAdded),
      ],
    ],
    theme: "plain",
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 10, fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  });
  y = lastTableBottom(doc) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(35, 35, 35);
  doc.text("Medicines sold (summary by product)", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Product", "Quantity sold", "Line total"]],
    body:
      r.medicinesSold.length > 0
        ? r.medicinesSold.map((m) => [
            m.productName,
            String(m.quantitySold),
            pdfMoney(m.lineTotal, r.pharmacy.currencyCode),
          ])
        : [["—", "0", pdfMoney(0, r.pharmacy.currencyCode)]],
    theme: "striped",
    headStyles: { fillColor: ACCENT, fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
  y = lastTableBottom(doc) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Expenses", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Date", "Title", "Amount", "Recorded by"]],
    body:
      r.expenses.length > 0
        ? r.expenses.map((e) => [
            new Date(e.incurredAt).toLocaleString(),
            e.description ? `${e.title} — ${e.description}` : e.title,
            pdfMoney(e.amount, r.pharmacy.currencyCode),
            e.recordedByUsername ?? "—",
          ])
        : [["—", "No expenses in period", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: ACCENT, fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
  y = lastTableBottom(doc) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Inventory added (restock by product)", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Product", "Units added"]],
    body:
      r.inventoryAdded.length > 0
        ? r.inventoryAdded.map((row) => [row.productName, String(row.quantityAdded)])
        : [["—", "0"]],
    theme: "striped",
    headStyles: { fillColor: ACCENT, fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
  y = lastTableBottom(doc) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Low stock (current snapshot)", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Product", "Barcode", "Qty on hand"]],
    body:
      r.lowStock.length > 0
        ? r.lowStock.map((p) => [p.name, p.barcode, String(p.totalQuantity)])
        : [["—", "—", "None below threshold"]],
    theme: "striped",
    headStyles: { fillColor: ACCENT, fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
  y = lastTableBottom(doc) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Sales register", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["ID", "Time", "Cashier", "Total"]],
    body:
      r.sales.length > 0
        ? r.sales.map((s) => [
            String(s.id),
            new Date(s.createdAt).toLocaleString(),
            s.cashierUsername,
            pdfMoney(s.totalAmount, r.pharmacy.currencyCode),
          ])
        : [["—", "—", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: ACCENT, fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${opts.generatedLabel}  ·  Page ${i} / ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  doc.save(`financial-report_${opts.fromYmd}_${opts.toYmd}.pdf`);
}

export function downloadExpenseReportPdf(
  p: ReportPharmacyHeader,
  expenses: ExpenseRecord[],
  opts: { fromYmd: string; toYmd: string; title: string; generatedLabel: string }
) {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  drawPharmacyHeader(doc, p);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  let y = HEADER_H_MM + 8;
  doc.setTextColor(35, 35, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(opts.title, 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 75, 75);
  doc.text(`${opts.fromYmd}  →  ${opts.toYmd}`, 14, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Total expenses"]],
    body: [[pdfMoney(total, p.currencyCode)]],
    theme: "plain",
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 11, fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  });
  y = lastTableBottom(doc) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Detail", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Date", "Title", "Description", "Amount", "Recorded by"]],
    body:
      expenses.length > 0
        ? expenses.map((e) => [
            new Date(e.incurredAt).toLocaleString(),
            e.title,
            e.description ?? "—",
            pdfMoney(e.amount, p.currencyCode),
            e.recordedByUsername ?? "—",
          ])
        : [["—", "No records", "—", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: ACCENT, fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(opts.generatedLabel, 14, doc.internal.pageSize.getHeight() - 8);

  doc.save(`expense-report_${opts.fromYmd}_${opts.toYmd}.pdf`);
}
