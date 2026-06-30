import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ResultRow from "@/components/ResultRow";
import { calculateSpiralBevel, spiralBevelInputSchema } from "@/lib/calculations/spiral-bevel";
import { RotateCcw } from "lucide-react";

type FormValues = z.infer<typeof spiralBevelInputSchema>;

const DEFAULT_VALUES: FormValues = { mn: 3, z: 15, spiralAngle: 35 };

function r(n: number, dp = 2) { return n.toFixed(dp); }

function CalcSteps({ mn, z, beta }: { mn: number; z: number; beta: number }) {
  const D      = mn * z;
  const tanB   = Math.tan((beta * Math.PI) / 180);
  const piD    = Math.PI * D;
  const L_mm   = piD / tanB;
  const L_in   = L_mm / 25.4;

  const row = (label: string, value: string) => (
    <div className="flex gap-3 text-xs font-mono">
      <span className="text-muted-foreground w-4 shrink-0">▸</span>
      <span className="text-foreground/80">{label} <span className="text-primary font-semibold">{value}</span></span>
    </div>
  );

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-muted/20">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Calculation Steps
        </h3>
      </div>

      <div className="divide-y divide-border/40">
        {/* Step 1 */}
        <div className="px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">Step 1 — Pitch Diameter</p>
          <div className="space-y-0.5">
            {row("D = Module × Teeth", "")}
            {row(`D = ${r(mn)} × ${z}`, "")}
            {row("D =", `${r(D)} mm`)}
          </div>
        </div>

        {/* Step 2 */}
        <div className="px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">Step 2 — Equivalent Lead</p>
          <div className="space-y-0.5">
            {row("Lead = (π × D) ÷ tan(β)", "")}
            {row(`Lead = (${Math.PI.toFixed(9)} × ${r(D)}) ÷ tan(${beta}°)`, "")}
            {row(`Lead = ${r(piD, 9)} ÷ ${r(tanB, 9)}`, "")}
            {row("Lead =", `${r(L_mm)} mm`)}
          </div>
        </div>

        {/* Step 3 */}
        <div className="px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">Step 3 — Lead in Inches</p>
          <div className="space-y-0.5">
            {row("Lead (inch) = Lead (mm) ÷ 25.4", "")}
            {row(`Lead = ${r(L_mm)} ÷ 25.4`, "")}
            {row("Lead =", `${r(L_in)} inch`)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpiralBevelPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(spiralBevelInputSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const values = form.watch();

  const results = useMemo(() => {
    const parsed = spiralBevelInputSchema.safeParse(values);
    if (!parsed.success) return null;
    try { return calculateSpiralBevel(parsed.data); } catch { return null; }
  }, [values]);

  const mn    = values.mn ?? 0;
  const z     = values.z ?? 0;
  const beta  = values.spiralAngle ?? 0;
  const valid = mn > 0 && z > 0 && beta > 0 && beta < 90;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Spiral Bevel Gear — Equivalent Machining Lead
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calculate pitch diameter and equivalent machining lead from module, teeth, and spiral angle
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* ── Input Panel ─────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 bg-card">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Input Parameters
            </h2>

            <Form {...form}>
              <form className="space-y-3">
                <FormField control={form.control} name="mn" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Module (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number" step="0.01" min="0.01"
                        className="h-8 text-sm font-mono"
                        {...field} value={field.value ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          field.onChange(isNaN(v) ? undefined : v);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="z" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Number of Teeth (z)</FormLabel>
                    <FormControl>
                      <Input
                        type="number" step="1" min="1"
                        className="h-8 text-sm font-mono"
                        {...field} value={field.value ?? ""}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          field.onChange(isNaN(v) ? undefined : v);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="spiralAngle" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Spiral Angle β (°)</FormLabel>
                    <FormControl>
                      <Input
                        type="number" step="0.5" min="1" max="89"
                        className="h-8 text-sm font-mono"
                        {...field} value={field.value ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          field.onChange(isNaN(v) ? undefined : v);
                        }}
                      />
                    </FormControl>
                    <p className="text-[10px] text-muted-foreground">Range: 1° – 89° · Standard: 35° (Gleason)</p>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => form.reset(DEFAULT_VALUES)}
                  className="text-xs flex items-center gap-1 mt-2"
                >
                  <RotateCcw size={12} /> Reset
                </Button>
              </form>
            </Form>
          </div>

          {/* Quick Summary */}
          {valid && results && (() => {
            const D    = mn * z;
            const L_mm = (Math.PI * D) / Math.tan((beta * Math.PI) / 180);
            const L_in = L_mm / 25.4;
            return (
              <div className="border border-border rounded-lg p-3 bg-card space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Summary</h3>
                {[
                  ["Module",          `${r(mn)} mm`],
                  ["Teeth",           `${z}`],
                  ["Spiral Angle",    `${beta}°`],
                  ["Pitch Diameter",  `${r(D)} mm`],
                  ["Lead",            `${r(L_mm)} mm`],
                  ["Lead",            `${r(L_in)} inch`],
                ].map(([lbl, val]) => (
                  <div key={lbl + val} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{lbl}</span>
                    <span className="font-mono text-primary">{val}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Engineering Note */}
          <div className="border border-amber-700/40 rounded-lg p-3 bg-amber-950/10">
            <p className="text-[10px] font-semibold text-amber-400 mb-1">Engineering Note</p>
            <p className="text-[10px] text-amber-300/80 leading-relaxed">
              Equivalent Machining Lead is intended for workshop setup and engineering calculations only.
              A spiral bevel gear does not have a single constant physical lead like a helical gear or worm.
              This value is calculated from the pitch diameter and spiral angle for machining setup.
            </p>
          </div>
        </div>

        {/* ── Results + Steps Panel ────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Calculated Results
          </h2>

          {results ? (
            <div className="grid sm:grid-cols-2 gap-2">
              {results.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
            </div>
          ) : (
            <div className="border border-border rounded-lg p-8 bg-card text-center text-sm text-muted-foreground">
              Enter valid inputs to see calculated results
            </div>
          )}

          {/* Engineering handbook step-by-step */}
          {valid && results && (
            <CalcSteps mn={mn} z={z} beta={beta} />
          )}
        </div>
      </div>
    </div>
  );
}
