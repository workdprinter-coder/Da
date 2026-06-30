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
  mn: z.number().min(0.01, "Module must be > 0"),
  z: z.number().int().min(1, "Teeth must be ≥ 1"),
  spiralAngle: z.number().min(1, "Spiral angle must be > 0°").max(89, "Spiral angle must be < 90°"),
});

export type SpiralBevelLeadInput = z.infer<typeof spiralBevelLeadInputSchema>;

export function calculateSpiralBevelLead(input: SpiralBevelLeadInput): CalculationResult[] {
  const { mn, z, spiralAngle } = input;

  const beta   = (spiralAngle * Math.PI) / 180;
  const tanB   = Math.tan(beta);
  const D      = mn * z;
  const L_mm   = (Math.PI * D) / tanB;
  const L_in   = L_mm / 25.4;

  const fmt = (n: number, dp = 4) => n.toFixed(dp);

  return [
    {
      label: "Module",
      symbol: "m",
      formula: "User input",
      variables: "m = Module (mm)",
      substitution: `${fmt(mn)} mm`,
      value: mn,
      unit: "mm",
    },
    {
      label: "Number of Teeth",
      symbol: "z",
      formula: "User input",
      variables: "z = Number of teeth",
      substitution: `${z}`,
      value: z,
      unit: "",
    },
    {
      label: "Spiral Angle",
      symbol: "β",
      formula: "User input",
      variables: "β = Mean spiral angle (degrees)",
      substitution: `${spiralAngle}°`,
      value: spiralAngle,
      unit: "°",
      note: "Standard Gleason: 35°",
    },
    {
      label: "Pitch Diameter",
      symbol: "D",
      formula: "m × z",
      variables: "m = Module, z = Number of teeth",
      substitution: `${fmt(mn)} × ${z}`,
      value: D,
      unit: "mm",
      note: "D = Module × Teeth",
    },
    {
      label: "Equivalent Machining Lead (mm)",
      symbol: "L",
      formula: "(π × D) / tan(β)",
      variables: `D = ${fmt(D)} mm, β = ${spiralAngle}°`,
      substitution: `(π × ${fmt(D)}) / tan(${spiralAngle}°) = ${fmt(Math.PI * D)} / ${fmt(tanB, 9)}`,
      value: L_mm,
      unit: "mm",
      green: true,
      note: "Equivalent machining lead — for setup calculations only. Not the physical constant lead of the gear.",
    },
    {
      label: "Equivalent Machining Lead (inch)",
      symbol: "L",
      formula: "L (mm) / 25.4",
      variables: `L = ${fmt(L_mm)} mm`,
      substitution: `${fmt(L_mm)} / 25.4`,
      value: L_in,
      unit: "in",
      green: true,
      note: "Inch conversion of equivalent machining lead",
    },
  ];
}
