import { Link } from "wouter";
import { Cog, CircleDot, Waves, Triangle, Database, Wrench, FileText, Clock } from "lucide-react";
import { useCalculator } from "@/context/calculator-context";
import { cn } from "@/lib/utils";

const MODULES = [
  {
    href: "/spur-gear",
    icon: Cog,
    title: "Spur Gear",
    desc: "Standard involute spur gear pair — all dimensions from module and tooth count",
    key: "spur",
    inputs: "Module / DP, z1, z2, Pressure Angle",
    color: "cyan",
  },
  {
    href: "/helical-gear",
    icon: CircleDot,
    title: "Helical Gear",
    desc: "Helical gear pair with helix angle calculations, lead, virtual teeth, cutter selection",
    key: "helical",
    inputs: "Normal Module, z1, z2, Helix Angle, Pressure Angle",
    color: "amber",
  },
  {
    href: "/worm-gear",
    icon: Waves,
    title: "Worm & Worm Wheel",
    desc: "Single to four-start worm and worm wheel — lead angle, efficiency, dimensions",
    key: "worm",
    inputs: "Module, Starts, Wheel Teeth, Pressure Angle",
    color: "cyan",
  },
  {
    href: "/spiral-bevel",
    icon: Triangle,
    title: "Spiral Bevel",
    desc: "Spiral bevel gear pair — cone angles, blank dimensions, indexing, machine setup",
    key: "spiral-bevel",
    inputs: "Module, z1, z2, Shaft Angle, Spiral Angle",
    color: "amber",
  },
];

const TOOLS = [
  { href: "/materials", icon: Database, label: "Material Database" },
  { href: "/tools", icon: Wrench, label: "Engineering Tools" },
  { href: "/reports", icon: FileText, label: "Reports" },
];

export default function HomePage() {
  const { storedCalcs } = useCalculator();

  const recentCalcs = Object.values(storedCalcs)
    .filter(Boolean)
    .sort((a, b) => (b!.timestamp ?? 0) - (a!.timestamp ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Industrial Gear Engineering Calculator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Professional gear design and manufacturing calculations — Metric and Imperial
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {["Machinery's Handbook", "ISO Standards", "AGMA 2001", "DIN 3960"].map((ref) => (
            <span
              key={ref}
              className="text-[10px] px-2 py-0.5 bg-muted rounded border border-border text-muted-foreground font-mono uppercase tracking-wide"
            >
              {ref}
            </span>
          ))}
        </div>
      </div>

      {/* Calculator Modules */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Gear Calculators
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {MODULES.map(({ href, icon: Icon, title, desc, key, inputs, color }) => {
            const hasData = !!storedCalcs[key];
            return (
              <Link
                key={href}
                href={href}
                data-testid={`module-card-${key}`}
                className="group relative block border border-border rounded-lg p-4 bg-card hover:border-primary/50 hover:bg-card/80 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded border shrink-0",
                    color === "cyan"
                      ? "bg-cyan-950/30 border-cyan-800/40 text-cyan-400"
                      : "bg-amber-950/30 border-amber-800/40 text-amber-400"
                  )}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                      {hasData && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 font-mono">
                          Calculated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50 mt-2">
                      Inputs: {inputs}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Tools */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Reference & Tools
        </h2>
        <div className="flex flex-wrap gap-2">
          {TOOLS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Calculations */}
      {recentCalcs.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Clock size={12} />
            Recent Calculations
          </h2>
          <div className="space-y-2">
            {recentCalcs.map((calc) => {
              if (!calc) return null;
              const href = calc.type === "spur" ? "/spur-gear"
                : calc.type === "helical" ? "/helical-gear"
                : calc.type === "worm" ? "/worm-gear"
                : "/spiral-bevel";
              return (
                <Link
                  key={calc.type}
                  href={href}
                  className="flex items-center justify-between px-3 py-2 rounded border border-border bg-card text-sm hover:border-primary/40 transition-colors"
                >
                  <span className="font-mono text-foreground/80">{calc.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(calc.timestamp).toLocaleTimeString()}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Engineering Standards Note */}
      <div className="border border-border/50 rounded-lg p-4 bg-muted/20">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground/60">Engineering References:</strong> All calculations implement
          original engineering mathematics consistent with Machinery's Handbook (29th Edition), ISO 6336,
          AGMA 2001, and DIN 3960. Formulas and calculation methods are displayed for every result.
          Always verify critical dimensions with your engineering team before manufacture.
        </p>
      </div>
    </div>
  );
}
