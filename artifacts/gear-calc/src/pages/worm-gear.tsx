import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ResultRow from "@/components/ResultRow";
import { calculateWormGear, wormGearInputSchema } from "@/lib/calculations/worm-gear";
import { useCalculator } from "@/context/calculator-context";
import { Save, RotateCcw } from "lucide-react";

type FormValues = z.infer<typeof wormGearInputSchema>;

function ToothProportionRef() {
  return (
    <div className="border border-border/50 rounded p-3 bg-muted/10 space-y-1.5 mt-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Standard Full-Depth Involute Reference
      </p>
      <div className="space-y-0.5 text-[10px] text-muted-foreground font-mono">
        <div className="flex justify-between"><span>Standard Addendum Factor</span><span className="text-foreground/50">= 1.000</span></div>
        <div className="flex justify-between"><span>Standard Dedendum Factor</span><span className="text-foreground/50">= 1.250</span></div>
      </div>
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-0.5">
        Ref: Machinery's Handbook, AGMA, ISO, DIN. Calculator uses your entered values (default 1.000 / 1.157).
      </p>
    </div>
  );
}

export default function WormGearPage() {
  const { settings, storeCalc } = useCalculator();
  const [saved, setSaved] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(wormGearInputSchema),
    defaultValues: {
      unitSystem: settings.unitSystem,
      m: 3,
      z1: 2,
      z2: 40,
      pressureAngle: 20,
      q: 10,
      addendumFactor: 1.000,
      dedendumFactor: 1.157,
    },
  });

  const values = form.watch();

  const results = useMemo(() => {
    const parsed = wormGearInputSchema.safeParse(values);
    if (!parsed.success) return null;
    try { return calculateWormGear(parsed.data); } catch { return null; }
  }, [values]);

  const onSave = () => {
    if (!results) return;
    const v = form.getValues();
    storeCalc("worm", {
      type: "worm",
      label: `Worm: m=${v.m}, z1=${v.z1} starts, z2=${v.z2}, ha=${v.addendumFactor}, hf=${v.dedendumFactor}`,
      inputs: {
        "Unit System": v.unitSystem,
        "Axial Module (m)": v.m,
        "Worm Starts (z1)": v.z1,
        "Worm Wheel Teeth (z2)": v.z2,
        "Pressure Angle (°)": v.pressureAngle,
        "Diameter Factor (q)": v.q ?? 10,
        "Addendum Factor (ha)": v.addendumFactor,
        "Dedendum Factor (hf)": v.dedendumFactor,
      },
      results,
      timestamp: Date.now(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const unitSystem = form.watch("unitSystem");
  const unit = unitSystem === "imperial" ? "in" : "mm";

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Worm & Worm Wheel Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Single to four-start worm gearset — lead angle, efficiency, dimensions, cutter recommendation
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 bg-card">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Input Parameters
            </h2>
            <Form {...form}>
              <form className="space-y-3">
                <FormField control={form.control} name="unitSystem" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Unit System</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="metric">Metric (mm)</SelectItem>
                        <SelectItem value="imperial">Imperial (inch)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="m" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Axial Module (m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" className="h-8 text-sm font-mono"
                        {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="z1" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Worm Starts (z1)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v, 10))} value={String(field.value)}>
                      <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Start (self-locking, low efficiency)</SelectItem>
                        <SelectItem value="2">2 Starts</SelectItem>
                        <SelectItem value="3">3 Starts</SelectItem>
                        <SelectItem value="4">4 Starts (high efficiency)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="z2" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Worm Wheel Teeth (z2)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" className="h-8 text-sm font-mono"
                        {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="q" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Diameter Factor q (d1/m)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value ?? 10)}>
                      <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {[6.3, 8, 10, 12.5, 16, 20].map((q) => (
                          <SelectItem key={q} value={String(q)}>q = {q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Standard: q=10 (recommended)</p>
                  </FormItem>
                )} />

                <FormField control={form.control} name="pressureAngle" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Pressure Angle (°)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value)}>
                      <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="14.5">14.5°</SelectItem>
                        <SelectItem value="20">20° (Standard)</SelectItem>
                        <SelectItem value="25">25°</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                {/* Tooth Proportion Factors */}
                <div className="border-t border-border/40 pt-3 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Tooth Proportion Factors
                  </p>

                  <FormField control={form.control} name="addendumFactor" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Addendum Factor (ha)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" min="0.1" max="3"
                          className="h-8 text-sm font-mono"
                          {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">a = ha × m = {
                        values.addendumFactor && values.m
                          ? (values.addendumFactor * values.m).toFixed(4)
                          : "—"
                      } {unit}</p>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="dedendumFactor" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Dedendum Factor (hf)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" min="0.1" max="3"
                          className="h-8 text-sm font-mono"
                          {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">b = hf × m = {
                        values.dedendumFactor && values.m
                          ? (values.dedendumFactor * values.m).toFixed(4)
                          : "—"
                      } {unit}</p>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <ToothProportionRef />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => form.reset()} className="text-xs flex items-center gap-1">
                    <RotateCcw size={12} /> Reset
                  </Button>
                  <Button type="button" size="sm" onClick={onSave} disabled={!results} className="text-xs ml-auto flex items-center gap-1">
                    <Save size={12} /> {saved ? "Saved" : "Save for Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {results && (
            <div className="border border-border rounded-lg p-3 bg-card">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Quick Summary</h3>
              <div className="space-y-1">
                {results.filter(r => ["Gear Ratio","Lead","Lead Angle","Centre Distance","Whole Depth","Depth of Cut","Efficiency (μ = 0.05)"].includes(r.label)).map((r) => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">{r.label}</span>
                    <span className="font-mono text-primary shrink-0">{r.value.toFixed(3)} {r.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Calculated Results</h2>
          {results ? (
            <div className="grid sm:grid-cols-2 gap-2">
              {results.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
            </div>
          ) : (
            <div className="border border-border rounded-lg p-8 bg-card text-center text-sm text-muted-foreground">
              Enter valid inputs to see calculated results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
