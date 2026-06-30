import { z } from "zod";
import type { CalculationResult } from "./spur-gear";

export const spiralBevelInputSchema = z.object({
  mn: z.number().min(0.1, "Module must be > 0"),
  z: z.number().int().min(1, "Teeth must be ≥ 1"),
  spiralAngle: z.number().min(1, "Spiral angle must be > 0°").max(89, "Spiral angle must be < 90°"),
});

export type SpiralBevelInput = z.infer<typeof spiralBevelInputSchema>;

export function calculateSpiralBevel(input: SpiralBevelInput): CalculationResult[] {
  const { mn, z, spiralAngle } = input;

  const beta = (spiralAngle * Math.PI) / 180;
  const tanBeta = Math.tan(beta);

  const D = mn * z;
  const L_mm = (Math.PI * D) / tanBeta;
  const L_in = L_mm / 25.4;

  const fmt = (n: number, d = 4) => n.toFixed(d);

  return [
    {
      label: "Module",
      symbol: "m",
      formula: "User input",
      variables: "m = Normal module (mm)",
      substitution: `${fmt(mn)} mm`,
      value: mn,
      unit: "mm",
      note: "Input module — used directly for pitch diameter calculation",
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
      note: "Standard: 35° for Gleason spiral bevel gears",
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
      variables: `D = Pitch diameter (${fmt(D)} mm), β = Spiral angle (${spiralAngle}°)`,
      substitution: `(π × ${fmt(D)}) / tan(${spiralAngle}°) = ${fmt(Math.PI * D)} / ${fmt(tanBeta, 6)}`,
      value: L_mm,
      unit: "mm",
      green: true,
      note: "Equivalent machining lead for setup calculations only",
    },
    {
      label: "Equivalent Machining Lead (inch)",
      symbol: "L",
      formula: "L (mm) / 25.4",
      variables: `L = Lead in mm (${fmt(L_mm)})`,
      substitution: `${fmt(L_mm)} / 25.4`,
      value: L_in,
      unit: "in",
      green: true,
      note: "Inch conversion of equivalent machining lead",
    },
  ];
}
