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

const DEFAULT_VALUES: FormValues = {
  mn: 3,
  z: 15,
  spiralAngle: 35,
};

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

  // Derived preview values for inline hints
  const mn = values.mn ?? 0;
  const z = values.z ?? 0;
  const beta = values.spiralAngle ?? 0;
  const D = mn * z;
  const L_mm = D > 0 && beta > 0 && beta < 90
    ? (Math.PI * D) / Math.tan((beta * Math.PI) / 180)
    : 0;
  const L_in = L_mm / 25.4;

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
                    <FormLabel className="text-xs">Module (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number" step="0.01" min="0.1"
                        className="h-8 text-sm font-mono"
                        {...field}
                        value={field.value ?? ""}
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
                        {...field}
                        value={field.value ?? ""}
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
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          field.onChange(isNaN(v) ? undefined : v);
                        }}
                      />
                    </FormControl>
                    <p className="text-[10px] text-muted-foreground">Standard: 35° (Gleason)</p>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => form.reset(DEFAULT_VALUES)}
                    className="text-xs flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Reset
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Quick Summary */}
          {results && D > 0 && L_mm > 0 && (
            <div className="border border-border rounded-lg p-3 bg-card space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Quick Summary
              </h3>
              <div className="space-y-1">
                {[
                  { label: "Pitch Diameter", value: D.toFixed(4), unit: "mm" },
                  { label: "Spiral Angle", value: `${beta}`, unit: "°" },
                  { label: "Lead (mm)", value: L_mm.toFixed(4), unit: "mm" },
                  { label: "Lead (inch)", value: L_in.toFixed(4), unit: "in" },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-primary">{value} {unit}</span>
                  </div>
                ))}
              </div>

              {/* Inline formula breakdown */}
              <div className="border-t border-border/30 pt-2 space-y-0.5 font-mono text-[10px] text-muted-foreground">
                <div>D = {mn} × {z} = <span className="text-foreground/70">{D.toFixed(4)} mm</span></div>
                <div>L = (π × {D.toFixed(4)}) / tan({beta}°)</div>
                <div className="pl-3">= {(Math.PI * D).toFixed(4)} / {Math.tan((beta * Math.PI) / 180).toFixed(6)}</div>
                <div className="pl-3 text-primary">= {L_mm.toFixed(4)} mm</div>
                <div>L = {L_mm.toFixed(4)} / 25.4 = <span className="text-primary">{L_in.toFixed(4)} in</span></div>
              </div>
            </div>
          )}

          {/* Engineering note */}
          <div className="border border-amber-700/40 rounded-lg p-3 bg-amber-950/10">
            <p className="text-[10px] font-semibold text-amber-400 mb-1">Engineering Note</p>
            <p className="text-[10px] text-amber-300/80 leading-relaxed">
              A spiral bevel gear is generated on a pitch cone — it does not have a single
              constant physical lead. This value is an <strong>equivalent machining lead</strong> derived
              from the pitch diameter and spiral angle, used for differential gear train setup,
              machine table calculations, and similar machining references only.
            </p>
          </div>
        </div>

        {/* ── Results Panel ────────────────────────────────────── */}
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

          {/* Engineering disclaimer below results */}
          {results && (
            <div className="border border-amber-700/40 rounded-lg p-4 bg-amber-950/10">
              <p className="text-xs font-semibold text-amber-400 mb-1">
                Equivalent Machining Lead — Engineering Disclaimer
              </p>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                This is an equivalent machining lead calculated from the pitch diameter and spiral
                angle for engineering setup purposes only (L = π × D / tan β, where D = m × z).
                <strong> A spiral bevel gear does not have a single constant physical lead over the
                entire tooth</strong> — it is generated on a pitch cone, so the tooth curvature and
                effective lead vary across the face width. This value is used solely for differential
                gear train setup, machine table calculations, and similar machining references.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
