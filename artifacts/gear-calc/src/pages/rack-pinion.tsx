import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ResultRow from "@/components/ResultRow";
import { calculateRackPinion, rackPinionInputSchema } from "@/lib/calculations/rack-pinion";
import { useCalculator } from "@/context/calculator-context";
import { Save, RotateCcw } from "lucide-react";

type FormValues = z.infer<typeof rackPinionInputSchema>;

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

export default function RackPinionPage() {
  const { settings, storeCalc } = useCalculator();
  const [saved, setSaved] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(rackPinionInputSchema),
    defaultValues: {
      unitSystem: settings.unitSystem,
      m: 3,
      z: 20,
      pressureAngle: settings.defaultPressureAngle,
      faceWidth: 30,
      rackLength: 300,
      addendumFactor: settings.defaultAddendumFactor,
      dedendumFactor: settings.defaultDedendumFactor,
    },
  });

  const values = form.watch();

  const results = useMemo(() => {
    const parsed = rackPinionInputSchema.safeParse(values);
    if (!parsed.success) return null;
    try { return calculateRackPinion(parsed.data); } catch { return null; }
  }, [values]);

  const onSave = () => {
    if (!results) return;
    const v = form.getValues();
    storeCalc("rack-pinion", {
      type: "rack-pinion",
      label: `Rack & Pinion: m=${v.m}, z=${v.z}, L=${v.rackLength}mm, ha=${v.addendumFactor}, hf=${v.dedendumFactor}`,
      inputs: {
        "Unit System": v.unitSystem,
        "Module (m)": v.m,
        "Pinion Teeth (z)": v.z,
        "Pressure Angle (°)": v.pressureAngle,
        "Face Width": v.faceWidth,
        "Rack Length": v.rackLength,
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
    "Pinion Pitch Diameter", "Outside Diameter (Pinion)", "Root Diameter (Pinion)",
    "Circular Pitch", "Number of Rack Teeth", "Linear Travel per Revolution",
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Rack & Pinion Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Involute rack and pinion — linear motion, blank dimensions, number of rack teeth, travel per revolution
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

                <FormField control={form.control} name="z" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Pinion Teeth (z)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" className="h-8 text-sm font-mono"
                        {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                    {(values.z ?? 0) < 12 && (values.z ?? 0) >= 6 && (
                      <p className="text-xs text-amber-400">Warning: z &lt; 12 — undercut risk</p>
                    )}
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
                    <FormLabel className="text-xs">Face Width ({unit})</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" className="h-8 text-sm font-mono"
                        {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <p className="text-[10px] text-muted-foreground">Recommended: 8m to 16m = {
                      values.m ? `${(8 * values.m).toFixed(1)}–${(16 * values.m).toFixed(1)} ${unit}` : "—"
                    }</p>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="rackLength" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Rack Length ({unit})</FormLabel>
                    <FormControl>
                      <Input type="number" step="10" className="h-8 text-sm font-mono"
                        {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
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
                        <Input type="number" step="0.001" min="0.1" max="3" className="h-8 text-sm font-mono"
                          {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">a = ha × m = {
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
                      <p className="text-[10px] text-muted-foreground">b = hf × m = {
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
                    <span className="font-mono text-primary shrink-0">
                      {r.label === "Gear Ratio" ? "∞" : r.label === "Number of Rack Teeth" ? Math.floor(r.value) : r.value.toFixed(4)} {r.unit}
                    </span>
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
