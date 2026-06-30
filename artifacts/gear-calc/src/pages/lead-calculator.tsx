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

function SpiralBevelSection() {
  const form = useForm<BevelForm>({
    resolver: zodResolver(spiralBevelLeadInputSchema),
    defaultValues: { mn: 3, z: 15, spiralAngle: 35 },
  });
  const values = form.watch();
  const results = useMemo(() => {
    const p = spiralBevelLeadInputSchema.safeParse(values);
    if (!p.success) return null;
    try { return calculateSpiralBevelLead(p.data); } catch { return null; }
  }, [values]);

  const mn   = values.mn ?? 0;
  const z    = values.z ?? 0;
  const beta = values.spiralAngle ?? 0;
  const valid = mn > 0 && z > 0 && beta > 0 && beta < 90;
  const D    = mn * z;
  const tanB = valid ? Math.tan((beta * Math.PI) / 180) : 0;
  const L_mm = valid ? (Math.PI * D) / tanB : 0;
  const L_in = L_mm / 25.4;
  const r    = (n: number, dp = 2) => n.toFixed(dp);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <SectionHeader
            title="Spiral Bevel — Equivalent Machining Lead"
            subtitle="L = (π × D) ÷ tan(β)  where D = m × z"
          />
          <Form {...form}>
            <form className="space-y-3">
              {([
                { name: "mn"          as const, label: "Module (m)",            step: "0.01", isInt: false },
                { name: "z"           as const, label: "Number of Teeth (z)",   step: "1",    isInt: true  },
                { name: "spiralAngle" as const, label: "Spiral Angle β (°)",    step: "0.5",  isInt: false },
              ] as const).map(({ name, label, step, isInt }) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{label}</FormLabel>
                    <FormControl>
                      <Input type="number" step={step} className="h-8 text-sm font-mono"
                        {...field} value={field.value ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          field.onChange(isNaN(v) ? undefined : (isInt ? Math.round(v) : v));
                        }} />
                    </FormControl>
                    {name === "spiralAngle" && (
                      <p className="text-[10px] text-muted-foreground">Range: 1° – 89° · Standard: 35°</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </form>
          </Form>

          {valid && results && (
            <div className="border border-primary/20 rounded p-3 bg-primary/5 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Result</p>
              <p className="font-mono text-lg font-bold text-primary">{r(L_mm)} mm</p>
              <p className="font-mono text-sm text-primary/70">{r(L_in)} inch</p>
              <p className="text-[10px] text-muted-foreground">(π × D) ÷ tan(β)</p>
            </div>
          )}
        </div>

        {/* Engineering note */}
        <div className="border border-amber-700/40 rounded-lg p-3 bg-amber-950/10">
          <p className="text-[10px] font-semibold text-amber-400 mb-1">Engineering Note</p>
          <p className="text-[10px] text-amber-300/80 leading-relaxed">
            Equivalent Machining Lead is intended for workshop setup and engineering calculations only.
            A spiral bevel gear does not have a single constant physical lead like a helical gear or worm.
            This value is calculated from the pitch diameter and spiral angle for machining setup.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step-by-Step Calculation</h3>

        {results ? (
          <div className="space-y-2">
            {results.map((res, i) => <ResultRow key={i} result={res} index={i} />)}
          </div>
        ) : (
          <div className="border border-border rounded-lg p-8 bg-card text-center text-sm text-muted-foreground">
            Enter valid inputs to see lead calculation
          </div>
        )}

        {/* Handbook-style steps */}
        {valid && results && (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-2 border-b border-border bg-muted/20">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Calculation Steps</h4>
            </div>
            <div className="divide-y divide-border/40">
              <div className="px-4 py-3 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">Step 1 — Pitch Diameter</p>
                {[
                  "D = Module × Teeth",
                  `D = ${r(mn)} × ${z}`,
                  `D = ${r(D)} mm`,
                ].map((line, i) => (
                  <div key={i} className="flex gap-3 text-xs font-mono">
                    <span className="text-muted-foreground w-4 shrink-0">▸</span>
                    <span className={i === 2 ? "text-primary font-semibold" : "text-foreground/80"}>{line}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">Step 2 — Equivalent Lead</p>
                {[
                  "Lead = (π × D) ÷ tan(β)",
                  `Lead = (${Math.PI.toFixed(9)} × ${r(D)}) ÷ tan(${beta}°)`,
                  `Lead = ${(Math.PI * D).toFixed(9)} ÷ ${tanB.toFixed(9)}`,
                  `Lead = ${r(L_mm)} mm`,
                ].map((line, i) => (
                  <div key={i} className="flex gap-3 text-xs font-mono">
                    <span className="text-muted-foreground w-4 shrink-0">▸</span>
                    <span className={i === 3 ? "text-primary font-semibold" : "text-foreground/80"}>{line}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">Step 3 — Lead in Inches</p>
                {[
                  "Lead (inch) = Lead (mm) ÷ 25.4",
                  `Lead = ${r(L_mm)} ÷ 25.4`,
                  `Lead = ${r(L_in)} inch`,
                ].map((line, i) => (
                  <div key={i} className="flex gap-3 text-xs font-mono">
                    <span className="text-muted-foreground w-4 shrink-0">▸</span>
                    <span className={i === 2 ? "text-primary font-semibold" : "text-foreground/80"}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
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
          <SpiralBevelSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
