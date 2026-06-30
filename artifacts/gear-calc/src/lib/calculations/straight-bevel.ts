import { z } from "zod";
import type { CalculationResult } from "./spur-gear";

export const straightBevelInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  m: z.number().min(0.1),
  z1: z.number().int().min(5),
  z2: z.number().int().min(5),
  shaftAngle: z.number().min(45).max(135),
  pressureAngle: z.number().min(14.5).max(25),
  faceWidth: z.number().min(1).optional(),
  addendumFactor: z.number().min(0.1).max(3),
  dedendumFactor: z.number().min(0.1).max(3),
});

export type StraightBevelInput = z.infer<typeof straightBevelInputSchema>;

function getCutterNum(zv: number): string {
  if (zv >= 135) return "#1 (135 teeth to rack)";
  if (zv >= 55) return "#2 (55–134 teeth)";
  if (zv >= 35) return "#3 (35–54 teeth)";
  if (zv >= 26) return "#4 (26–34 teeth)";
  if (zv >= 21) return "#5 (21–25 teeth)";
  if (zv >= 17) return "#6 (17–20 teeth)";
  if (zv >= 14) return "#7 (14–16 teeth)";
  return "#8 (12–13 teeth)";
}

function getIndexing(z: number): string {
  const ratio = 40 / z;
  const whole = Math.floor(ratio);
  const frac = ratio - whole;
  if (frac < 0.001) return `${whole} full turns`;
  const circles = [15, 16, 17, 18, 19, 20, 21, 23, 27, 29, 31, 33, 37, 39, 41, 43, 47, 49];
  for (const c of circles) {
    const holes = Math.round(frac * c);
    if (Math.abs(holes / c - frac) < 0.001) return `${whole} turns + ${holes}/${c} holes`;
  }
  return `${ratio.toFixed(4)} turns (compound indexing required)`;
}

