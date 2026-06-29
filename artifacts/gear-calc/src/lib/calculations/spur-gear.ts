import { z } from "zod";

export const spurGearInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  inputMode: z.enum(["module", "dp"]),
  moduleValue: z.number().min(0.1),
  z1: z.number().int().min(6),
  z2: z.number().int().min(6),
  pressureAngle: z.number().min(10).max(30),
  addendumFactor: z.number().min(0.1).max(3),
  dedendumFactor: z.number().min(0.1).max(3),
});

export type SpurGearInput = z.infer<typeof spurGearInputSchema>;

export interface CalculationResult {
  label: string;
  symbol: string;
  formula: string;
  variables: string;
  substitution: string;
  value: number;
  unit: string;
  note?: string;
  warning?: boolean;
  error?: boolean;
  amber?: boolean;
  green?: boolean;
}

export function calculateSpurGear(input: SpurGearInput): CalculationResult[] {
  const { unitSystem, inputMode, moduleValue, z1, z2, pressureAngle, addendumFactor, dedendumFactor } = input;

  // Internal calcs always use metric module
  const m = inputMode === "dp" ? 25.4 / moduleValue : moduleValue;
  const phi = (pressureAngle * Math.PI) / 180;

  const i = z2 / z1;
  const d1 = m * z1;
  const d2 = m * z2;

  // Tooth proportions using user-defined factors
  const a = addendumFactor * m;          // addendum
  const b = dedendumFactor * m;          // dedendum
  const h = a + b;                       // whole depth
  const hw = 2 * a;                      // working depth
  // depth of cut = whole depth (full depth for standard gears)
  const hc = h;

  const da1 = d1 + 2 * a;
  const da2 = d2 + 2 * a;
  const df1 = d1 - 2 * b;
  const df2 = d2 - 2 * b;
  const db1 = d1 * Math.cos(phi);
  const db2 = d2 * Math.cos(phi);

  const p = Math.PI * m;
  const C = (m * (z1 + z2)) / 2;

  const ra1 = da1 / 2;
  const rb1 = db1 / 2;
  const ra2 = da2 / 2;
  const rb2 = db2 / 2;

  const eps_alpha =
    (Math.sqrt(ra1 * ra1 - rb1 * rb1) + Math.sqrt(ra2 * ra2 - rb2 * rb2) - C * Math.sin(phi)) /
    (Math.PI * m * Math.cos(phi));

  const k1 = Math.max(2, Math.round(z1 * (pressureAngle / 180) + 0.5));
  const inv_phi = Math.tan(phi) - phi;
  const W1 = m * Math.cos(phi) * (Math.PI * (k1 - 0.5) + z1 * inv_phi);
  const k2 = Math.max(2, Math.round(z2 * (pressureAngle / 180) + 0.5));
  const W2 = m * Math.cos(phi) * (Math.PI * (k2 - 0.5) + z2 * inv_phi);

  const isImperial = unitSystem === "imperial";
  const unit = isImperial ? "in" : "mm";
  const cv = (val: number) => (isImperial ? val / 25.4 : val);
  const fmt = (n: number, d = 4) => n.toFixed(d);

  return [
    {
      label: "Gear Ratio",
      symbol: "i",
      formula: "z2 / z1",
      variables: "z2 = Gear teeth, z1 = Pinion teeth",
      substitution: `${z2} / ${z1}`,
      value: i,
      unit: "",
    },
    {
      label: "Pitch Diameter Pinion",
      symbol: "d1",
      formula: inputMode === "dp" ? "z1 / DP × 25.4" : "m × z1",
      variables: "m = module, z1 = Pinion teeth",
      substitution: `${fmt(cv(m))} × ${z1}`,
      value: cv(d1),
      unit,
    },
    {
      label: "Pitch Diameter Gear",
      symbol: "d2",
      formula: inputMode === "dp" ? "z2 / DP × 25.4" : "m × z2",
      variables: "m = module, z2 = Gear teeth",
      substitution: `${fmt(cv(m))} × ${z2}`,
      value: cv(d2),
      unit,
    },
    {
      label: "Addendum",
      symbol: "a",
      formula: "ha × m",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), m = module`,
      substitution: `${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(a),
      unit,
      note: "Tooth height above pitch circle",
    },
    {
      label: "Dedendum",
      symbol: "b",
      formula: "hf × m",
      variables: `hf = Dedendum factor (${fmt(dedendumFactor)}), m = module`,
      substitution: `${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(b),
      unit,
      note: "Tooth depth below pitch circle",
    },
    {
      label: "Whole Depth",
      symbol: "h",
      formula: "(ha + hf) × m",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(m))}`,
      value: cv(h),
      unit,
      note: "Total tooth height = addendum + dedendum",
    },
    {
      label: "Working Depth",
      symbol: "hw",
      formula: "2 × ha × m",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), m = module`,
      substitution: `2 × ${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(hw),
      unit,
      note: "Depth of tooth engagement (2 × addendum for standard gears)",
    },
    {
      label: "Depth of Cut",
      symbol: "hc",
      formula: "(ha + hf) × m",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(m))}`,
      value: cv(hc),
      unit,
      note: "Tool depth setting = whole depth",
    },
    {
      label: "Outside Diameter Pinion",
      symbol: "da1",
      formula: "d1 + 2 × ha × m",
      variables: `d1 = Pitch diameter, ha = ${fmt(addendumFactor)}, m = module`,
      substitution: `${fmt(cv(d1))} + 2 × ${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(da1),
      unit,
    },
    {
      label: "Outside Diameter Gear",
      symbol: "da2",
      formula: "d2 + 2 × ha × m",
      variables: `d2 = Pitch diameter, ha = ${fmt(addendumFactor)}, m = module`,
      substitution: `${fmt(cv(d2))} + 2 × ${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(da2),
      unit,
    },
    {
      label: "Root Diameter Pinion",
      symbol: "df1",
      formula: "d1 - 2 × hf × m",
      variables: `d1 = Pitch diameter, hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `${fmt(cv(d1))} - 2 × ${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(df1),
      unit,
    },
    {
      label: "Root Diameter Gear",
      symbol: "df2",
      formula: "d2 - 2 × hf × m",
      variables: `d2 = Pitch diameter, hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `${fmt(cv(d2))} - 2 × ${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(df2),
      unit,
    },
    {
      label: "Base Diameter Pinion",
      symbol: "db1",
      formula: "d1 × cos(φ)",
      variables: "d1 = Pitch diameter, φ = pressure angle",
      substitution: `${fmt(cv(d1))} × cos(${pressureAngle}°)`,
      value: cv(db1),
      unit,
    },
    {
      label: "Base Diameter Gear",
      symbol: "db2",
      formula: "d2 × cos(φ)",
      variables: "d2 = Pitch diameter, φ = pressure angle",
      substitution: `${fmt(cv(d2))} × cos(${pressureAngle}°)`,
      value: cv(db2),
      unit,
    },
    {
      label: "Circular Pitch",
      symbol: "p",
      formula: "π × m",
      variables: "m = module",
      substitution: `π × ${fmt(cv(m))}`,
      value: cv(p),
      unit,
    },
    {
      label: "Centre Distance",
      symbol: "C",
      formula: "m(z1+z2)/2",
      variables: "m = module, z1 = pinion, z2 = gear",
      substitution: `${fmt(cv(m))}(${z1}+${z2})/2`,
      value: cv(C),
      unit,
    },
    {
      label: "Contact Ratio",
      symbol: "εα",
      formula: "[√(ra1²-rb1²) + √(ra2²-rb2²) - C·sin(φ)] / (π·m·cos(φ))",
      variables: "ra = tip radius, rb = base radius, C = centre dist, φ = pressure angle",
      substitution: "[...] / [...]",
      value: eps_alpha,
      unit: "",
      error: eps_alpha < 1.1,
      warning: eps_alpha < 1.2 && eps_alpha >= 1.1,
      amber: eps_alpha >= 1.2 && eps_alpha <= 1.5,
      green: eps_alpha > 1.5,
      note: eps_alpha < 1.1 ? "< 1.1 — Redesign required" : eps_alpha < 1.2 ? "< 1.2 — Marginal" : "Acceptable",
    },
    {
      label: "Span Measurement — Pinion",
      symbol: "W1",
      formula: "m·cos(φ)·[π(k−0.5) + z·inv(φ)]",
      variables: `k = ${k1} teeth spanned, inv(φ) = tan(φ)−φ`,
      substitution: `m·cos(${pressureAngle}°)·[π(${k1}−0.5)+${z1}·inv(${pressureAngle}°)]`,
      value: cv(W1),
      unit,
      note: `Span ${k1} teeth — used for over-pins / span inspection`,
    },
    {
      label: "Span Measurement — Gear",
      symbol: "W2",
      formula: "m·cos(φ)·[π(k−0.5) + z·inv(φ)]",
      variables: `k = ${k2} teeth spanned, inv(φ) = tan(φ)−φ`,
      substitution: `m·cos(${pressureAngle}°)·[π(${k2}−0.5)+${z2}·inv(${pressureAngle}°)]`,
      value: cv(W2),
      unit,
      note: `Span ${k2} teeth`,
    },
  ];
}
