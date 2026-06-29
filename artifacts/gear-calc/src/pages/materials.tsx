import { useState } from "react";
import { MATERIALS, type Material } from "@/lib/materials";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<Material["type"], string> = {
  steel: "Steel",
  "cast-iron": "Cast Iron",
  "non-ferrous": "Non-Ferrous",
};

const MACH_COLOR: Record<Material["machinability"], string> = {
  Excellent: "text-green-400 border-green-700/40 bg-green-950/20",
  Good: "text-cyan-400 border-cyan-700/40 bg-cyan-950/20",
  Fair: "text-amber-400 border-amber-700/40 bg-amber-950/20",
  Poor: "text-red-400 border-red-700/40 bg-red-950/20",
};

export default function MaterialsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | Material["type"]>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MATERIALS.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.enDesignation.toLowerCase().includes(q) ||
      m.aisiDesignation.toLowerCase().includes(q) ||
      m.gearApplications.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Material Database</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Engineering materials for gear manufacture — mechanical properties, heat treatment, machinability
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="input-material-search"
            placeholder="Search materials..."
            className="pl-8 h-8 text-sm w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "steel", "cast-iron", "non-ferrous"] as const).map((t) => (
            <button
              key={t}
              data-testid={`filter-${t}`}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2.5 py-1 rounded text-xs border transition-colors",
                typeFilter === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              )}
            >
              {t === "all" ? "All" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {MATERIALS.length} materials
        </span>
      </div>

      {/* Material Cards */}
      <div className="space-y-2">
        {filtered.map((mat) => (
          <div
            key={mat.id}
            data-testid={`material-card-${mat.id}`}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            {/* Header Row */}
            <button
              className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors"
              onClick={() => setExpanded(expanded === mat.id ? null : mat.id)}
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-[200px_120px_1fr_100px] gap-2 items-center">
                <div>
                  <span className="font-semibold text-sm text-foreground">{mat.name}</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground font-mono">
                    {TYPE_LABELS[mat.type]}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{mat.enDesignation}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">{mat.aisiDesignation}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium w-fit", MACH_COLOR[mat.machinability])}>
                  {mat.machinability}
                </span>
              </div>
              <span className="text-muted-foreground text-sm shrink-0">{expanded === mat.id ? "▲" : "▼"}</span>
            </button>

            {/* Expanded Detail */}
            {expanded === mat.id && (
              <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-4">
                {/* Properties Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "UTS", value: mat.uts },
                    { label: "Yield Strength", value: mat.ys },
                    { label: "Hardness", value: mat.hardness },
                    { label: "Elastic Modulus", value: mat.elasticity },
                    { label: "Poisson's Ratio", value: mat.poisson },
                    { label: "Density", value: mat.density },
                    { label: "EN Designation", value: mat.enDesignation },
                    { label: "AISI / ASTM", value: mat.aisiDesignation },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/20 rounded p-2 border border-border/40">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                      <p className="text-xs font-mono text-foreground">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Heat Treatment */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Heat Treatment Options</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {mat.heatTreatment.map((ht) => (
                      <span key={ht} className="text-xs px-2 py-0.5 rounded border border-border bg-muted/20 text-foreground/70">
                        {ht}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Applications */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Gear Applications</h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">{mat.gearApplications}</p>
                </div>

                {/* Notes */}
                <div className="border-l-2 border-primary/30 pl-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{mat.notes}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
