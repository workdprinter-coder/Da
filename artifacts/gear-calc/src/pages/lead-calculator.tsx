import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResultRow from "@/components/ResultRow";
import {
  calculateHelicalLead, helicalLeadInputSchema,
  calculateWormLead, wormLeadInputSchema,
  calculateSpiralBevelLead, spiralBevelLeadInputSchema,
} from "@/lib/calculations/lead-calculator";
import { useCalculator } from "@/context/calculator-context";

type HelicalForm = z.infer<typeof helicalLeadInputSchema>;
type WormForm = z.infer<typeof wormLeadInputSchema>;
type BevelForm = z.infer<typeof spiralBevelLeadInputSchema>;

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-border pb-2 mb-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function HelicalSection({ unit }: { unit: string }) {
  const { settings } = useCalculator();
  const form = useForm<HelicalForm>({
    resolver: zodResolver(helicalLeadInputSchema),
    defaultValues: { unitSystem: settings.unitSystem, mn: 3, z: 20, helixAngle: 20 },
  });
  const values = form.watch();
  const results = useMemo(() => {
    const p = helicalLeadInputSchema.safeParse(values);
    if (!p.success) return null;
    try { return calculateHelicalLead(p.data); } catch { return null; }
  }, [values]);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="border border-border rounded-lg p-4 bg-card space-y-3">
        <SectionHeader title="Helical Gear Lead" subtitle="L = π × d / tan(β) = z × pa" />
        <Form {...form}>
          <form className="space-y-3">
            {[
              { name: "mn" as const, label: "Normal Module (mn)", step: "0.5" },
              { name: "z" as const, label: "Number of Teeth (z)", step: "1" },
              { name: "helixAngle" as const, label: "Helix Angle β (°)", step: "0.5" },
            ].map(({ name, label, step }) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{label}</FormLabel>
                  <FormControl>
                    <Input type="number" step={step} className="h-8 text-sm font-mono"
                      {...field} onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        field.onChange(isNaN(v) ? 0 : (name === "z" ? Math.round(v) : v));
                      }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </form>
        </Form>
        {results && (
          <div className="border border-primary/20 rounded p-3 bg-primary/5 mt-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Lead Result</p>
            <p className="font-mono text-lg font-bold text-primary">
              {results.find(r => r.label === "Lead")?.value.toFixed(4)} {unit}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">π × d / tan(β)</p>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Step-by-Step Calculation</h3>
        {results ? (
          <div className="space-y-2">
            {results.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
          </div>
        ) : (
          <div className="border border-border rounded-lg p-8 bg-card text-center text-sm text-muted-foreground">
            Enter valid inputs to see lead calculation
          </div>
        )}
      </div>
    </div>
  );
}

function WormSection({ unit }: { unit: string }) {
  const { settings } = useCalculator();
  const form = useForm<WormForm>({
    resolver: zodResolver(wormLeadInputSchema),
    defaultValues: { unitSystem: settings.unitSystem, m: 3, z1: 2, q: 10 },
  });
  const values = form.watch();
  const results = useMemo(() => {
    const p = wormLeadInputSchema.safeParse(values);
    if (!p.success) return null;
    try { return calculateWormLead(p.data); } catch { return null; }
  }, [values]);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="border border-border rounded-lg p-4 bg-card space-y-3">
        <SectionHeader title="Worm Lead" subtitle="L = z1 × π × m (starts × axial pitch)" />
        <Form {...form}>
          <form className="space-y-3">
            <FormField control={form.control} name="m" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Axial Module (m)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" className="h-8 text-sm font-mono"
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
                    <SelectItem value="1">1 Start</SelectItem>
                    <SelectItem value="2">2 Starts</SelectItem>
                    <SelectItem value="3">3 Starts</SelectItem>
                    <SelectItem value="4">4 Starts</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="q" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Diameter Factor (q)</FormLabel>
                <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value)}>
                  <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {[6.3, 8, 10, 12.5, 16, 20].map(q => (
                      <SelectItem key={q} value={String(q)}>q = {q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </form>
        </Form>
        {results && (
          <div className="border border-primary/20 rounded p-3 bg-primary/5 mt-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Lead Result</p>
            <p className="font-mono text-lg font-bold text-primary">
              {results.find(r => r.label === "Lead")?.value.toFixed(4)} {unit}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">z1 × π × m</p>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Step-by-Step Calculation</h3>
        {results ? (
          <div className="space-y-2">
            {results.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
          </div>
        ) : (
          <div className="border border-border rounded-lg p-8 bg-card text-center text-sm text-muted-foreground">
            Enter valid inputs to see lead calculation
          </div>
        )}
      </div>
    </div>
  );
}

function SpiralBevelSection({ unit }: { unit: string }) {
  const { settings } = useCalculator();
  const form = useForm<BevelForm>({
    resolver: zodResolver(spiralBevelLeadInputSchema),
    defaultValues: {
      unitSystem: settings.unitSystem,
      mn: 3,
      z: 17,
      delta_deg: 21.57,
      spiralAngle: 35,
      faceWidthRatio: 0.3,
    },
  });
  const values = form.watch();
  const results = useMemo(() => {
    const p = spiralBevelLeadInputSchema.safeParse(values);
    if (!p.success) return null;
    try { return calculateSpiralBevelLead(p.data); } catch { return null; }
  }, [values]);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="border border-border rounded-lg p-4 bg-card space-y-3">
        <SectionHeader title="Spiral Bevel Lead" subtitle="L = π × dm / tan(β) at mean cone distance" />
        <Form {...form}>
          <form className="space-y-3">
            {[
              { name: "mn" as const, label: "Normal Module (mn)", step: "0.5" },
              { name: "z" as const, label: "Number of Teeth (z)", step: "1" },
              { name: "delta_deg" as const, label: "Pitch Cone Angle δ (°)", step: "0.1" },
              { name: "spiralAngle" as const, label: "Mean Spiral Angle β (°)", step: "0.5" },
            ].map(({ name, label, step }) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{label}</FormLabel>
                  <FormControl>
                    <Input type="number" step={step} className="h-8 text-sm font-mono"
                      {...field} onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        field.onChange(isNaN(v) ? 0 : (name === "z" ? Math.round(v) : v));
                      }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
            <FormField control={form.control} name="faceWidthRatio" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Face Width Ratio (F/Re)</FormLabel>
                <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value ?? 0.3)}>
                  <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="0.25">0.25</SelectItem>
                    <SelectItem value="0.30">0.30 (Standard)</SelectItem>
                    <SelectItem value="0.33">0.33 (Max)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </form>
        </Form>
        {results && (
          <div className="border border-primary/20 rounded p-3 bg-primary/5 mt-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Lead at Mean Pitch Circle</p>
            <p className="font-mono text-lg font-bold text-primary">
              {results.find(r => r.label === "Lead at Mean Pitch Circle")?.value.toFixed(4)} {unit}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">π × dm / tan(β)</p>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Step-by-Step Calculation</h3>
        {results ? (
          <div className="space-y-2">
            {results.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
          </div>
        ) : (
          <div className="border border-border rounded-lg p-8 bg-card text-center text-sm text-muted-foreground">
            Enter valid inputs to see lead calculation
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadCalculatorPage() {
  const { settings } = useCalculator();
  const unit = settings.unitSystem === "imperial" ? "in" : "mm";

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Lead Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lead in mm for helical gears, worm gears, and spiral bevel gears — full formula, variable definitions, step-by-step calculation
        </p>
      </div>

      <div className="border border-border/40 rounded-lg p-3 bg-amber-950/10 border-amber-700/30">
        <p className="text-xs text-amber-300/80">
          <strong>Lead Definition:</strong> Lead is the axial distance a helical thread or tooth advances in one complete revolution.
          For a helical gear: L = π·d/tan(β). For a worm: L = z₁ × π × m (number of starts × axial pitch).
          For spiral bevel: Lead is measured at the mean pitch circle and used for differential gear train setup on bevel gear generators.
        </p>
      </div>

      <Tabs defaultValue="helical">
        <TabsList className="h-9">
          <TabsTrigger value="helical" className="text-xs">Helical Gear</TabsTrigger>
          <TabsTrigger value="worm" className="text-xs">Worm</TabsTrigger>
          <TabsTrigger value="spiral-bevel" className="text-xs">Spiral Bevel</TabsTrigger>
        </TabsList>

        <TabsContent value="helical" className="mt-4">
          <HelicalSection unit={unit} />
        </TabsContent>
        <TabsContent value="worm" className="mt-4">
          <WormSection unit={unit} />
        </TabsContent>
        <TabsContent value="spiral-bevel" className="mt-4">
          <SpiralBevelSection unit={unit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
