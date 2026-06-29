import type { StoredCalculation } from "@/context/calculator-context";

export function exportCSV(calc: StoredCalculation): void {
  const rows: string[][] = [
    ["Industrial Gear Engineering Calculator"],
    ["Type", calc.label],
    ["Date", new Date(calc.timestamp).toLocaleString()],
    [],
    ["INPUTS"],
    ["Parameter", "Value"],
    ...Object.entries(calc.inputs).map(([k, v]) => [k, String(v)]),
    [],
    ["RESULTS"],
    ["Parameter", "Symbol", "Formula", "Value", "Unit", "Note"],
    ...calc.results.map((r) => [
      r.label,
      r.symbol,
      r.formula,
      r.value.toFixed(6),
      r.unit,
      r.note ?? "",
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${calc.type}-gear-calc.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(calc: StoredCalculation): Promise<void> {
  const [jsPDFModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const jsPDF = jsPDFModule.default;
  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const margin = 15;
  let y = margin;

  // Header
  doc.setFontSize(16);
  doc.setTextColor(0, 150, 180);
  doc.text("Industrial Gear Engineering Calculator", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Calculation Type: ${calc.label}`, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date(calc.timestamp).toLocaleString()}`, margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(0, 150, 180);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 210 - margin, y);
  y += 8;

  // Inputs table
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text("Input Parameters", margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Value"]],
    body: Object.entries(calc.inputs).map(([k, v]) => [k, String(v)]),
    theme: "grid",
    headStyles: { fillColor: [0, 120, 150], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Results table
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text("Calculated Results", margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Symbol", "Formula", "Result", "Unit"]],
    body: calc.results.map((r) => [
      r.label,
      r.symbol,
      r.formula,
      r.value.toFixed(6),
      r.unit,
    ]),
    theme: "grid",
    headStyles: { fillColor: [0, 120, 150], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 15 },
      2: { cellWidth: 70 },
      3: { cellWidth: 25 },
      4: { cellWidth: 15 },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Notes
  const noteResults = calc.results.filter((r) => r.note);
  if (noteResults.length > 0 && y < 260) {
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text("Engineering Notes", margin, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Note"]],
      body: noteResults.map((r) => [r.label, r.note ?? ""]),
      theme: "grid",
      headStyles: { fillColor: [60, 60, 80], textColor: 255, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Industrial Gear Engineering Calculator — Calculations based on accepted engineering principles (Machinery's Handbook, ISO, AGMA, DIN)",
      margin,
      295,
    );
    doc.text(`Page ${i} of ${pageCount}`, 210 - margin - 20, 295);
  }

  doc.save(`${calc.type}-gear-calculation.pdf`);
}

export async function exportExcel(calc: StoredCalculation): Promise<void> {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Industrial Gear Engineering Calculator"],
    ["Calculation Type", calc.label],
    ["Date Generated", new Date(calc.timestamp).toLocaleString()],
    [],
    ["References", "Machinery's Handbook 29th Ed.; ISO 6336; AGMA 2001; DIN 3960"],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Inputs sheet
  const inputsData = [
    ["Parameter", "Value"],
    ...Object.entries(calc.inputs).map(([k, v]) => [k, v]),
  ];
  const wsInputs = XLSX.utils.aoa_to_sheet(inputsData);
  XLSX.utils.book_append_sheet(wb, wsInputs, "Inputs");

  // Results sheet
  const resultsData = [
    ["Parameter", "Symbol", "Formula", "Variables", "Value", "Unit", "Note"],
    ...calc.results.map((r) => [
      r.label,
      r.symbol,
      r.formula,
      r.variables,
      r.value,
      r.unit,
      r.note ?? "",
    ]),
  ];
  const wsResults = XLSX.utils.aoa_to_sheet(resultsData);
  XLSX.utils.book_append_sheet(wb, wsResults, "Results");

  // Formula reference sheet
  const formulaData = [
    ["Parameter", "Formula", "Notes"],
    ...calc.results.map((r) => [r.label, r.formula, r.note ?? ""]),
  ];
  const wsFormula = XLSX.utils.aoa_to_sheet(formulaData);
  XLSX.utils.book_append_sheet(wb, wsFormula, "Formula Reference");

  XLSX.writeFile(wb, `${calc.type}-gear-calculation.xlsx`);
}
