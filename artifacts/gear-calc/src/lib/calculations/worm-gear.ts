import { z } from "zod";
import type { CalculationResult } from "./spur-gear";

export const wormGearInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  m: z.number().min(0.1),
  z1: z.number().int().min(1).max(6),
  z2: z.number().int().min(10),
  pressureAngle: z.number().min(14.5).max(30),
  q: z.number().min(6).max(25).optional(),
});

export type WormGearInput = z.infer<typeof wormGearInputSchema>;

export function calculateWormGear(input: WormGearInput): CalculationResult[] {
  const { unitSystem, m, z1, z2, pressureAngle, q: qInput } = input;

  const q = qInput ?? 10;
  const phi = (pressureAngle * Math.PI) / 180;

  const i = z2 / z1;
  const px = Math.PI * m;
  const lead = z1 * px;

  const d1 = q * m;
  const gamma = Math.atan(z1 / q);
  const gamma_deg = (gamma * 180) / Math.PI;
  const beta_deg = 90 - gamma_deg;

  const da1 = d1 + 2 * m;
  const df1 = d1 - 2.5 * m;

  const d2 = m * z2;
  const da2 = d2 + 2 * m;
  const df2 = d2 - 2.5 * m;

  const C = (d1 + d2) / 2;

  const b1_min = 11 * m;
  const b2_rec = Math.min(0.75 * da1, 0.5 * d1 + 4 * m);

  const ta = (Math.PI * m) / 2;

  const mu_low = 0.05;
  const mu_high = 0.1;
  const rho_low = Math.atan(mu_low);
  const rho_high = Math.atan(mu_high);
  const eta_low = (Math.tan(gamma) / Math.tan(gamma + rho_low)) * 100;
  const eta_high = (Math.tan(gamma) / Math.tan(gamma + rho_high)) * 100;

  const isImperial = unitSystem === "imperial";
  const unit = isImperial ? "in" : "mm";
  const cv = (val: number) => (isImperial ? val / 25.4 : val);
  const fmt = (n: number, d = 4) => n.toFixed(d);

  return [
    {
      label: "Gear Ratio",
      symbol: "i",
      formula: "z2 / z1",
      variables: "z2 = Worm wheel teeth, z1 = Worm starts",
      substitution: `${z2} / ${z1}`,
      value: i,
      unit: "",
      note: `${z1}-start worm with ${z2}-tooth wheel`,
    },
    {
      label: "Axial Pitch (Worm)",
      symbol: "px",
      formula: "π × m",
      variables: "m = Axial module",
      substitution: `π × ${fmt(cv(m))}`,
      value: cv(px),
      unit,
      note: "Equals circular pitch of worm wheel",
    },
    {
      label: "Lead",
      symbol: "L",
      formula: "z1 × px",
      variables: "z1 = Number of starts, px = Axial pitch",
      substitution: `${z1} × ${fmt(cv(px))}`,
      value: cv(lead),
      unit,
      note: "Axial advance of worm per revolution",
    },
    {
      label: "Worm Diameter Factor",
      symbol: "q",
      formula: "d1 / m",
      variables: "d1 = Worm pitch diameter, m = module",
      substitution: `${q}`,
      value: q,
      unit: "",
      note: "Standard values: 6.3, 8, 10, 12.5, 16, 20. Recommended: q=10",
    },
    {
      label: "Worm Pitch Diameter",
      symbol: "d1",
      formula: "q × m",
      variables: "q = Diameter factor, m = module",
      substitution: `${q} × ${fmt(cv(m))}`,
      value: cv(d1),
      unit,
    },
    {
      label: "Lead Angle",
      symbol: "γ",
      formula: "arctan(z1 / q)",
      variables: "z1 = Number of starts, q = Diameter factor",
      substitution: `arctan(${z1} / ${q})`,
      value: gamma_deg,
      unit: "°",
      note: "Self-locking if γ < friction angle (approx γ < 5° for μ=0.1)",
    },
    {
      label: "Helix Angle of Wheel",
      symbol: "β",
      formula: "90° - γ",
      variables: "γ = Worm lead angle",
      substitution: `90° - ${fmt(gamma_deg, 3)}°`,
      value: beta_deg,
      unit: "°",
    },
    {
      label: "Worm Outside Diameter",
      symbol: "da1",
      formula: "d1 + 2m",
      variables: "d1 = Worm pitch diam, m = module",
      substitution: `${fmt(cv(d1))} + 2 × ${fmt(cv(m))}`,
      value: cv(da1),
      unit,
    },
    {
      label: "Worm Root Diameter",
      symbol: "df1",
      formula: "d1 - 2.5m",
      variables: "d1 = Worm pitch diam, m = module",
      substitution: `${fmt(cv(d1))} - 2.5 × ${fmt(cv(m))}`,
      value: cv(df1),
      unit,
    },
    {
      label: "Worm Wheel Pitch Diameter",
      symbol: "d2",
      formula: "m × z2",
      variables: "m = module, z2 = Wheel teeth",
      substitution: `${fmt(cv(m))} × ${z2}`,
      value: cv(d2),
      unit,
    },
    {
      label: "Worm Wheel Outside Diameter",
      symbol: "da2",
      formula: "d2 + 2m",
      variables: "d2 = Wheel pitch diam, m = module",
      substitution: `${fmt(cv(d2))} + 2 × ${fmt(cv(m))}`,
      value: cv(da2),
      unit,
    },
    {
      label: "Worm Wheel Root Diameter",
      symbol: "df2",
      formula: "d2 - 2.5m",
      variables: "d2 = Wheel pitch diam, m = module",
      substitution: `${fmt(cv(d2))} - 2.5 × ${fmt(cv(m))}`,
      value: cv(df2),
      unit,
    },
    {
      label: "Centre Distance",
      symbol: "C",
      formula: "(d1 + d2) / 2",
      variables: "d1 = Worm PD, d2 = Wheel PD",
      substitution: `(${fmt(cv(d1))} + ${fmt(cv(d2))}) / 2`,
      value: cv(C),
      unit,
    },
    {
      label: "Worm Min Face Width",
      symbol: "b1",
      formula: "b1 ≥ 11m",
      variables: "m = module",
      substitution: `11 × ${fmt(cv(m))}`,
      value: cv(b1_min),
      unit,
      note: "Minimum recommended worm face width",
    },
    {
      label: "Wheel Recommended Face Width",
      symbol: "b2",
      formula: "min(0.75 × da1, 0.5d1 + 4m)",
      variables: "da1 = Worm OD, d1 = Worm PD, m = module",
      substitution: `min(0.75×${fmt(cv(da1))}, 0.5×${fmt(cv(d1))}+4×${fmt(cv(m))})`,
      value: cv(b2_rec),
      unit,
    },
    {
      label: "Axial Tooth Thickness",
      symbol: "ta",
      formula: "π × m / 2",
      variables: "m = module",
      substitution: `π × ${fmt(cv(m))} / 2`,
      value: cv(ta),
      unit,
    },
    {
      label: "Efficiency (μ = 0.05)",
      symbol: "η",
      formula: "tan(γ) / tan(γ + ρ)",
      variables: "γ = Lead angle, ρ = friction angle = arctan(μ)",
      substitution: `tan(${fmt(gamma_deg, 3)}°) / tan(${fmt(gamma_deg, 3)}° + arctan(0.05))`,
      value: eta_low,
      unit: "%",
      note: "Bronze wheel on hardened steel worm, well lubricated",
    },
    {
      label: "Efficiency (μ = 0.10)",
      symbol: "η",
      formula: "tan(γ) / tan(γ + ρ)",
      variables: "γ = Lead angle, ρ = friction angle = arctan(μ)",
      substitution: `tan(${fmt(gamma_deg, 3)}°) / tan(${fmt(gamma_deg, 3)}° + arctan(0.10))`,
      value: eta_high,
      unit: "%",
      note: "Cast iron wheel, moderate lubrication",
    },
    {
      label: "Cutter Recommendation",
      symbol: "—",
      formula: "Hob with matching module and pressure angle",
      variables: "m = module, φ = pressure angle",
      substitution: `Module ${m} mm, PA ${pressureAngle}°`,
      value: m,
      unit: "",
      note: `Use module ${m} mm hob cutter matching worm profile. Hob OD ≈ worm pitch diameter (${fmt(cv(d1))} ${unit})`,
    },
    {
      label: "Milling Table Setting",
      symbol: "—",
      formula: "Set table to worm lead angle γ",
      variables: "γ = Worm lead angle",
      substitution: `Table angle = ${fmt(gamma_deg, 3)}°`,
      value: gamma_deg,
      unit: "°",
      note: "Set milling machine table to lead angle to mill helical worm groove",
    },
  ];
}
