import { z } from "zod";

export const spurGearInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  inputMode: z.enum(["module", "dp"]),
  moduleValue: z.number().min(0.1),
  z1: z.number().int().min(6),
  z2: z.number().int().min(6),
  pressureAngle: z.number().min(10).max(30),
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
  const { unitSystem, inputMode, moduleValue, z1, z2, pressureAngle } = input;
  
  // Internal calcs always use metric module
  const m = inputMode === "dp" ? 25.4 / moduleValue : moduleValue;
  const phi = (pressureAngle * Math.PI) / 180;
  
  const i = z2 / z1;
  const d1 = m * z1;
  const d2 = m * z2;
  const da1 = d1 + 2 * m;
  const da2 = d2 + 2 * m;
  const df1 = d1 - 2.5 * m;
  const df2 = d2 - 2.5 * m;
  const db1 = d1 * Math.cos(phi);
  const db2 = d2 * Math.cos(phi);
  
  const p = Math.PI * m;
  const t = (Math.PI * m) / 2;
  const a = 1.0 * m;
  const b = 1.25 * m;
  const h = 2.25 * m;
  const hw = 2.0 * m;
  const C = (m * (z1 + z2)) / 2;
  
  const ra1 = da1 / 2;
  const rb1 = db1 / 2;
  const ra2 = da2 / 2;
  const rb2 = db2 / 2;
  
  const eps_alpha =
    (Math.sqrt(ra1 * ra1 - rb1 * rb1) + Math.sqrt(ra2 * ra2 - rb2 * rb2) - C * Math.sin(phi)) /
    (Math.PI * m * Math.cos(phi));
    
  const k1 = Math.max(2, Math.round(z1 * (pressureAngle/180) + 0.5));
  const inv_phi = Math.tan(phi) - phi;
  const W1 = m * Math.cos(phi) * (Math.PI * (k1 - 0.5) + z1 * inv_phi);
  
  const isImperial = unitSystem === "imperial";
  const unit = isImperial ? "in" : "mm";
  const convert = (val: number) => (isImperial ? val / 25.4 : val);
  
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
      substitution: `${moduleValue.toFixed(4)} × ${z1}`,
      value: convert(d1),
      unit,
    },
    {
      label: "Pitch Diameter Gear",
      symbol: "d2",
      formula: inputMode === "dp" ? "z2 / DP × 25.4" : "m × z2",
      variables: "m = module, z2 = Gear teeth",
      substitution: `${moduleValue.toFixed(4)} × ${z2}`,
      value: convert(d2),
      unit,
    },
    {
      label: "Outside Diameter Pinion",
      symbol: "da1",
      formula: "d1 + 2m",
      variables: "d1 = Pitch diameter, m = module",
      substitution: `${convert(d1).toFixed(4)} + 2 × ${convert(m).toFixed(4)}`,
      value: convert(da1),
      unit,
    },
    {
      label: "Outside Diameter Gear",
      symbol: "da2",
      formula: "d2 + 2m",
      variables: "d2 = Pitch diameter, m = module",
      substitution: `${convert(d2).toFixed(4)} + 2 × ${convert(m).toFixed(4)}`,
      value: convert(da2),
      unit,
    },
    {
      label: "Root Diameter Pinion",
      symbol: "df1",
      formula: "d1 - 2.5m",
      variables: "d1 = Pitch diameter, m = module",
      substitution: `${convert(d1).toFixed(4)} - 2.5 × ${convert(m).toFixed(4)}`,
      value: convert(df1),
      unit,
    },
    {
      label: "Base Diameter Pinion",
      symbol: "db1",
      formula: "d1 × cos(φ)",
      variables: "d1 = Pitch diameter, φ = pressure angle",
      substitution: `${convert(d1).toFixed(4)} × cos(${pressureAngle}°)`,
      value: convert(db1),
      unit,
    },
    {
      label: "Circular Pitch",
      symbol: "p",
      formula: "π × m",
      variables: "m = module",
      substitution: `π × ${convert(m).toFixed(4)}`,
      value: convert(p),
      unit,
    },
    {
      label: "Centre Distance",
      symbol: "C",
      formula: "m(z1+z2)/2",
      variables: "m = module, z1 = pinion, z2 = gear",
      substitution: `${convert(m).toFixed(4)}(${z1}+${z2})/2`,
      value: convert(C),
      unit,
    },
    {
      label: "Contact Ratio",
      symbol: "εα",
      formula: "[√(ra1²-rb1²) + √(ra2²-rb2²) - C×sin(φ)] / (π×m×cos(φ))",
      variables: "ra = tip radius, rb = base radius, C = centre dist, φ = pressure angle",
      substitution: "[...] / [...]",
      value: eps_alpha,
      unit: "",
      error: eps_alpha < 1.1,
      warning: eps_alpha < 1.2 && eps_alpha >= 1.1,
      amber: eps_alpha >= 1.2 && eps_alpha <= 1.5,
      green: eps_alpha > 1.5,
      note: eps_alpha < 1.1 ? "Redesign required" : "Acceptable",
    },
    {
      label: "Span Measurement Pinion",
      symbol: "W1",
      formula: "m × cos(φ) × [π(k-0.5) + z × inv(φ)]",
      variables: `k = ${k1} teeth`,
      substitution: `[...]`,
      value: convert(W1),
      unit,
    }
  ];
}
