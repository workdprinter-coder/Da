import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ResultRow from "@/components/ResultRow";
import { calculateSpiralBevel, spiralBevelInputSchema } from "@/lib/calculations/spiral-bevel";
import { useCalculator } from "@/context/calculator-context";
import { Save, RotateCcw } from "lucide-react";

type FormValues = z.infer<typeof spiralBevelInputSchema>;

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

export default function SpiralBevelPage() {
  const { settings, storeCalc } = useCalculator();
  const [saved, setSaved] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(spiralBevelInputSchema),
    defaultValues: {
      unitSystem: settings.unitSystem,
      mn: 3,
      z1: 17,
      z2: 43,
      shaftAngle: 90,
      spiralAngle: 35,
      pressureAngle: 20,
      faceWidthRatio: 0.3,
      addendumFactor: 1.000,
      dedendumFactor: 1.157,
    },
  });

  const values = form.watch();

  const results = useMemo(() => {
    const parsed = spiralBevelInputSchema.safeParse(values);
    if (!parsed.success) return null;
    try { return calculateSpiralBevel(parsed.data); } catch { return null; }
  }, [values]);

  const onSave = () => {
    if (!results) return;
    const v = form.getValues();
    storeCalc("spiral-bevel", {
      type: "spiral-bevel",
      label: `Spiral Bevel: mn=${v.mn}, z1=${v.z1}, z2=${v.z2}, β=${v.spiralAngle}°, ha=${v.addendumFactor}, hf=${v.dedendumFactor}`,
      inputs: {
        "Unit System": v.unitSystem,
        "Normal Module (mn)": v.mn,
        "Pinion Teeth (z1)": v.z1,
        "Gear Teeth (z2)": v.z2,
        "Shaft Angle (°)": v.shaftAngle,
        "Spiral Angle β (°)": v.spiralAngle,
        "Normal Pressure Angle (°)": v.pressureAngle,
        "Face Width Ratio (F/Re)": v.faceWidthRatio ?? 0.3,
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
        <h1 className="text-xl font-bold tracking-tight text-foreground">Spiral Bevel Gear Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Spiral bevel gear pair — cone geometry, blank dimensions, face angles, indexing calculations
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

                {[
                  { name: "mn" as const, label: "Normal Module at Mid-Face (mn)", step: "0.01" },
                  { name: "z1" as const, label: "Pinion Teeth (z1)", step: "1" },
                  { name: "z2" as const, label: "Gear Teeth (z2)", step: "1" },
                  { name: "shaftAngle" as const, label: "Shaft Angle (°)", step: "1" },
                  { name: "spiralAngle" as const, label: "Mean Spiral Angle β (°)", step: "0.5" },
                ].map(({ name, label, step }) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{label}</FormLabel>
                      <FormControl>
                        <Input type="number" step={step} className="h-8 text-sm font-mono"
                          {...field} value={field.value ?? ""}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            field.onChange(isNaN(v) ? undefined : (["z1","z2"].includes(name) ? Math.round(v) : v));
                          }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}

                <FormField control={form.control} name="pressureAngle" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Normal Pressure Angle (°)</FormLabel>
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

                <FormField control={form.control} name="faceWidthRatio" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Face Width Ratio (F/Re)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value ?? 0.3)}>
                      <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="0.25">0.25 (Conservative)</SelectItem>
                        <SelectItem value="0.30">0.30 (Standard)</SelectItem>
                        <SelectItem value="0.33">0.33 (Maximum recommended)</SelectItem>
                        <SelectItem value="0.40">0.40 (Excessive — warning)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Max recommended: F/Re = 1/3</p>
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
                      <p className="text-[10px] text-muted-foreground">ae = ha × mn = {
                        values.addendumFactor && values.mn
                          ? (values.addendumFactor * values.mn).toFixed(4)
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
                      <p className="text-[10px] text-muted-foreground">be = hf × mn = {
                        values.dedendumFactor && values.mn
                          ? (values.dedendumFactor * values.mn).toFixed(4)
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
                {results.filter(r => ["Gear Ratio","Outer Cone Distance","Pinion Pitch Cone Angle","Gear Pitch Cone Angle","Whole Depth","Depth of Cut","Face Width"].includes(r.label)).map((r) => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">{r.label}</span>
                    <span className="font-mono text-primary shrink-0">{r.value.toFixed(4)} {r.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Calculated Results</h2>

          {results ? (
            <div className="grid sm:grid-cols-2 gap-2">
              {results.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
            </div>
          ) : (
            <div className="border border-border rounded-lg p-8 bg-card text-center text-sm text-muted-foreground">
              Enter valid inputs to see calculated results
            </div>
          )}

          {/* Engineering Disclaimer for Equivalent Machining Lead */}
          {results && (
            <div className="border border-amber-700/40 rounded-lg p-4 bg-amber-950/10">
              <p className="text-xs font-semibold text-amber-400 mb-1">
                Equivalent Machining Lead — Engineering Note
              </p>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                This is an equivalent machining lead calculated from the pitch diameter and spiral angle
                for engineering setup purposes only (L = π × D / tan β, where D = Module × Teeth).
                <strong> A spiral bevel gear does not have a single constant physical lead over the entire
                tooth</strong> — it is generated on a pitch cone, so the tooth curvature and effective
                lead vary across the face width. This value is used solely for differential gear train
                setup, machine table calculations, and similar machining references.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
