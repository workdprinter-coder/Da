import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STANDARD_MODULES, INVOLUTE_TABLE, LEWIS_FACTORS } from "@/lib/materials";
import { cn } from "@/lib/utils";

function Row({ label, value, unit = "", mono = true }: { label: string; value: string | number; unit?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", mono && "font-mono")}>{typeof value === "number" ? value.toFixed(6) : value} {unit}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function InputRow({ label, value, onChange, unit, step = "0.001", min }: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; step?: string; min?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground w-40 shrink-0">{label}</Label>
      <Input
        type="number" step={step} min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 text-xs font-mono flex-1"
      />
      {unit && <span className="text-xs text-muted-foreground shrink-0 w-10">{unit}</span>}
    </div>
  );
}

export default function ToolsPage() {
  // Module/DP converter
  const [modInput, setModInput] = useState("2");
  const [dpInput, setDpInput] = useState("12.7");
  const modVal = parseFloat(modInput) || 0;
  const dpVal = parseFloat(dpInput) || 0;

  // Unit converter
  const [ucValue, setUcValue] = useState("25.4");
  const [ucCat, setUcCat] = useState("length");
  const ucVal = parseFloat(ucValue) || 0;

  // Gear ratio calculator
  const [grZ1, setGrZ1] = useState("20");
  const [grZ2, setGrZ2] = useState("60");
  const [grN1, setGrN1] = useState("1000");
  const grZ1v = parseInt(grZ1, 10) || 0;
  const grZ2v = parseInt(grZ2, 10) || 0;
  const grN1v = parseFloat(grN1) || 0;
  const grRatio = grZ1v > 0 && grZ2v > 0 ? grZ2v / grZ1v : 0;
  const grN2 = grRatio > 0 ? grN1v / grRatio : 0;

  // Centre distance calc
  const [cdMod, setCdMod] = useState("2");
  const [cdZ1, setCdZ1] = useState("20");
  const [cdZ2, setCdZ2] = useState("40");
  const cdM = parseFloat(cdMod) || 0;
  const cdZ1v = parseInt(cdZ1, 10) || 0;
  const cdZ2v = parseInt(cdZ2, 10) || 0;
  const cdC = cdM > 0 ? cdM * (cdZ1v + cdZ2v) / 2 : 0;

  // Lead calculator
  const [leadMod, setLeadMod] = useState("3");
  const [leadStarts, setLeadStarts] = useState("2");
  const [leadPD, setLeadPD] = useState("60");
  const leadModV = parseFloat(leadMod) || 0;
  const leadStartsV = parseInt(leadStarts, 10) || 1;
  const leadPDV = parseFloat(leadPD) || 1;
  const leadAxialP = Math.PI * leadModV;
  const leadVal = leadStartsV * leadAxialP;
  const leadAngleRad = Math.atan(leadVal / (Math.PI * leadPDV));
  const leadAngleDeg = (leadAngleRad * 180) / Math.PI;
  const helixAngleDeg = 90 - leadAngleDeg;

  // Involute calculator
  const [invAngle, setInvAngle] = useState("20");
  const invA = parseFloat(invAngle) || 20;
  const invRad = (invA * Math.PI) / 180;
  const invVal = Math.tan(invRad) - invRad;

  // Cutter selection
  const [cutterMod, setCutterMod] = useState("2");
  const [cutterTeeth, setCutterTeeth] = useState("25");
  const getCutter = (t: number): string => {
    if (t >= 135) return "#1 (135 teeth to rack)";
    if (t >= 55) return "#2 (55–134 teeth)";
    if (t >= 35) return "#3 (35–54 teeth)";
    if (t >= 26) return "#4 (26–34 teeth)";
    if (t >= 21) return "#5 (21–25 teeth)";
    if (t >= 17) return "#6 (17–20 teeth)";
    if (t >= 14) return "#7 (14–16 teeth)";
    return "#8 (12–13 teeth)";
  };
  const cutterTeethV = parseInt(cutterTeeth, 10) || 0;
  const cutterRec = cutterTeethV > 0 ? getCutter(cutterTeethV) : "—";

  // Dividing head
  const [dhTeeth, setDhTeeth] = useState("37");
  const dhZ = parseInt(dhTeeth, 10) || 1;
  const dhRatio = 40 / dhZ;
  const dhWhole = Math.floor(dhRatio);
  const dhFrac = dhRatio - dhWhole;
  const standardHoles = [15,16,17,18,19,20,21,23,27,29,31,33,37,39,41,43,47,49];
  const dhCircle = useMemo(() => {
    for (const c of standardHoles) {
      const holes = Math.round(dhFrac * c);
      if (Math.abs(holes / c - dhFrac) < 0.001) return { circle: c, holes };
    }
    return null;
  }, [dhFrac]);

  // Unit conversions
  const UC = {
    length: [
      { label: "millimetres", factor: 1 },
      { label: "inches", factor: 25.4 },
      { label: "metres", factor: 1000 },
      { label: "feet", factor: 304.8 },
      { label: "centimetres", factor: 10 },
    ],
    torque: [
      { label: "N·m", factor: 1 },
      { label: "lb·ft", factor: 1.35582 },
      { label: "lb·in", factor: 0.11299 },
      { label: "kgf·m", factor: 9.80665 },
    ],
    power: [
      { label: "kW", factor: 1 },
      { label: "HP (mechanical)", factor: 0.7457 },
      { label: "HP (metric)", factor: 0.7355 },
    ],
    force: [
      { label: "N", factor: 1 },
      { label: "kN", factor: 1000 },
      { label: "lbf", factor: 4.44822 },
      { label: "kgf", factor: 9.80665 },
    ],
    pressure: [
      { label: "MPa", factor: 1 },
      { label: "N/mm²", factor: 1 },
      { label: "psi", factor: 0.006895 },
      { label: "ksi", factor: 6.895 },
      { label: "bar", factor: 0.1 },
      { label: "kgf/cm²", factor: 0.09807 },
    ],
  };

  const ucUnits = UC[ucCat as keyof typeof UC] ?? UC.length;
  // Assume input is in the first unit of the category (base unit)
  const ucBase = ucVal * (ucUnits[0]?.factor ?? 1);
  const ucResults = ucUnits.map((u) => ({ label: u.label, value: ucBase / u.factor }));

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Engineering Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Standalone gear design calculators and reference tables
        </p>
      </div>

      <Tabs defaultValue="module-dp">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/30 p-1">
          {[
            { value: "module-dp", label: "Module / DP" },
            { value: "unit-conv", label: "Unit Converter" },
            { value: "gear-ratio", label: "Gear Ratio" },
            { value: "centre-dist", label: "Centre Distance" },
            { value: "lead", label: "Lead & Helix" },
            { value: "involute", label: "Involute Table" },
            { value: "cutter", label: "Cutter Selection" },
            { value: "dividing", label: "Dividing Head" },
            { value: "lewis", label: "Lewis Factors" },
            { value: "pitch", label: "Pitch Relations" },
          ].map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="text-xs px-2.5 py-1 h-7">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Module / DP */}
        <TabsContent value="module-dp" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <SectionCard title="Module to DP Converter">
              <InputRow label="Module (m)" value={modInput} onChange={(v) => { setModInput(v); setDpInput((25.4 / (parseFloat(v) || 1)).toFixed(4)); }} unit="mm" />
              <Row label="Diametral Pitch (DP)" value={(25.4 / (modVal || 1)).toFixed(6)} unit="teeth/in" />
              <Row label="Circular Pitch" value={(Math.PI * modVal).toFixed(6)} unit="mm" />
              <p className="text-[10px] text-muted-foreground font-mono border-t border-border/30 pt-2">Formula: DP = 25.4 / m</p>
            </SectionCard>

            <SectionCard title="DP to Module Converter">
              <InputRow label="Diametral Pitch (DP)" value={dpInput} onChange={(v) => { setDpInput(v); setModInput((25.4 / (parseFloat(v) || 1)).toFixed(4)); }} unit="teeth/in" />
              <Row label="Module (m)" value={(25.4 / (dpVal || 1)).toFixed(6)} unit="mm" />
              <Row label="Circular Pitch" value={(Math.PI / (dpVal || 1)).toFixed(6)} unit="in" />
              <p className="text-[10px] text-muted-foreground font-mono border-t border-border/30 pt-2">Formula: m = 25.4 / DP</p>
            </SectionCard>
          </div>

          <SectionCard title="Standard Module / DP Lookup Table">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1 font-medium">Module (mm)</th>
                    <th className="text-left py-1 font-medium">DP (teeth/in)</th>
                    <th className="text-left py-1 font-medium">Circular Pitch (mm)</th>
                    <th className="text-left py-1 font-medium">Addendum (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {STANDARD_MODULES.map(({ module: m, dp }) => (
                    <tr key={m} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="py-1 font-mono text-foreground">{m}</td>
                      <td className="py-1 font-mono text-foreground">{dp.toFixed(4)}</td>
                      <td className="py-1 font-mono text-muted-foreground">{(Math.PI * m).toFixed(4)}</td>
                      <td className="py-1 font-mono text-muted-foreground">{m.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Unit Converter */}
        <TabsContent value="unit-conv" className="space-y-4 mt-4">
          <SectionCard title="Unit Converter">
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={ucCat} onValueChange={setUcCat}>
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="length">Length</SelectItem>
                  <SelectItem value="torque">Torque</SelectItem>
                  <SelectItem value="power">Power</SelectItem>
                  <SelectItem value="force">Force</SelectItem>
                  <SelectItem value="pressure">Pressure / Stress</SelectItem>
                </SelectContent>
              </Select>
              <InputRow
                label={`Value (${ucUnits[0]?.label})`}
                value={ucValue}
                onChange={setUcValue}
                unit={ucUnits[0]?.label}
              />
            </div>
            <div className="space-y-1 mt-2">
              {ucResults.map((r, i) => (
                <div key={i} className="flex justify-between text-xs py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-mono text-foreground">{r.value.toFixed(6)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* Gear Ratio */}
        <TabsContent value="gear-ratio" className="space-y-4 mt-4">
          <SectionCard title="Gear Ratio Calculator">
            <div className="space-y-2">
              <InputRow label="Pinion Teeth (z1)" value={grZ1} onChange={setGrZ1} step="1" />
              <InputRow label="Gear Teeth (z2)" value={grZ2} onChange={setGrZ2} step="1" />
              <InputRow label="Input Speed (n1, RPM)" value={grN1} onChange={setGrN1} unit="RPM" />
            </div>
            <div className="border-t border-border/30 pt-3 space-y-1">
              <Row label="Gear Ratio (i = z2/z1)" value={grRatio.toFixed(6)} />
              <Row label="Output Speed (n2 = n1/i)" value={grN2.toFixed(3)} unit="RPM" />
              <Row label="Reduction" value={`${grZ1}:${grZ2}`} mono={false} />
              <p className="text-[10px] font-mono text-muted-foreground pt-1">n2 = n1 × z1/z2 = n1/i</p>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Centre Distance */}
        <TabsContent value="centre-dist" className="space-y-4 mt-4">
          <SectionCard title="Centre Distance Calculator">
            <div className="space-y-2">
              <InputRow label="Module (m)" value={cdMod} onChange={setCdMod} />
              <InputRow label="Pinion Teeth (z1)" value={cdZ1} onChange={setCdZ1} step="1" />
              <InputRow label="Gear Teeth (z2)" value={cdZ2} onChange={setCdZ2} step="1" />
            </div>
            <div className="border-t border-border/30 pt-3 space-y-1">
              <Row label="Centre Distance (C)" value={cdC.toFixed(6)} unit="mm" />
              <Row label="Pitch Diameter Pinion" value={(cdM * cdZ1v).toFixed(6)} unit="mm" />
              <Row label="Pitch Diameter Gear" value={(cdM * cdZ2v).toFixed(6)} unit="mm" />
              <p className="text-[10px] font-mono text-muted-foreground pt-1">C = m(z1+z2)/2</p>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Lead & Helix */}
        <TabsContent value="lead" className="space-y-4 mt-4">
          <SectionCard title="Lead & Helix Angle Calculator">
            <div className="space-y-2">
              <InputRow label="Module (m)" value={leadMod} onChange={setLeadMod} />
              <InputRow label="Number of Starts" value={leadStarts} onChange={setLeadStarts} step="1" />
              <InputRow label="Pitch Diameter (mm)" value={leadPD} onChange={setLeadPD} unit="mm" />
            </div>
            <div className="border-t border-border/30 pt-3 space-y-1">
              <Row label="Axial Pitch (px = πm)" value={leadAxialP.toFixed(6)} unit="mm" />
              <Row label="Lead (L = z1 × px)" value={leadVal.toFixed(6)} unit="mm" />
              <Row label="Lead Angle (γ)" value={leadAngleDeg.toFixed(6)} unit="°" />
              <Row label="Helix Angle (β = 90° - γ)" value={helixAngleDeg.toFixed(6)} unit="°" />
              <p className="text-[10px] font-mono text-muted-foreground pt-1">γ = arctan(L / (π×d))</p>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Involute Table */}
        <TabsContent value="involute" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <SectionCard title="Involute Function Calculator">
              <InputRow label="Pressure Angle φ (°)" value={invAngle} onChange={setInvAngle} step="0.1" unit="°" />
              <div className="border-t border-border/30 pt-3 space-y-1">
                <Row label="inv(φ) = tan(φ) - φ(rad)" value={invVal.toFixed(8)} />
                <Row label="φ in radians" value={invRad.toFixed(8)} unit="rad" />
                <Row label="tan(φ)" value={Math.tan(invRad).toFixed(8)} />
                <p className="text-[10px] font-mono text-muted-foreground pt-1">inv(φ) = tan(φ) - φ</p>
              </div>
            </SectionCard>

            <SectionCard title="Involute Reference Table">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1 font-medium">φ (°)</th>
                    <th className="text-left py-1 font-medium">inv(φ)</th>
                  </tr>
                </thead>
                <tbody>
                  {INVOLUTE_TABLE.map(({ angle, inv }) => (
                    <tr key={angle} className={cn("border-b border-border/20 hover:bg-muted/10", angle === 20 && "bg-primary/5")}>
                      <td className="py-1 font-mono text-foreground">{angle}°</td>
                      <td className="py-1 font-mono text-muted-foreground">{inv.toFixed(8)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Cutter Selection */}
        <TabsContent value="cutter" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <SectionCard title="Gear Cutter Selection">
              <InputRow label="Module (m)" value={cutterMod} onChange={setCutterMod} />
              <InputRow label="Number of Teeth (or virtual zv)" value={cutterTeeth} onChange={setCutterTeeth} step="1" />
              <div className="border-t border-border/30 pt-3 space-y-1">
                <div className="text-xs py-1">
                  <span className="text-muted-foreground">Recommended Cutter: </span>
                  <span className="font-mono text-primary font-semibold">{cutterRec}</span>
                </div>
                <div className="text-xs py-1">
                  <span className="text-muted-foreground">Module: </span>
                  <span className="font-mono text-foreground">{cutterMod} mm</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Standard Cutter Set (Module, 8 Cutters)">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1">Cutter #</th>
                    <th className="text-left py-1">Tooth Range</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["#1", "135 teeth to rack"],
                    ["#2", "55 – 134 teeth"],
                    ["#3", "35 – 54 teeth"],
                    ["#4", "26 – 34 teeth"],
                    ["#5", "21 – 25 teeth"],
                    ["#6", "17 – 20 teeth"],
                    ["#7", "14 – 16 teeth"],
                    ["#8", "12 – 13 teeth"],
                  ].map(([num, range]) => (
                    <tr key={num} className={cn(
                      "border-b border-border/20",
                      cutterRec.startsWith(num) && "bg-primary/10 text-primary"
                    )}>
                      <td className="py-1 font-mono font-semibold">{num}</td>
                      <td className="py-1 text-muted-foreground">{range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground">Note: Cutters are designed for the mid-range of each group. For precision work, use a specific cutter for the exact tooth count.</p>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Dividing Head */}
        <TabsContent value="dividing" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <SectionCard title="Dividing Head Calculator">
              <InputRow label="Required Divisions (teeth)" value={dhTeeth} onChange={setDhTeeth} step="1" />
              <div className="border-t border-border/30 pt-3 space-y-1">
                <Row label="Index ratio (40/N)" value={dhRatio.toFixed(6)} />
                <Row label="Whole turns" value={dhWhole} />
                {dhFrac > 0.001 && dhCircle ? (
                  <>
                    <Row label="Hole circle" value={dhCircle.circle} />
                    <Row label="Holes per index" value={dhCircle.holes} />
                    <div className="text-xs py-1.5 bg-primary/5 rounded border border-primary/20 px-2 mt-2">
                      <span className="text-foreground/80 font-mono">
                        Setting: {dhWhole} full turn{dhWhole !== 1 ? "s" : ""} + {dhCircle.holes} holes on {dhCircle.circle}-hole circle
                      </span>
                    </div>
                  </>
                ) : dhFrac < 0.001 ? (
                  <div className="text-xs py-1.5 bg-primary/5 rounded border border-primary/20 px-2 mt-2">
                    <span className="text-foreground/80">Simple: {dhWhole} full turns exactly</span>
                  </div>
                ) : (
                  <div className="text-xs py-1.5 bg-amber-950/20 rounded border border-amber-700/30 px-2 mt-2 text-amber-400">
                    Compound indexing required for {dhZ} divisions
                  </div>
                )}
                <p className="text-[10px] font-mono text-muted-foreground pt-1">
                  Standard 40:1 dividing head. Index = 40/N turns.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Standard Brown & Sharpe Hole Circles">
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground/70">Plate 1:</p>
                <p className="font-mono">15, 16, 17, 18, 19, 20</p>
                <p className="font-medium text-foreground/70 pt-1">Plate 2:</p>
                <p className="font-mono">21, 23, 27, 29, 31, 33</p>
                <p className="font-medium text-foreground/70 pt-1">Plate 3:</p>
                <p className="font-mono">37, 39, 41, 43, 47, 49</p>
              </div>
              <p className="text-[10px] text-muted-foreground pt-2">
                For Cincinnati dividing heads: 24, 25, 28, 30, 34, 37, 38, 39, 41, 42, 43
              </p>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Lewis Factors */}
        <TabsContent value="lewis" className="space-y-4 mt-4">
          <SectionCard title="Lewis Form Factor (Y)">
            <p className="text-xs text-muted-foreground mb-3">
              Used in the Lewis bending stress formula: σ = Wt / (F × m × Y), where Wt = tangential load, F = face width, m = module
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1.5 font-medium">Number of Teeth</th>
                    <th className="text-left py-1.5 font-medium">Y (20° PA)</th>
                    <th className="text-left py-1.5 font-medium">Y (14.5° PA)</th>
                  </tr>
                </thead>
                <tbody>
                  {LEWIS_FACTORS.map(({ teeth, y_20deg, y_14_5deg }) => (
                    <tr key={teeth} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="py-1.5 font-mono text-foreground">{teeth}</td>
                      <td className="py-1.5 font-mono text-muted-foreground">{y_20deg.toFixed(3)}</td>
                      <td className="py-1.5 font-mono text-muted-foreground">{y_14_5deg.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Pitch Relations */}
        <TabsContent value="pitch" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <SectionCard title="Pitch Relationships (Metric)">
              <div className="space-y-2">
                <InputRow label="Module (m)" value={cdMod} onChange={setCdMod} />
                <InputRow label="Pressure Angle φ (°)" value={invAngle} onChange={setInvAngle} step="0.5" unit="°" />
                <InputRow label="Helix Angle β (°)" value={leadStarts === "2" ? "20" : leadStarts} onChange={() => {}} step="0.5" unit="°" />
              </div>
              <div className="border-t border-border/30 pt-3 space-y-1">
                {[
                  ["Circular Pitch p = πm", (Math.PI * cdM).toFixed(6), "mm"],
                  ["Base Pitch pb = p·cos(φ)", (Math.PI * cdM * Math.cos(invRad)).toFixed(6), "mm"],
                  ["Normal Pitch pn = p·cos(β)", (Math.PI * cdM * Math.cos(leadAngleDeg * Math.PI / 180)).toFixed(6), "mm"],
                ].map(([label, value, unit]) => (
                  <Row key={String(label)} label={String(label)} value={String(value)} unit={String(unit)} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Pitch Formula Reference">
              <div className="space-y-2 text-xs">
                {[
                  ["Circular Pitch", "p = π × m"],
                  ["Diametral Pitch (DP)", "DP = π / p = z / d"],
                  ["Normal Pitch", "pn = p × cos(β)"],
                  ["Base Pitch", "pb = p × cos(φ)"],
                  ["Axial Pitch", "pa = p / tan(β)"],
                  ["Module (metric)", "m = d / z"],
                  ["Module from DP", "m = 25.4 / DP"],
                ].map(([name, formula]) => (
                  <div key={String(name)} className="flex justify-between border-b border-border/20 pb-1.5 last:border-0">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-mono text-cyan-400/80">{formula}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
