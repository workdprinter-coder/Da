import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ResultRow from "@/components/ResultRow";
import { calculateSpurGear, spurGearInputSchema } from "@/lib/calculations/spur-gear";
import { useCalculator } from "@/context/calculator-context";
import { Save, RotateCcw } from "lucide-react";

type FormValues = z.infer<typeof spurGearInputSchema>;

export default function SpurGearPage() {
  const { settings, storeCalc } = useCalculator();
  const [saved, setSaved] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(spurGearInputSchema),
    defaultValues: {
      unitSystem: settings.unitSystem,
      inputMode: "module",
      moduleValue: 2,
      z1: 20,
      z2: 40,
      pressureAngle: settings.defaultPressureAngle,
    },
  });

  const values = form.watch();

  const results = useMemo(() => {
    const parsed = spurGearInputSchema.safeParse(values);
    if (!parsed.success) return null;
    try {
      return calculateSpurGear(parsed.data);
    } catch {
      return null;
    }
  }, [values]);

  const onSave = () => {
    if (!results) return;
    const v = form.getValues();
    storeCalc("spur", {
      type: "spur",
      label: `Spur: m=${v.moduleValue}, z1=${v.z1}, z2=${v.z2}, PA=${v.pressureAngle}°`,
      inputs: {
        "Unit System": v.unitSystem,
        [v.inputMode === "module" ? "Module (m)" : "Diametral Pitch (DP)"]: v.moduleValue,
        "Pinion Teeth (z1)": v.z1,
        "Gear Teeth (z2)": v.z2,
        "Pressure Angle (°)": v.pressureAngle,
      },
      results,
      timestamp: Date.now(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputMode = form.watch("inputMode");
  const unitSystem = form.watch("unitSystem");
  const unit = unitSystem === "imperial" ? "in" : "mm";

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Spur Gear Pair Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Standard involute spur gear — automatic calculation of all dimensions from minimum input
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
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="unitSystem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Unit System</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit-system" className="h-8 text-sm">
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

                <FormField
                  control={form.control}
                  name="inputMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Input Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-input-mode" className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="module">Module (m)</SelectItem>
                          <SelectItem value="dp">Diametral Pitch (DP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moduleValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {inputMode === "module" ? `Module (m)` : `Diametral Pitch (DP, teeth/${unit === "in" ? "in" : "mm"})`}
                      </FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-module"
                          type="number"
                          step="0.01"
                          className="h-8 text-sm font-mono"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="z1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Pinion Teeth (z1)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-z1"
                          type="number"
                          step="1"
                          className="h-8 text-sm font-mono"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormMessage />
                      {(values.z1 ?? 0) < 12 && (values.z1 ?? 0) >= 6 && (
                        <p className="text-xs text-amber-400">Warning: z &lt; 12 — undercut risk. Consider profile shift.</p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="z2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Gear Teeth (z2)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-z2"
                          type="number"
                          step="1"
                          className="h-8 text-sm font-mono"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pressureAngle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Pressure Angle (°)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-pressure-angle" className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="14.5">14.5° (Full depth, older standard)</SelectItem>
                          <SelectItem value="20">20° (Standard — preferred)</SelectItem>
                          <SelectItem value="25">25° (Stub tooth, high load)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.reset()}
                    className="flex items-center gap-1 text-xs"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={onSave}
                    disabled={!results}
                    className="flex items-center gap-1 text-xs ml-auto"
                    data-testid="button-save-calc"
                  >
                    <Save size={12} />
                    {saved ? "Saved" : "Save for Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Quick Summary */}
          {results && (
            <div className="border border-border rounded-lg p-3 bg-card">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Quick Summary</h3>
              <div className="space-y-1">
                {results.filter(r => ["Gear Ratio","Centre Distance","Outside Diameter Pinion","Outside Diameter Gear"].includes(r.label)).map((r) => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono text-primary">{r.value.toFixed(4)} {r.unit}</span>
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
