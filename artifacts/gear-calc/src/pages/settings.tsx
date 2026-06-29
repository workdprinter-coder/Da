import { useCalculator } from "@/context/calculator-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { DecimalPlaces, DefaultPressureAngle, UnitSystem } from "@/context/calculator-context";

export default function SettingsPage() {
  const { settings, updateSettings, clearCalcs } = useCalculator();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Calculation preferences and display options</p>
      </div>

      {/* Display */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Display Preferences
        </h2>

        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4 bg-card">
          <div>
            <Label className="text-sm font-medium">Dark Mode</Label>
            <p className="text-xs text-muted-foreground">Industrial dark theme (default)</p>
          </div>
          <Switch
            data-testid="switch-dark-mode"
            checked={settings.darkMode}
            onCheckedChange={(v) => updateSettings({ darkMode: v })}
          />
        </div>

        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4 bg-card">
          <div>
            <Label className="text-sm font-medium">Unit System</Label>
            <p className="text-xs text-muted-foreground">Default unit system for new calculations</p>
          </div>
          <Select
            value={settings.unitSystem}
            onValueChange={(v) => updateSettings({ unitSystem: v as UnitSystem })}
          >
            <SelectTrigger className="w-40 h-8 text-sm" data-testid="select-unit-system">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric (mm)</SelectItem>
              <SelectItem value="imperial">Imperial (inch)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4 bg-card">
          <div>
            <Label className="text-sm font-medium">Decimal Places</Label>
            <p className="text-xs text-muted-foreground">Precision of displayed results</p>
          </div>
          <Select
            value={String(settings.decimalPlaces)}
            onValueChange={(v) => updateSettings({ decimalPlaces: parseInt(v, 10) as DecimalPlaces })}
          >
            <SelectTrigger className="w-32 h-8 text-sm" data-testid="select-decimal-places">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 places</SelectItem>
              <SelectItem value="3">3 places</SelectItem>
              <SelectItem value="4">4 places (default)</SelectItem>
              <SelectItem value="5">5 places</SelectItem>
              <SelectItem value="6">6 places</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4 bg-card">
          <div>
            <Label className="text-sm font-medium">Default Pressure Angle</Label>
            <p className="text-xs text-muted-foreground">Pre-filled in new calculations</p>
          </div>
          <Select
            value={String(settings.defaultPressureAngle)}
            onValueChange={(v) => updateSettings({ defaultPressureAngle: parseFloat(v) as DefaultPressureAngle })}
          >
            <SelectTrigger className="w-40 h-8 text-sm" data-testid="select-default-pa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="14.5">14.5° (Full depth)</SelectItem>
              <SelectItem value="20">20° (Standard)</SelectItem>
              <SelectItem value="25">25° (Stub tooth)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Data */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Data Management
        </h2>
        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4 bg-card">
          <div>
            <Label className="text-sm font-medium">Saved Calculations</Label>
            <p className="text-xs text-muted-foreground">Calculations stored for report generation</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={clearCalcs}
            data-testid="btn-clear-calcs"
          >
            <Trash2 size={12} />
            Clear All
          </Button>
        </div>
      </section>

      {/* About */}
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
              ["Machinery's Handbook", "29th Edition — Gear dimensions, tooth forms, tolerances"],
              ["ISO 6336", "Calculation of load capacity of spur and helical gears"],
              ["AGMA 2001", "Fundamental rating factors and calculation methods for spur and helical gears"],
              ["DIN 3960", "Definitions, parameters and equations for involute cylindrical gears and gear pairs"],
              ["DIN 3975", "Terms and definitions for worm gear drives"],
              ["ISO 23509", "Bevel and hypoid gear geometry"],
            ].map(([title, desc]) => (
              <div key={title} className="border border-border/40 rounded p-2">
                <p className="text-xs font-semibold text-foreground/80">{title}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
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
