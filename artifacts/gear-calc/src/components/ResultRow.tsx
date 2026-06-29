import { cn } from "@/lib/utils";
import type { CalculationResult } from "@/lib/calculations/spur-gear";
import { useCalculator } from "@/context/calculator-context";

interface ResultRowProps {
  result: CalculationResult;
  index: number;
}

export default function ResultRow({ result, index }: ResultRowProps) {
  const { settings } = useCalculator();
  const dp = settings.decimalPlaces;

  const formatValue = (v: number) => {
    if (Math.abs(v) >= 1000) return v.toFixed(dp);
    if (Math.abs(v) < 0.0001 && v !== 0) return v.toExponential(dp);
    return v.toFixed(dp);
  };

  const valueColorClass = cn(
    "font-mono font-semibold text-sm",
    result.error ? "text-red-500" :
    result.warning ? "text-amber-500" :
    result.amber ? "text-amber-400" :
    result.green ? "text-green-400" :
    "text-primary"
  );

  return (
    <div
      data-testid={`result-row-${index}`}
      className={cn(
        "border border-border rounded p-3 bg-card text-sm space-y-1.5",
        result.error ? "border-red-500/40 bg-red-950/10" :
        result.warning ? "border-amber-500/30" : ""
      )}
    >
      {/* Label + Symbol */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold text-foreground text-sm">{result.label}</span>
        <span className="font-mono text-xs text-muted-foreground">{result.symbol}</span>
      </div>

      {/* Formula */}
      <div className="text-xs text-muted-foreground">
        <span className="text-foreground/40 mr-1">Formula:</span>
        <span className="font-mono text-cyan-400/80">{result.formula}</span>
      </div>

      {/* Variables */}
      <div className="text-xs text-muted-foreground leading-relaxed">
        <span className="text-foreground/40 mr-1">Where:</span>
        {result.variables}
      </div>

      {/* Substitution */}
      {result.substitution && result.substitution !== "[...]" && (
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground/40 mr-1">Calc:</span>
          <span className="font-mono text-foreground/60">{result.symbol} = {result.substitution}</span>
        </div>
      )}

      {/* Result */}
      <div className="flex items-baseline gap-2 pt-1 border-t border-border/50">
        <span className="text-xs text-muted-foreground">{result.symbol} =</span>
        <span className={valueColorClass}>
          {result.unit === "" && result.label.includes("Ratio")
            ? formatValue(result.value) + ":1"
            : formatValue(result.value)
          }
        </span>
        {result.unit && <span className="text-xs text-muted-foreground">{result.unit}</span>}
      </div>

      {/* Note */}
      {result.note && (
        <div className={cn(
          "text-xs px-2 py-1 rounded border-l-2",
          result.error ? "border-red-500 bg-red-950/20 text-red-400" :
          result.warning ? "border-amber-500 bg-amber-950/20 text-amber-400" :
          "border-primary/30 bg-primary/5 text-muted-foreground"
        )}>
          {result.note}
        </div>
      )}
    </div>
  );
}
