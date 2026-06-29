import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ResultRow from "@/components/ResultRow";
import { calculateHelicalGear, helicalGearInputSchema } from "@/lib/calculations/helical-gear";
import { useCalculator } from "@/context/calculator-context";
import { Save, RotateCcw } from "lucide-react";

type FormValues = z.infer<typeof helicalGearInputSchema>;

export default function HelicalGearPage() {
  const { settings, storeCalc } = useCalculator();
  const [saved, setSaved] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(helicalGearInputSchema),
    defaultValues: {
      unitSystem: settings.unitSystem,
      mn: 2,
      z1: 20,
      z2: 40,
      helixAngle: 20,
      pressureAngle: settings.defaultPressureAngle,
      hand: "right",
      faceWidth: 20,
    },
  });

  const values = form.watch();

  const results = useMemo(() => {
    const parsed = helicalGearInputSchema.safeParse(values);
    if (!parsed.success) return null;
    try {
      return calculateHelicalGear(parsed.data);
    } catch {
      return null;
    }
  }, [values]);

  const onSave = () => {
    if (!results) return;
    const v = form.getValues();
    storeCalc("helical", {
      type: "helical",
      label: `Helical: mn=${v.mn}, z1=${v.z1}, z2=${v.z2}, β=${v.helixAngle}°`,
      inputs: {
        "Unit System": v.unitSystem,
        "Normal Module (mn)": v.mn,
        "Pinion Teeth (z1)": v.z1,
        "Gear Teeth (z2)": v.z2,
        "Helix Angle (β, °)": v.helixAngle,
        "Normal Pressure Angle (°)": v.pressureAngle,
        "Hand": v.hand,
        "Face Width (mm)": v.faceWidth ?? "auto",
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
        <h1 className="text-xl font-bold tracking-tight text-foreground">Helical Gear Pair Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parallel-axis helical gears — normal and transverse plane calculations, lead, cutter selection
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
                          <SelectTrigger className="h-8 text-sm" data-testid="select-unit-system">
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
                  { name: "mn" as const, label: "Normal Module (mn)", step: "0.01", min: 0.1 },
                  { name: "z1" as const, label: "Pinion Teeth (z1)", step: "1", min: 6 },
                  { name: "z2" as const, label: "Gear Teeth (z2)", step: "1", min: 6 },
                  { name: "helixAngle" as const, label: "Helix Angle β (°)", step: "0.5", min: 1 },
                  { name: "faceWidth" as const, label: "Face Width (mm, optional)", step: "1", min: 1 },
                ].map(({ name, label, step }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{label}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid={`input-${name}`}
                            type="number"
                            step={step}
                            className="h-8 text-sm font-mono"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              field.onChange(isNaN(v) ? undefined : (name === "z1" || name === "z2" ? Math.round(v) : v));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {name === "helixAngle" && (values.helixAngle ?? 0) > 45 && (
                          <p className="text-xs text-amber-400">Warning: High helix angle — significant axial thrust</p>
                        )}
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
                          <SelectTrigger className="h-8 text-sm" data-testid="select-pressure-angle">
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
                  name="hand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Hand of Helix</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm" data-testid="select-hand">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="right">Right Hand (RH)</SelectItem>
                          <SelectItem value="left">Left Hand (LH)</SelectItem>
                        </SelectContent>
                      </Select>
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
                {results.filter(r => ["Gear Ratio","Transverse Module","Centre Distance","Pitch Diameter Pinion","Lead (Pinion)"].includes(r.label)).map((r) => (
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
