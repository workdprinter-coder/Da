import { useState } from "react";
import { useCalculator } from "@/context/calculator-context";
import { exportCSV, exportPDF, exportExcel } from "@/lib/reports";
import { Button } from "@/components/ui/button";
import { FileText, Sheet, Download, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  spur: "Spur Gear Pair",
  helical: "Helical Gear Pair",
  worm: "Worm & Worm Wheel",
  "spiral-bevel": "Spiral Bevel Gear",
};

export default function ReportsPage() {
  const { storedCalcs, clearCalcs } = useCalculator();
  const [generating, setGenerating] = useState<string | null>(null);

  const calcs = Object.values(storedCalcs).filter(Boolean);

  const handle = async (type: "pdf" | "excel" | "csv", calcType: string) => {
    const calc = storedCalcs[calcType];
    if (!calc) return;
    const key = `${calcType}-${type}`;
    setGenerating(key);
    try {
      if (type === "pdf") await exportPDF(calc);
      else if (type === "excel") await exportExcel(calc);
      else exportCSV(calc);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate professional PDF, Excel, or CSV reports from saved calculations
        </p>
      </div>

      {calcs.length === 0 ? (
        <div className="border border-border rounded-lg p-12 bg-card text-center space-y-3">
          <FileText size={32} className="mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No calculations saved yet</p>
          <p className="text-xs text-muted-foreground/60">
            Run a calculation in any gear module and click "Save for Report" to enable report generation
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Report contents preview */}
          <div className="border border-border rounded-lg p-4 bg-muted/10">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Report Contents
            </h3>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              {[
                "Input parameters with units",
                "All calculated dimensions",
                "Formulas used for each result",
                "Variable definitions",
                "Step-by-step substitution values",
                "Manufacturing notes",
                "Engineering warnings",
                "Date and reference standards",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Calculation cards */}
          {calcs.map((calc) => {
            if (!calc) return null;
            return (
              <div
                key={calc.type}
                data-testid={`report-card-${calc.type}`}
                className="border border-border rounded-lg p-4 bg-card space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{TYPE_LABELS[calc.type] ?? calc.type}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{calc.label}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {new Date(calc.timestamp).toLocaleString()} · {calc.results.length} results
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 font-mono shrink-0">
                    Ready
                  </span>
                </div>

                {/* Input summary */}
                <div className="bg-muted/20 rounded p-3 border border-border/40">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Inputs</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                    {Object.entries(calc.inputs).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs gap-2">
                        <span className="text-muted-foreground truncate">{k}</span>
                        <span className="font-mono text-foreground/80 shrink-0">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    data-testid={`btn-pdf-${calc.type}`}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs"
                    disabled={generating === `${calc.type}-pdf`}
                    onClick={() => handle("pdf", calc.type)}
                  >
                    <FileText size={13} className="text-red-400" />
                    {generating === `${calc.type}-pdf` ? "Generating..." : "PDF Report"}
                  </Button>
                  <Button
                    data-testid={`btn-excel-${calc.type}`}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs"
                    disabled={generating === `${calc.type}-excel`}
                    onClick={() => handle("excel", calc.type)}
                  >
                    <Sheet size={13} className="text-green-400" />
                    {generating === `${calc.type}-excel` ? "Generating..." : "Excel Export"}
                  </Button>
                  <Button
                    data-testid={`btn-csv-${calc.type}`}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs"
                    disabled={generating === `${calc.type}-csv`}
                    onClick={() => handle("csv", calc.type)}
                  >
                    <Download size={13} className="text-cyan-400" />
                    {generating === `${calc.type}-csv` ? "..." : "CSV Data"}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Clear all */}
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={clearCalcs}
              data-testid="btn-clear-all"
            >
              <Trash2 size={12} />
              Clear All Saved Calculations
            </Button>
          </div>
        </div>
      )}

      {/* Standards note */}
      <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground/50">Report Standards Note:</strong> All reports include a
          disclaimer that calculations are based on accepted engineering principles (Machinery's Handbook,
          ISO 6336, AGMA 2001, DIN 3960) and should be verified by a qualified engineer before manufacture.
        </p>
      </div>
    </div>
  );
}
