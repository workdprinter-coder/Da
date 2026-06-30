import { useCalculator } from "@/context/calculator-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { DecimalPlaces, DefaultPressureAngle, UnitSystem } from "@/context/calculator-context";

function SettingRow({
  label, description, children,
}: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4 bg-card">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  step = "0.001",
  min = "0.1",
  max = "5",
}: {
  value: number;
  onChange: (v: number) => void;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <Input
      type="number"
      step={step}
      min={min}
      max={max}
      className="w-28 h-8 text-sm font-mono"
      value={value}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
    />
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, clearCalcs } = useCalculator();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Calculation preferences, default factors, and display options</p>
      </div>

      {/* Display */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Display Preferences
        </h2>

        <SettingRow label="Dark Mode" description="Industrial dark theme (default)">
          <Switch checked={settings.darkMode} onCheckedChange={(v) => updateSettings({ darkMode: v })} />
        </SettingRow>

        <SettingRow label="Unit System" description="Default unit system for new calculations">
          <Select value={settings.unitSystem} onValueChange={(v) => updateSettings({ unitSystem: v as UnitSystem })}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric (mm)</SelectItem>
              <SelectItem value="imperial">Imperial (inch)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Decimal Places" description="Precision of displayed results">
          <Select value={String(settings.decimalPlaces)} onValueChange={(v) => updateSettings({ decimalPlaces: parseInt(v, 10) as DecimalPlaces })}>
            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 places</SelectItem>
              <SelectItem value="3">3 places</SelectItem>
              <SelectItem value="4">4 places (default)</SelectItem>
              <SelectItem value="5">5 places</SelectItem>
              <SelectItem value="6">6 places</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Default Pressure Angle" description="Pre-filled in new calculations">
          <Select value={String(settings.defaultPressureAngle)} onValueChange={(v) => updateSettings({ defaultPressureAngle: parseFloat(v) as DefaultPressureAngle })}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="14.5">14.5° (Full depth)</SelectItem>
              <SelectItem value="20">20° (Standard)</SelectItem>
              <SelectItem value="25">25° (Stub tooth)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </section>

      {/* Default Tooth Proportion Factors */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Default Tooth Proportion Factors
        </h2>
        <p className="text-xs text-muted-foreground">
          These values are used as defaults in all new gear calculations. Each calculator also allows per-calculation overrides.
        </p>

        <SettingRow
          label="Default Addendum Factor (ha)"
          description={`Addendum = ha × module. Current: ${settings.defaultAddendumFactor}`}
        >
          <NumberInput
            value={settings.defaultAddendumFactor}
            onChange={(v) => updateSettings({ defaultAddendumFactor: v })}
          />
        </SettingRow>

        <SettingRow
          label="Default Dedendum Factor (hf)"
          description={`Dedendum = hf × module. Current: ${settings.defaultDedendumFactor}`}
        >
          <NumberInput
            value={settings.defaultDedendumFactor}
            onChange={(v) => updateSettings({ defaultDedendumFactor: v })}
          />
        </SettingRow>

        <div className="border border-border/40 rounded p-3 bg-muted/10 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground/60">Standard Full-Depth Involute Reference (for information only):</p>
          <p>Standard Addendum Factor = 1.000 | Standard Dedendum Factor = 1.250</p>
          <p className="text-muted-foreground/60">Ref: Machinery's Handbook, AGMA, ISO, DIN. Calculator uses user-entered values above.</p>
        </div>
      </section>

      {/* Gear-Specific Default Factors */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Gear-Specific Default Factors
        </h2>

        <SettingRow
          label="Straight Bevel Factor"
          description={`Whole depth = factor × module. ha=1.000, hf=factor−1.000. Current: ${settings.straightBevelFactor}`}
        >
          <NumberInput
            value={settings.straightBevelFactor}
            onChange={(v) => updateSettings({ straightBevelFactor: v })}
            min="1.5"
            max="3"
          />
        </SettingRow>

        <SettingRow
          label="Spiral Bevel Factor"
          description={`Whole depth = factor × module (Gleason: 1.88). ha=0.880, hf=factor−0.880. Current: ${settings.spiralBevelFactor}`}
        >
          <NumberInput
            value={settings.spiralBevelFactor}
            onChange={(v) => updateSettings({ spiralBevelFactor: v })}
            min="1.5"
            max="3"
          />
        </SettingRow>

        <div className="border border-border/40 rounded p-3 bg-muted/10 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground/60">Gear-Specific Factor Defaults:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono">
            <span>Straight Bevel</span><span>2.157 × m (ha=1.000, hf=1.157)</span>
            <span>Spiral Bevel</span><span>1.880 × m (ha=0.880, hf=1.000)</span>
          </div>
          <p className="text-muted-foreground/60">Ref: Machinery's Handbook 29th Ed., AGMA 2003, ISO 23509, Gleason Works.</p>
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Data Management
        </h2>
        <SettingRow label="Saved Calculations" description="Calculations stored for report generation">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={clearCalcs}
          >
            <Trash2 size={12} />
            Clear All
          </Button>
        </SettingRow>
      </section>

      {/* References */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Engineering References
        </h2>
        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            All calculations implement original engineering mathematics consistent with established mechanical
            engineering standards. No copyrighted text, tables, or worked examples are reproduced.
          </p>
          <div className="space-y-1.5">
            {[
              ["Machinery's Handbook 29th Ed.", "Gear dimensions, tooth forms, tolerances, bevel gear geometry"],
              ["ISO 6336", "Load capacity of spur and helical gears"],
              ["ISO 23509", "Bevel and hypoid gear geometry"],
              ["AGMA 2001", "Spur and helical gear rating methods"],
              ["AGMA 2003", "Bevel gear rating and geometry"],
              ["DIN 3960", "Involute cylindrical gears — definitions and parameters"],
              ["DIN 3975", "Worm gear drive — terms and definitions"],
              ["DIN 3971", "Bevel gear definitions and parameters"],
            ].map(([title, desc]) => (
              <div key={title} className="border border-border/40 rounded p-2">
                <p className="text-xs font-semibold text-foreground/80">{title}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border border-amber-700/30 rounded-lg p-4 bg-amber-950/10">
        <p className="text-xs text-amber-300/80 leading-relaxed">
          <strong>Engineering Disclaimer:</strong> This software provides calculations for reference purposes.
          All critical dimensions must be verified by a qualified mechanical engineer before manufacture.
          The user accepts full responsibility for any application of these calculations.
        </p>
      </div>
    </div>
  );
}