export function calculateStraightBevel(input: StraightBevelInput): CalculationResult[] {
  const { unitSystem, m, z1, z2, shaftAngle: sigma_deg, pressureAngle, faceWidth, addendumFactor, dedendumFactor } = input;

  const sigma = (sigma_deg * Math.PI) / 180;

  // Pitch cone angles (general shaft angle formula)
  const delta2 = Math.atan(Math.sin(sigma) / (z1 / z2 + Math.cos(sigma)));
  const delta1 = Math.atan(Math.sin(sigma) / (z2 / z1 + Math.cos(sigma)));
  const delta1_deg = (delta1 * 180) / Math.PI;
  const delta2_deg = (delta2 * 180) / Math.PI;

  const i = z2 / z1;

  // Outer pitch diameters
  const de1 = m * z1;
  const de2 = m * z2;

  // Outer cone distance
  const Re = de1 / (2 * Math.sin(delta1));

  // Tooth proportions
  const ae = addendumFactor * m;
  const be = dedendumFactor * m;
  const h = ae + be;
  const hw = 2 * ae;
  const hc = h;

  // Recommended / actual face width
  const F_rec = Math.min(Re / 3, 10 * m);
  const F = faceWidth && faceWidth > 0 ? faceWidth : F_rec;
  const Rm = Re - F / 2;
  const mm = m * Rm / Re;

  // Outside diameters (addendum projected onto transverse plane)
  const dae1 = de1 + 2 * ae * Math.cos(delta1);
  const dae2 = de2 + 2 * ae * Math.cos(delta2);

  // Root diameters
  const dfe1 = de1 - 2 * be * Math.cos(delta1);
  const dfe2 = de2 - 2 * be * Math.cos(delta2);

  // Face angles
  const delta_f1 = delta1 + Math.atan(ae / Re);
  const delta_f2 = delta2 + Math.atan(ae / Re);
  const delta_f1_deg = (delta_f1 * 180) / Math.PI;
  const delta_f2_deg = (delta_f2 * 180) / Math.PI;

  // Root angles
  const delta_r1 = delta1 - Math.atan(be / Re);
  const delta_r2 = delta2 - Math.atan(be / Re);
  const delta_r1_deg = (delta_r1 * 180) / Math.PI;
  const delta_r2_deg = (delta_r2 * 180) / Math.PI;

  // Back cone (crown) radii — used for tooth thickness and back angle
  const Rb1 = de1 / (2 * Math.tan(delta1));
  const Rb2 = de2 / (2 * Math.tan(delta2));

  // Tooth thickness at outer pitch circle (standard, no profile shift)
  const tt_outer = (Math.PI * m) / 2;
  const tt_mean = (Math.PI * mm) / 2;

  // Virtual (equivalent) number of teeth — Tregold's approximation
  const zv1 = z1 / Math.cos(delta1);
  const zv2 = z2 / Math.cos(delta2);

  // Undercut check (virtual teeth < 17 for 20° PA)
  const undercut_limit = pressureAngle <= 14.5 ? 32 : pressureAngle <= 20 ? 17 : 13;

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
      label: "Pinion Pitch Cone Angle",
      symbol: "δ1",
      formula: "arctan(sin(Σ) / (z2/z1 + cos(Σ)))",
      variables: "Σ = Shaft angle, z1 = Pinion teeth, z2 = Gear teeth",
      substitution: `arctan(sin(${sigma_deg}°) / (${z2}/${z1} + cos(${sigma_deg}°)))`,
      value: delta1_deg,
      unit: "°",
      note: sigma_deg === 90 ? "At 90° shaft: δ1 = arctan(z1/z2)" : "General shaft angle formula",
    },
    {
      label: "Gear Pitch Cone Angle",
      symbol: "δ2",
      formula: "arctan(sin(Σ) / (z1/z2 + cos(Σ)))",
      variables: "Σ = Shaft angle, z1 = Pinion teeth, z2 = Gear teeth",
      substitution: `arctan(sin(${sigma_deg}°) / (${z1}/${z2} + cos(${sigma_deg}°)))`,
      value: delta2_deg,
      unit: "°",
      note: `δ1 + δ2 = ${fmt(delta1_deg + delta2_deg, 3)}° (should equal shaft angle ${sigma_deg}°)`,
    },
    {
      label: "Outer Pitch Diameter — Pinion",
      symbol: "de1",
      formula: "m × z1",
      variables: "m = module, z1 = Pinion teeth",
      substitution: `${fmt(cv(m))} × ${z1}`,
      value: cv(de1),
      unit,
    },
    {
      label: "Outer Pitch Diameter — Gear",
      symbol: "de2",
      formula: "m × z2",
      variables: "m = module, z2 = Gear teeth",
      substitution: `${fmt(cv(m))} × ${z2}`,
      value: cv(de2),
      unit,
    },
    {
      label: "Outer Cone Distance",
      symbol: "Re",
      formula: "de1 / (2 × sin(δ1))",
      variables: "de1 = Outer pitch diameter pinion, δ1 = Pinion pitch cone angle",
      substitution: `${fmt(cv(de1))} / (2 × sin(${fmt(delta1_deg, 3)}°))`,
      value: cv(Re),
      unit,
      note: "Pitch cone generator length — governs all blank proportions",
    },
    {
      label: "Face Width",
      symbol: "F",
      formula: "min(Re/3, 10m) recommended",
      variables: "Re = Outer cone distance, m = module",
      substitution: faceWidth ? `User input: ${fmt(cv(F))}` : `min(${fmt(cv(Re))}/3, 10×${fmt(cv(m))})`,
      value: cv(F),
      unit,
      warning: F > Re / 3,
      note: F > Re / 3 ? "F > Re/3 — excessive; reduce face width" : "F/Re = " + fmt(F / Re, 3) + " (acceptable, max 1/3)",
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
      formula: "m × Rm / Re",
      variables: "m = module, Rm = Mean cone dist, Re = Outer cone dist",
      substitution: `${fmt(cv(m))} × ${fmt(cv(Rm))} / ${fmt(cv(Re))}`,
      value: cv(mm),
      unit,
      note: "Module at mid-face — used for tooth thickness and cutting",
    },
    {
      label: "Addendum (Outer)",
      symbol: "ae",
      formula: "ha × m",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), m = module`,
      substitution: `${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(ae),
      unit,
    },
    {
      label: "Dedendum (Outer)",
      symbol: "be",
      formula: "hf × m",
      variables: `hf = Dedendum factor (${fmt(dedendumFactor)}), m = module`,
      substitution: `${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(be),
      unit,
    },
    {
      label: "Whole Depth",
      symbol: "h",
      formula: "(ha + hf) × m",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(m))}`,
      value: cv(h),
      unit,
      note: `Depth factor = ${fmt(addendumFactor + dedendumFactor, 3)} × m`,
    },
    {
      label: "Working Depth",
      symbol: "hw",
      formula: "2 × ha × m",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), m = module`,
      substitution: `2 × ${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(hw),
      unit,
    },
    {
      label: "Depth of Cut",
      symbol: "hc",
      formula: "(ha + hf) × m",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(m))}`,
      value: cv(hc),
      unit,
      note: "Cutter depth setting = whole depth",
    },
    {
      label: "Outside Diameter — Pinion",
      symbol: "dae1",
      formula: "de1 + 2 × ae × cos(δ1)",
      variables: `de1 = Outer PD, ae = Addendum, δ1 = Pinion cone angle`,
      substitution: `${fmt(cv(de1))} + 2×${fmt(cv(ae))}×cos(${fmt(delta1_deg, 3)}°)`,
      value: cv(dae1),
      unit,
    },
    {
      label: "Outside Diameter — Gear",
      symbol: "dae2",
      formula: "de2 + 2 × ae × cos(δ2)",
      variables: `de2 = Outer PD, ae = Addendum, δ2 = Gear cone angle`,
      substitution: `${fmt(cv(de2))} + 2×${fmt(cv(ae))}×cos(${fmt(delta2_deg, 3)}°)`,
      value: cv(dae2),
      unit,
    },
    {
      label: "Root Diameter — Pinion",
      symbol: "dfe1",
      formula: "de1 − 2 × be × cos(δ1)",
      variables: `de1 = Outer PD, be = Dedendum, δ1 = Pinion cone angle`,
      substitution: `${fmt(cv(de1))} − 2×${fmt(cv(be))}×cos(${fmt(delta1_deg, 3)}°)`,
      value: cv(dfe1),
      unit,
    },
    {
      label: "Root Diameter — Gear",
      symbol: "dfe2",
      formula: "de2 − 2 × be × cos(δ2)",
      variables: `de2 = Outer PD, be = Dedendum, δ2 = Gear cone angle`,
      substitution: `${fmt(cv(de2))} − 2×${fmt(cv(be))}×cos(${fmt(delta2_deg, 3)}°)`,
      value: cv(dfe2),
      unit,
    },
    {
      label: "Face Angle — Pinion",
      symbol: "δf1",
      formula: "δ1 + arctan(ae / Re)",
      variables: "δ1 = Pitch cone angle, ae = Outer addendum, Re = Cone dist",
      substitution: `${fmt(delta1_deg, 3)}° + arctan(${fmt(cv(ae))}/${fmt(cv(Re))})`,
      value: delta_f1_deg,
      unit: "°",
      note: "Blank face angle — sets the outer face of the blank",
    },
    {
      label: "Face Angle — Gear",
      symbol: "δf2",
      formula: "δ2 + arctan(ae / Re)",
      variables: "δ2 = Pitch cone angle, ae = Outer addendum, Re = Cone dist",
      substitution: `${fmt(delta2_deg, 3)}° + arctan(${fmt(cv(ae))}/${fmt(cv(Re))})`,
      value: delta_f2_deg,
      unit: "°",
    },
    {
      label: "Root Angle — Pinion",
      symbol: "δr1",
      formula: "δ1 − arctan(be / Re)",
      variables: "δ1 = Pitch cone angle, be = Outer dedendum, Re = Cone dist",
      substitution: `${fmt(delta1_deg, 3)}° − arctan(${fmt(cv(be))}/${fmt(cv(Re))})`,
      value: delta_r1_deg,
      unit: "°",
      note: "Machine table set to root angle when cutting each gear",
    },
    {
      label: "Root Angle — Gear",
      symbol: "δr2",
      formula: "δ2 − arctan(be / Re)",
      variables: "δ2 = Pitch cone angle, be = Outer dedendum, Re = Cone dist",
      substitution: `${fmt(delta2_deg, 3)}° − arctan(${fmt(cv(be))}/${fmt(cv(Re))})`,
      value: delta_r2_deg,
      unit: "°",
    },
    {
      label: "Back Cone Distance — Pinion",
      symbol: "Rb1",
      formula: "de1 / (2 × tan(δ1))",
      variables: "de1 = Outer pitch diam, δ1 = Pitch cone angle",
      substitution: `${fmt(cv(de1))} / (2 × tan(${fmt(delta1_deg, 3)}°))`,
      value: cv(Rb1),
      unit,
      note: "Back cone radius — used for chordal tooth thickness measurement",
    },
    {
      label: "Back Cone Distance — Gear",
      symbol: "Rb2",
      formula: "de2 / (2 × tan(δ2))",
      variables: "de2 = Outer pitch diam, δ2 = Pitch cone angle",
      substitution: `${fmt(cv(de2))} / (2 × tan(${fmt(delta2_deg, 3)}°))`,
      value: cv(Rb2),
      unit,
    },
    {
      label: "Tooth Thickness at Outer Pitch Circle",
      symbol: "tt",
      formula: "π × m / 2",
      variables: "m = module (standard, no profile shift)",
      substitution: `π × ${fmt(cv(m))} / 2`,
      value: cv(tt_outer),
      unit,
      note: "Theoretical chordal tooth thickness at outer pitch circle",
    },
    {
      label: "Tooth Thickness at Mean Face Width",
      symbol: "tm",
      formula: "π × mm / 2",
      variables: "mm = Mean module",
      substitution: `π × ${fmt(cv(mm))} / 2`,
      value: cv(tt_mean),
      unit,
      note: "Mean tooth thickness — used for cutter setting and inspection",
    },
    {
      label: "Virtual Teeth — Pinion (Tregold)",
      symbol: "zv1",
      formula: "z1 / cos(δ1)",
      variables: "z1 = Pinion teeth, δ1 = Pitch cone angle",
      substitution: `${z1} / cos(${fmt(delta1_deg, 3)}°)`,
      value: zv1,
      unit: "teeth",
      warning: zv1 < undercut_limit,
      note: zv1 < undercut_limit ? `zv1 = ${fmt(zv1, 1)} — undercut risk at PA ${pressureAngle}°` : "Select gear cutter from virtual tooth count",
    },
    {
      label: "Virtual Teeth — Gear (Tregold)",
      symbol: "zv2",
      formula: "z2 / cos(δ2)",
      variables: "z2 = Gear teeth, δ2 = Pitch cone angle",
      substitution: `${z2} / cos(${fmt(delta2_deg, 3)}°)`,
      value: zv2,
      unit: "teeth",
    },
    {
      label: "Cutter Recommendation — Pinion",
      symbol: "—",
      formula: "Based on virtual teeth zv1",
      variables: `zv1 = ${fmt(zv1, 1)} virtual teeth`,
      substitution: `Cutter for ${fmt(zv1, 1)} virtual teeth`,
      value: zv1,
      unit: "",
      note: `${getCutterNum(zv1)}, Module ${m} mm, PA ${pressureAngle}°`,
    },
    {
      label: "Cutter Recommendation — Gear",
      symbol: "—",
      formula: "Based on virtual teeth zv2",
      variables: `zv2 = ${fmt(zv2, 1)} virtual teeth`,
      substitution: `Cutter for ${fmt(zv2, 1)} virtual teeth`,
      value: zv2,
      unit: "",
      note: `${getCutterNum(zv2)}, Module ${m} mm, PA ${pressureAngle}°`,
    },
    {
      label: "Indexing — Pinion",
      symbol: "—",
      formula: "40 / z1",
      variables: "Standard 40:1 dividing head",
      substitution: `40 / ${z1}`,
      value: 40 / z1,
      unit: "turns",
      note: getIndexing(z1),
    },
    {
      label: "Indexing — Gear",
      symbol: "—",
      formula: "40 / z2",
      variables: "Standard 40:1 dividing head",
      substitution: `40 / ${z2}`,
      value: 40 / z2,
      unit: "turns",
      note: getIndexing(z2),
    },
    {
      label: "Machine Setup — Table Angle",
      symbol: "—",
      formula: "Set table to root angle of gear being cut",
      variables: `δr1 = ${fmt(delta_r1_deg, 3)}° (Pinion), δr2 = ${fmt(delta_r2_deg, 3)}° (Gear)`,
      substitution: "Tilt table so cutter travels parallel to root of tooth",
      value: delta_r1_deg,
      unit: "°",
      note: `Pinion: table = ${fmt(delta_r1_deg, 3)}° | Gear: table = ${fmt(delta_r2_deg, 3)}°. Set cutter on pitch line, depth of cut = ${fmt(cv(hc), 4)} ${unit}`,
    },
  ];
}
