import { z } from "zod";
import type { CalculationResult } from "./spur-gear";

// ── Helical Gear Lead ──────────────────────────────────────────────────────

export const helicalLeadInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  mn: z.number().min(0.1),
  z: z.number().int().min(6),
  helixAngle: z.number().min(1).max(89),
});

export type HelicalLeadInput = z.infer<typeof helicalLeadInputSchema>;

export function calculateHelicalLead(input: HelicalLeadInput): CalculationResult[] {
  const { unitSystem, mn, z, helixAngle } = input;
  const beta = (helixAngle * Math.PI) / 180;
  const mt = mn / Math.cos(beta);
  const d = mt * z;
  const lead = Math.PI * d / Math.tan(beta);
  const pa = Math.PI * mn / Math.sin(beta);

  const isImperial = unitSystem === "imperial";
  const unit = isImperial ? "in" : "mm";
  const cv = (val: number) => (isImperial ? val / 25.4 : val);
  const fmt = (n: number, dp = 4) => n.toFixed(dp);

  return [
    {
      label: "Transverse Module",
      symbol: "mt",
      formula: "mn / cos(β)",
      variables: "mn = Normal module, β = Helix angle",
      substitution: `${fmt(cv(mn))} / cos(${helixAngle}°)`,
      value: cv(mt),
      unit,
    },
    {
      label: "Pitch Diameter",
      symbol: "d",
      formula: "mt × z",
      variables: "mt = Transverse module, z = Number of teeth",
      substitution: `${fmt(cv(mt))} × ${z}`,
      value: cv(d),
      unit,
    },
    {
      label: "Axial Pitch",
      symbol: "pa",
      formula: "π × mn / sin(β)",
      variables: "mn = Normal module, β = Helix angle",
      substitution: `π × ${fmt(cv(mn))} / sin(${helixAngle}°)`,
      value: cv(pa),
      unit,
      note: "Distance between corresponding tooth profiles measured axially",
    },
    {
      label: "Lead",
      symbol: "L",
      formula: "π × d / tan(β)",
      variables: "d = Pitch diameter, β = Helix angle",
      substitution: `π × ${fmt(cv(d))} / tan(${helixAngle}°)`,
      value: cv(lead),
      unit,
      note: `Lead = axial advance per revolution = ${fmt(cv(lead), 4)} ${unit}. Also = z × pa = ${z} × ${fmt(cv(pa), 4)} = ${fmt(cv(z * pa), 4)} ${unit}`,
      green: true,
    },
    {
      label: "Lead Verification (z × pa)",
      symbol: "L",
      formula: "z × pa",
      variables: "z = Number of teeth, pa = Axial pitch",
      substitution: `${z} × ${fmt(cv(pa))}`,
      value: cv(z * pa),
      unit,
      note: "Must equal L above — confirms calculation consistency",
    },
  ];
}

// ── Worm Lead ──────────────────────────────────────────────────────────────

export const wormLeadInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  m: z.number().min(0.1),
  z1: z.number().int().min(1).max(6),
  q: z.number().min(6).max(25),
});

export type WormLeadInput = z.infer<typeof wormLeadInputSchema>;

export function calculateWormLead(input: WormLeadInput): CalculationResult[] {
  const { unitSystem, m, z1, q } = input;
  const px = Math.PI * m;
  const lead = z1 * px;
  const d1 = q * m;
  const gamma = Math.atan(z1 / q);
  const gamma_deg = (gamma * 180) / Math.PI;
  const lambda_deg = 90 - gamma_deg;

  const isImperial = unitSystem === "imperial";
  const unit = isImperial ? "in" : "mm";
  const cv = (val: number) => (isImperial ? val / 25.4 : val);
  const fmt = (n: number, dp = 4) => n.toFixed(dp);

  return [
    {
      label: "Axial Pitch",
      symbol: "px",
      formula: "π × m",
      variables: "m = Axial module",
      substitution: `π × ${fmt(cv(m))}`,
      value: cv(px),
      unit,
      note: "Axial pitch = distance between adjacent threads measured axially",
    },
    {
      label: "Worm Pitch Diameter",
      symbol: "d1",
      formula: "q × m",
      variables: "q = Diameter factor, m = Axial module",
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
      note: gamma_deg < 5 ? "γ < 5° — self-locking under most conditions" : "γ > 5° — may not be self-locking",
    },
    {
      label: "Helix Angle of Worm",
      symbol: "λ",
      formula: "90° − γ",
      variables: "γ = Lead angle",
      substitution: `90° − ${fmt(gamma_deg, 3)}°`,
      value: lambda_deg,
      unit: "°",
      note: "Helix angle measured from transverse plane of worm",
    },
    {
      label: "Lead",
      symbol: "L",
      formula: "z1 × px = z1 × π × m",
      variables: "z1 = Number of starts, px = Axial pitch, m = Axial module",
      substitution: `${z1} × π × ${fmt(cv(m))} = ${z1} × ${fmt(cv(px))}`,
      value: cv(lead),
      unit,
      note: `Lead = axial advance of worm per revolution = ${fmt(cv(lead), 4)} ${unit}. Worm wheel advances ${z1} tooth/tooth pitch per worm revolution.`,
      green: true,
    },
    {
      label: "Lead — Pitch Diameter Method",
      symbol: "L",
      formula: "π × d1 × tan(γ)",
      variables: "d1 = Worm pitch diameter, γ = Lead angle",
      substitution: `π × ${fmt(cv(d1))} × tan(${fmt(gamma_deg, 3)}°)`,
      value: cv(Math.PI * d1 * Math.tan(gamma)),
      unit,
      note: "Alternative formula — must equal L above",
    },
  ];
}

