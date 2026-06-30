import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ResultRow from "@/components/ResultRow";
import { calculateStraightBevel, straightBevelInputSchema } from "@/lib/calculations/straight-bevel";
import { useCalculator } from "@/context/calculator-context";
import { Save, RotateCcw } from "lucide-react";

type FormValues = z.infer<typeof straightBevelInputSchema>;

function ToothProportionRef() {
  return (
    <div className="border border-border/50 rounded p-3 bg-muted/10 space-y-1.5 mt-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Standard Full-Depth Reference
      </p>
      <div className="space-y-0.5 text-[10px] text-muted-foreground font-mono">
        <div className="flex justify-between"><span>Standard Addendum Factor</span><span className="text-foreground/50">= 1.000</span></div>
        <div className="flex justify-between"><span>Standard Dedendum Factor</span><span className="text-foreground/50">= 1.250</span></div>
        <div className="flex justify-between"><span>Whole Depth Factor (standard)</span><span className="text-foreground/50">= 2.157 × m</span></div>
      </div>
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-0.5">
        Ref: Machinery's Handbook, AGMA 2003, ISO 23509. Default: ha=1.000, hf=1.157 (depth=2.157m).
      </p>
    </div>
  );
}

export default function StraightBevelPage() {
  const { settings, storeCalc } = useCalculator();
  const [saved, setSaved] = useState(false);

  const haDefault = 1.000;
  const hfDefault = Math.max(0.1, settings.straightBevelFactor - haDefault);

  const form = useForm<FormValues>({
    resolver: zodResolver(straightBevelInputSchema),
    defaultValues: {
      unitSystem: settings.unitSystem,
      m: 3,
      z1: 18,
      z2: 36,
      shaftAngle: 90,
      pressureAngle: settings.defaultPressureAngle,
      faceWidth: undefined,
      addendumFactor: haDefault,
      dedendumFactor: parseFloat(hfDefault.toFixed(3)),
    },
  });

  const values = form.watch();

  const results = useMemo(() => {
    const parsed = straightBevelInputSchema.safeParse(values);
    if (!parsed.success) return null;
    try { return calculateStraightBevel(parsed.data); } catch { return null; }
  }, [values]);

  const onSave = () => {
    if (!results) return;
    const v = form.getValues();
    storeCalc("straight-bevel", {
      type: "straight-bevel",
      label: `Straight Bevel: m=${v.m}, z1=${v.z1}, z2=${v.z2}, Σ=${v.shaftAngle}°, ha=${v.addendumFactor}, hf=${v.dedendumFactor}`,
      inputs: {
        "Unit System": v.unitSystem,
        "Module (m)": v.m,
        "Pinion Teeth (z1)": v.z1,
        "Gear Teeth (z2)": v.z2,
        "Shaft Angle (°)": v.shaftAngle,
        "Pressure Angle (°)": v.pressureAngle,
        "Face Width": v.faceWidth ?? "auto",
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

  const summaryLabels = [
    "Gear Ratio", "Outer Cone Distance", "Pinion Pitch Cone Angle",
    "Gear Pitch Cone Angle", "Whole Depth", "Depth of Cut", "Face Width",
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Straight Bevel Gear Pair Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Standard straight (Zerol) bevel gear pair — full blank geometry, angles, virtual teeth, cutter selection, indexing
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Input Panel */}
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
                    <FormLabel className="text-xs">Module (m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" className="h-8 text-sm font-mono"
                        {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="z1" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Pinion Teeth (z1)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" className="h-8 text-sm font-mono"
                        {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                    {(values.z1 ?? 0) < 13 && <p className="text-xs text-amber-400">Warning: undercut risk with z &lt; 13</p>}
                  </FormItem>
                )} />

                <FormField control={form.control} name="z2" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Gear Teeth (z2)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" className="h-8 text-sm font-mono"
                        {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="shaftAngle" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Shaft Angle Σ (°)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value)}>
                      <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="60">60°</SelectItem>
                        <SelectItem value="75">75°</SelectItem>
                        <SelectItem value="90">90° (Standard — most common)</SelectItem>
                        <SelectItem value="100">100°</SelectItem>
                        <SelectItem value="120">120°</SelectItem>
                      </SelectContent>
                    </Select>
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

                <FormField control={form.control} name="faceWidth" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Face Width ({unit}, optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" className="h-8 text-sm font-mono"
                        placeholder="auto (≤ Re/3)"
                        {...field} value={field.value ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          field.onChange(isNaN(v) ? undefined : v);
                        }} />
                    </FormControl>
                    <p className="text-[10px] text-muted-foreground">Leave blank to use recommended (min of Re/3 and 10m)</p>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Tooth Proportion Factors */}
                <div className="border-t border-border/40 pt-3 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Tooth Proportion Factors
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Default: {settings.straightBevelFactor}×m whole depth (ha + hf = {settings.straightBevelFactor})
                  </p>

                  <FormField control={form.control} name="addendumFactor" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Addendum Factor (ha)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" min="0.1" max="3" className="h-8 text-sm font-mono"
                          {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">ae = ha × m = {
                        values.addendumFactor && values.m
                          ? (values.addendumFactor * (unitSystem === "imperial" ? values.m / 25.4 : values.m)).toFixed(4)
                          : "—"
                      } {unit}</p>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="dedendumFactor" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Dedendum Factor (hf)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" min="0.1" max="3" className="h-8 text-sm font-mono"
                          {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">be = hf × m = {
                        values.dedendumFactor && values.m
                          ? (values.dedendumFactor * (unitSystem === "imperial" ? values.m / 25.4 : values.m)).toFixed(4)
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
                {results.filter(r => summaryLabels.includes(r.label)).map((r) => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">{r.label}</span>
                    <span className="font-mono text-primary shrink-0">{r.value.toFixed(4)} {r.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
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
        </div>
      </div>
    </div>
  );
}
