import { z } from "zod";
import type { CalculationResult } from "./spur-gear";

export const spiralBevelInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  mn: z.number().min(0.1),
  z1: z.number().int().min(5),
  z2: z.number().int().min(5),
  shaftAngle: z.number().min(45).max(135),
  spiralAngle: z.number().min(10).max(50),
  pressureAngle: z.number().min(14.5).max(25),
  faceWidthRatio: z.number().min(0.1).max(0.4).optional(),
  addendumFactor: z.number().min(0.1).max(3),
  dedendumFactor: z.number().min(0.1).max(3),
});

export type SpiralBevelInput = z.infer<typeof spiralBevelInputSchema>;

export function calculateSpiralBevel(input: SpiralBevelInput): CalculationResult[] {
  const {
    unitSystem, mn, z1, z2, shaftAngle: _shaftAngle,
    spiralAngle, pressureAngle, faceWidthRatio: fwRatio,
    addendumFactor, dedendumFactor,
  } = input;

  const beta = (spiralAngle * Math.PI) / 180;

  const i = z2 / z1;
  const delta2 = Math.atan(z2 / z1);
  const delta1 = (Math.PI / 2) - delta2;
  const delta1_deg = (delta1 * 180) / Math.PI;
  const delta2_deg = (delta2 * 180) / Math.PI;

  const Re = mn * z2 / (2 * Math.sin(delta2));
  const fwRatioVal = fwRatio ?? 0.3;
  const F = fwRatioVal * Re;
  const Rm = Re - F / 2;

  const de1 = 2 * Re * Math.sin(delta1);
  const de2 = 2 * Re * Math.sin(delta2);

  // Tooth proportions using user factors (applied at outer cone)
  const ae = addendumFactor * mn;
  const be = dedendumFactor * mn;
  const h = ae + be;
  const hw = 2 * ae;
  const hc = h;

  const dae1 = de1 + 2 * ae * Math.cos(delta1);
  const dae2 = de2 + 2 * ae * Math.cos(delta2);
  const dfe1 = de1 - 2 * be * Math.cos(delta1);
  const dfe2 = de2 - 2 * be * Math.cos(delta2);

  const deltaF1_deg = delta1_deg + (Math.atan(ae / Re) * 180) / Math.PI;
  const deltaF2_deg = delta2_deg + (Math.atan(ae / Re) * 180) / Math.PI;
  const deltaR1_deg = delta1_deg - (Math.atan(be / Re) * 180) / Math.PI;
  const deltaR2_deg = delta2_deg - (Math.atan(be / Re) * 180) / Math.PI;

  const mm = mn * Rm / Re;
  const dm1 = mm * z1;
  const dm2 = mm * z2;

  const tt_mid = Math.PI * mm / 2;

  const isImperial = unitSystem === "imperial";
  const unit = isImperial ? "in" : "mm";
  const cv = (val: number) => (isImperial ? val / 25.4 : val);
  const fmt = (n: number, d = 4) => n.toFixed(d);

  const getIndexing = (z: number): string => {
    const ratio = 40 / z;
    const whole = Math.floor(ratio);
    const frac = ratio - whole;
    if (frac < 0.001) return `${whole} full turns`;
    const circles = [15,16,17,18,19,20,21,23,27,29,31,33,37,39,41,43,47,49];
    for (const c of circles) {
      const holes = Math.round(frac * c);
      if (Math.abs(holes / c - frac) < 0.001) {
        return `${whole} turns + ${holes}/${c} holes`;
      }
    }
    return `${fmt(ratio, 4)} turns (compound indexing required)`;
  };

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
      label: "Pinion Pitch Cone Angle",
      symbol: "δ1",
      formula: "arctan(z1 / z2) [90° shaft angle]",
      variables: "z1 = Pinion teeth, z2 = Gear teeth",
      substitution: `arctan(${z1} / ${z2})`,
      value: delta1_deg,
      unit: "°",
    },
    {
      label: "Gear Pitch Cone Angle",
      symbol: "δ2",
      formula: "90° − δ1",
      variables: "δ1 = Pinion pitch cone angle",
      substitution: `90° − ${fmt(delta1_deg, 3)}°`,
      value: delta2_deg,
      unit: "°",
    },
    {
      label: "Outer Cone Distance",
      symbol: "Re",
      formula: "mn × z2 / (2 × sin(δ2))",
      variables: "mn = Normal module, z2 = Gear teeth, δ2 = Gear pitch cone angle",
      substitution: `${fmt(cv(mn))} × ${z2} / (2 × sin(${fmt(delta2_deg, 3)}°))`,
      value: cv(Re),
      unit,
      note: "Pitch cone generator length (outer)",
    },
    {
      label: "Face Width",
      symbol: "F",
      formula: "Re × (F/Re ratio)",
      variables: "Re = Outer cone distance",
      substitution: `${fmt(cv(Re))} × ${fwRatioVal}`,
      value: cv(F),
      unit,
      warning: fwRatioVal > 0.33,
      note: fwRatioVal > 0.33 ? "F/Re > 1/3 — excessive face width" : "F/Re ≤ 1/3 — acceptable",
    },
    {
      label: "Mean Cone Distance",
      symbol: "Rm",
      formula: "Re − F/2",
      variables: "Re = Outer cone distance, F = Face width",
      substitution: `${fmt(cv(Re))} − ${fmt(cv(F))} / 2`,
      value: cv(Rm),
      unit,
    },
    {
      label: "Mean Module",
      symbol: "mm",
      formula: "mn × Rm / Re",
      variables: "mn = Normal module, Rm = Mean cone dist, Re = Outer cone dist",
      substitution: `${fmt(cv(mn))} × ${fmt(cv(Rm))} / ${fmt(cv(Re))}`,
      value: cv(mm),
      unit,
      note: "Module at mean face width position",
    },
    {
      label: "Addendum (Outer)",
      symbol: "ae",
      formula: "ha × mn",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), mn = Normal module`,
      substitution: `${fmt(addendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(ae),
      unit,
      note: "Tooth height above outer pitch cone",
    },
    {
      label: "Dedendum (Outer)",
      symbol: "be",
      formula: "hf × mn",
      variables: `hf = Dedendum factor (${fmt(dedendumFactor)}), mn = Normal module`,
      substitution: `${fmt(dedendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(be),
      unit,
      note: "Tooth depth below outer pitch cone",
    },
    {
      label: "Whole Depth",
      symbol: "h",
      formula: "(ha + hf) × mn",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, mn = Normal module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(mn))}`,
      value: cv(h),
      unit,
      note: "Total tooth height = addendum + dedendum",
    },
    {
      label: "Working Depth",
      symbol: "hw",
      formula: "2 × ha × mn",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), mn = Normal module`,
      substitution: `2 × ${fmt(addendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(hw),
      unit,
      note: "Depth of engagement between mating teeth",
    },
    {
      label: "Depth of Cut",
      symbol: "hc",
      formula: "(ha + hf) × mn",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, mn = Normal module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(mn))}`,
      value: cv(hc),
      unit,
      note: "Cutter / tool depth setting = whole depth",
    },
    {
      label: "Mean Pitch Diameter Pinion",
      symbol: "dm1",
      formula: "mm × z1",
      variables: "mm = Mean module, z1 = Pinion teeth",
      substitution: `${fmt(cv(mm))} × ${z1}`,
      value: cv(dm1),
      unit,
    },
    {
      label: "Mean Pitch Diameter Gear",
      symbol: "dm2",
      formula: "mm × z2",
      variables: "mm = Mean module, z2 = Gear teeth",
      substitution: `${fmt(cv(mm))} × ${z2}`,
      value: cv(dm2),
      unit,
    },
    {
      label: "Outer Pitch Diameter Pinion",
      symbol: "de1",
      formula: "2 × Re × sin(δ1)",
      variables: "Re = Outer cone distance, δ1 = Pinion pitch cone angle",
      substitution: `2 × ${fmt(cv(Re))} × sin(${fmt(delta1_deg, 3)}°)`,
      value: cv(de1),
      unit,
    },
    {
      label: "Outer Pitch Diameter Gear",
      symbol: "de2",
      formula: "2 × Re × sin(δ2)",
      variables: "Re = Outer cone distance, δ2 = Gear pitch cone angle",
      substitution: `2 × ${fmt(cv(Re))} × sin(${fmt(delta2_deg, 3)}°)`,
      value: cv(de2),
      unit,
    },
    {
      label: "Outside Diameter Pinion",
      symbol: "dae1",
      formula: "de1 + 2 × ha × mn × cos(δ1)",
      variables: `de1 = Outer PD, ha = ${fmt(addendumFactor)}, mn = module, δ1 = cone angle`,
      substitution: `${fmt(cv(de1))} + 2×${fmt(addendumFactor)}×${fmt(cv(mn))}×cos(${fmt(delta1_deg, 3)}°)`,
      value: cv(dae1),
      unit,
    },
    {
      label: "Outside Diameter Gear",
      symbol: "dae2",
      formula: "de2 + 2 × ha × mn × cos(δ2)",
      variables: `de2 = Outer PD, ha = ${fmt(addendumFactor)}, mn = module, δ2 = cone angle`,
      substitution: `${fmt(cv(de2))} + 2×${fmt(addendumFactor)}×${fmt(cv(mn))}×cos(${fmt(delta2_deg, 3)}°)`,
      value: cv(dae2),
      unit,
    },
    {
      label: "Root Diameter Pinion",
      symbol: "dfe1",
      formula: "de1 − 2 × hf × mn × cos(δ1)",
      variables: `de1 = Outer PD, hf = ${fmt(dedendumFactor)}, mn = module, δ1 = cone angle`,
      substitution: `${fmt(cv(de1))} − 2×${fmt(dedendumFactor)}×${fmt(cv(mn))}×cos(${fmt(delta1_deg, 3)}°)`,
      value: cv(dfe1),
      unit,
    },
    {
      label: "Root Diameter Gear",
      symbol: "dfe2",
      formula: "de2 − 2 × hf × mn × cos(δ2)",
      variables: `de2 = Outer PD, hf = ${fmt(dedendumFactor)}, mn = module, δ2 = cone angle`,
      substitution: `${fmt(cv(de2))} − 2×${fmt(dedendumFactor)}×${fmt(cv(mn))}×cos(${fmt(delta2_deg, 3)}°)`,
      value: cv(dfe2),
      unit,
    },
    {
      label: "Face Angle Pinion",
      symbol: "δf1",
      formula: "δ1 + arctan(ae / Re)",
      variables: "δ1 = Pitch cone angle, ae = addendum, Re = outer cone dist",
      substitution: `${fmt(delta1_deg, 3)}° + arctan(${fmt(cv(ae))}/${fmt(cv(Re))})`,
      value: deltaF1_deg,
      unit: "°",
    },
    {
      label: "Face Angle Gear",
      symbol: "δf2",
      formula: "δ2 + arctan(ae / Re)",
      variables: "δ2 = Pitch cone angle, ae = addendum, Re = outer cone dist",
      substitution: `${fmt(delta2_deg, 3)}° + arctan(${fmt(cv(ae))}/${fmt(cv(Re))})`,
      value: deltaF2_deg,
      unit: "°",
    },
    {
      label: "Root Angle Pinion",
      symbol: "δr1",
      formula: "δ1 − arctan(be / Re)",
      variables: "δ1 = Pitch cone angle, be = dedendum, Re = outer cone dist",
      substitution: `${fmt(delta1_deg, 3)}° − arctan(${fmt(cv(be))}/${fmt(cv(Re))})`,
      value: deltaR1_deg,
      unit: "°",
    },
    {
      label: "Root Angle Gear",
      symbol: "δr2",
      formula: "δ2 − arctan(be / Re)",
      variables: "δ2 = Pitch cone angle, be = dedendum, Re = outer cone dist",
      substitution: `${fmt(delta2_deg, 3)}° − arctan(${fmt(cv(be))}/${fmt(cv(Re))})`,
      value: deltaR2_deg,
      unit: "°",
    },
    {
      label: "Tooth Thickness at Mid-Face",
      symbol: "tt",
      formula: "π × mm / 2",
      variables: "mm = Mean module",
      substitution: `π × ${fmt(cv(mm))} / 2`,
      value: cv(tt_mid),
      unit,
    },
    {
      label: "Spiral Angle",
      symbol: "β",
      formula: "User input",
      variables: "β = Mean spiral angle",
      substitution: `${spiralAngle}°`,
      value: spiralAngle,
      unit: "°",
      note: "Standard: 35° for Gleason. RH pinion meshes with LH gear.",
    },
    {
      label: "Indexing — Pinion",
      symbol: "—",
      formula: "40 / z1 turns of index plate",
      variables: "z1 = Pinion teeth (standard 40:1 worm dividing head)",
      substitution: `40 / ${z1}`,
      value: 40 / z1,
      unit: "",
      note: getIndexing(z1),
    },
    {
      label: "Indexing — Gear",
      symbol: "—",
      formula: "40 / z2 turns of index plate",
      variables: "z2 = Gear teeth",
      substitution: `40 / ${z2}`,
      value: 40 / z2,
      unit: "",
      note: getIndexing(z2),
    },
  ];
}