// ── Spiral Bevel Lead ──────────────────────────────────────────────────────

export const spiralBevelLeadInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  mn: z.number().min(0.1),
  z: z.number().int().min(5),
  delta_deg: z.number().min(1).max(89),
  spiralAngle: z.number().min(5).max(60),
  faceWidthRatio: z.number().min(0.1).max(0.4).optional(),
});

export type SpiralBevelLeadInput = z.infer<typeof spiralBevelLeadInputSchema>;

export function calculateSpiralBevelLead(input: SpiralBevelLeadInput): CalculationResult[] {
  const { unitSystem, mn, z, delta_deg, spiralAngle, faceWidthRatio: fwRatio } = input;

  const delta = (delta_deg * Math.PI) / 180;
  const beta = (spiralAngle * Math.PI) / 180;

  // Outer cone distance from delta and z (approximate, assuming standard gear)
  // For a given pitch cone angle and teeth count:
  // de = mn × z / (cos(delta) for transverse module)
  // Re = de / (2 × sin(delta))
  // Using outer module relationship:
  const Re_approx = mn * z / (2 * Math.sin(delta));
  const fwRatioVal = fwRatio ?? 0.3;
  const F = fwRatioVal * Re_approx;
  const Rm = Re_approx - F / 2;
  const mm = mn * Rm / Re_approx;

  // Mean pitch diameter at mid-face
  const dm = 2 * Rm * Math.sin(delta);

  // Mean lead (Gleason face hobbing concept: lead at mean pitch circle)
  const lead_mean = Math.PI * dm / Math.tan(beta);

  // For Gleason face milling (fixed setting), the cutter describes a helical
  // path. The equivalent machining lead relates cutter rotation to blank rotation:
  const pa_mean = Math.PI * mm / Math.sin(beta);   // mean axial pitch
  const lead_axial = z * pa_mean;                   // machining lead (z × mean axial pitch)

  const isImperial = unitSystem === "imperial";
  const unit = isImperial ? "in" : "mm";
  const cv = (val: number) => (isImperial ? val / 25.4 : val);
  const fmt = (n: number, dp = 4) => n.toFixed(dp);

  return [
    {
      label: "Pitch Cone Angle",
      symbol: "δ",
      formula: "User input",
      variables: "δ = Pitch cone angle of this member",
      substitution: `${delta_deg}°`,
      value: delta_deg,
      unit: "°",
    },
    {
      label: "Mean Spiral Angle",
      symbol: "β",
      formula: "User input",
      variables: "β = Mean spiral angle",
      substitution: `${spiralAngle}°`,
      value: spiralAngle,
      unit: "°",
      note: "Standard Gleason: β = 35°. Measured at mean cone distance.",
    },
    {
      label: "Outer Cone Distance (Approx)",
      symbol: "Re",
      formula: "mn × z / (2 × sin(δ))",
      variables: "mn = Normal module, z = Teeth, δ = Pitch cone angle",
      substitution: `${fmt(cv(mn))} × ${z} / (2 × sin(${delta_deg}°))`,
      value: cv(Re_approx),
      unit,
    },
    {
      label: "Mean Cone Distance",
      symbol: "Rm",
      formula: "Re − F/2",
      variables: `Re = Outer cone dist, F/Re = ${fwRatioVal}`,
      substitution: `${fmt(cv(Re_approx))} − ${fmt(cv(F))}/2`,
      value: cv(Rm),
      unit,
    },
    {
      label: "Mean Pitch Diameter",
      symbol: "dm",
      formula: "2 × Rm × sin(δ)",
      variables: "Rm = Mean cone distance, δ = Pitch cone angle",
      substitution: `2 × ${fmt(cv(Rm))} × sin(${delta_deg}°)`,
      value: cv(dm),
      unit,
    },
    {
      label: "Mean Module",
      symbol: "mm",
      formula: "mn × Rm / Re",
      variables: "mn = Normal module, Rm = Mean, Re = Outer cone dist",
      substitution: `${fmt(cv(mn))} × ${fmt(cv(Rm))} / ${fmt(cv(Re_approx))}`,
      value: cv(mm),
      unit,
    },
    {
      label: "Mean Axial Pitch",
      symbol: "pa",
      formula: "π × mm / sin(β)",
      variables: "mm = Mean module, β = Mean spiral angle",
      substitution: `π × ${fmt(cv(mm))} / sin(${spiralAngle}°)`,
      value: cv(pa_mean),
      unit,
    },
    {
      label: "Lead at Mean Pitch Circle",
      symbol: "L",
      formula: "π × dm / tan(β)",
      variables: "dm = Mean pitch diameter, β = Mean spiral angle",
      substitution: `π × ${fmt(cv(dm))} / tan(${spiralAngle}°)`,
      value: cv(lead_mean),
      unit,
      note: "Lead at the mean pitch circle — primary lead value for this gear member",
      green: true,
    },
    {
      label: "Equivalent Machining Lead",
      symbol: "Lm",
      formula: "z × pa",
      variables: "z = Number of teeth, pa = Mean axial pitch",
      substitution: `${z} × ${fmt(cv(pa_mean))}`,
      value: cv(lead_axial),
      unit,
      note: "Used for differential gear train setup on bevel gear generator or CNC machine (face milling method). Confirms blank rotation to cutter rotation ratio.",
    },
  ];
}
