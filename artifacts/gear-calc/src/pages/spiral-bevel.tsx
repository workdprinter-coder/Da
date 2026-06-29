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
    },
  });

  const values = form.watch();

  const results = useMemo(() => {
    const parsed = spiralBevelInputSchema.safeParse(values);
    if (!parsed.success) return null;
    try {
      return calculateSpiralBevel(parsed.data);
    } catch {
      return null;
    }
  }, [values]);

  const onSave = () => {
    if (!results) return;
    const v = form.getValues();
    storeCalc("spiral-bevel", {
      type: "spiral-bevel",
      label: `Spiral Bevel: mn=${v.mn}, z1=${v.z1}, z2=${v.z2}, β=${v.spiralAngle}°`,
      inputs: {
        "Unit System": v.unitSystem,
        "Normal Module (mn)": v.mn,
        "Pinion Teeth (z1)": v.z1,
        "Gear Teeth (z2)": v.z2,
        "Shaft Angle (°)": v.shaftAngle,
        "Spiral Angle β (°)": v.spiralAngle,
        "Normal Pressure Angle (°)": v.pressureAngle,
        "Face Width Ratio (F/Re)": v.faceWidthRatio ?? 0.3,
      },
      results,
      timestamp: Date.now(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="unitSystem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Unit System</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="metric">Metric (mm)</SelectItem>
                          <SelectItem value="imperial">Imperial (inch)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {[
                  { name: "mn" as const, label: "Normal Module at Mid-Face (mn)", step: "0.01" },
                  { name: "z1" as const, label: "Pinion Teeth (z1)", step: "1" },
                  { name: "z2" as const, label: "Gear Teeth (z2)", step: "1" },
                  { name: "shaftAngle" as const, label: "Shaft Angle (°)", step: "1" },
                  { name: "spiralAngle" as const, label: "Mean Spiral Angle β (°)", step: "0.5" },
                ].map(({ name, label, step }) => (
                  <FormField key={name} control={form.control} name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{label}</FormLabel>
                        <FormControl>
                          <Input type="number" step={step} className="h-8 text-sm font-mono"
                            data-testid={`input-${name}`}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              field.onChange(isNaN(v) ? undefined : (["z1","z2"].includes(name) ? Math.round(v) : v));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <FormField
                  control={form.control}
                  name="pressureAngle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Normal Pressure Angle (°)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="14.5">14.5°</SelectItem>
                          <SelectItem value="20">20° (Standard)</SelectItem>
                          <SelectItem value="25">25°</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="faceWidthRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Face Width Ratio (F/Re)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value ?? 0.3)}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0.25">0.25 (Conservative)</SelectItem>
                          <SelectItem value="0.30">0.30 (Standard)</SelectItem>
                          <SelectItem value="0.33">0.33 (Maximum recommended)</SelectItem>
                          <SelectItem value="0.40">0.40 (Excessive — warning)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Max recommended: F/Re = 1/3</p>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => form.reset()} className="text-xs flex items-center gap-1">
                    <RotateCcw size={12} /> Reset
                  </Button>
                  <Button type="button" size="sm" onClick={onSave} disabled={!results} className="text-xs ml-auto flex items-center gap-1" data-testid="button-save-calc">
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
                {results.filter(r => ["Gear Ratio","Outer Cone Distance","Pinion Pitch Cone Angle","Gear Pitch Cone Angle","Face Width"].includes(r.label)).map((r) => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">{r.label}</span>
                    <span className="font-mono text-primary shrink-0">{r.value.toFixed(4)} {r.unit}</span>
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
              {results.map((r, i) => (
                <ResultRow key={i} result={r} index={i} />
              ))}
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
