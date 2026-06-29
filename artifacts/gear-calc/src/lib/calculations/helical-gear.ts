import { z } from "zod";
import type { CalculationResult } from "./spur-gear";

export const helicalGearInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  mn: z.number().min(0.1),
  z1: z.number().int().min(6),
  z2: z.number().int().min(6),
  helixAngle: z.number().min(1).max(45),
  pressureAngle: z.number().min(10).max(30),
  hand: z.enum(["right", "left"]),
  faceWidth: z.number().min(1).optional(),
});

export type HelicalGearInput = z.infer<typeof helicalGearInputSchema>;

export function calculateHelicalGear(input: HelicalGearInput): CalculationResult[] {
  const { unitSystem, mn, z1, z2, helixAngle, pressureAngle, hand, faceWidth } = input;

  const beta = (helixAngle * Math.PI) / 180;
  const phi_n = (pressureAngle * Math.PI) / 180;

  const mt = mn / Math.cos(beta);
  const tan_phi_t = Math.tan(phi_n) / Math.cos(beta);
  const phi_t = Math.atan(tan_phi_t);
  const phi_t_deg = (phi_t * 180) / Math.PI;

  const i = z2 / z1;
  const d1 = mt * z1;
  const d2 = mt * z2;
  const da1 = d1 + 2 * mn;
  const da2 = d2 + 2 * mn;
  const df1 = d1 - 2.5 * mn;
  const df2 = d2 - 2.5 * mn;
  const db1 = d1 * Math.cos(phi_t);
  const db2 = d2 * Math.cos(phi_t);

  const pn = Math.PI * mn;
  const pt = Math.PI * mt;
  const pa = pn / Math.sin(beta);

  const lead1 = Math.PI * d1 / Math.tan(beta);
  const lead2 = Math.PI * d2 / Math.tan(beta);
  const leadAngle1 = 90 - helixAngle;

  const C = mt * (z1 + z2) / 2;

  const zv1 = z1 / Math.pow(Math.cos(beta), 3);
  const zv2 = z2 / Math.pow(Math.cos(beta), 3);

  const F = faceWidth ?? (10 * mn);
  const eps_beta = F * Math.sin(beta) / pn;

  const getCutterNum = (zv: number): string => {
    if (zv >= 135) return "#1 (135 teeth to rack)";
    if (zv >= 55) return "#2 (55-134 teeth)";
    if (zv >= 35) return "#3 (35-54 teeth)";
    if (zv >= 26) return "#4 (26-34 teeth)";
    if (zv >= 21) return "#5 (21-25 teeth)";
    if (zv >= 17) return "#6 (17-20 teeth)";
    if (zv >= 14) return "#7 (14-16 teeth)";
    return "#8 (12-13 teeth)";
  };

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
      label: "Transverse Module",
      symbol: "mt",
      formula: "mn / cos(β)",
      variables: "mn = Normal module, β = Helix angle",
      substitution: `${fmt(mn)} / cos(${helixAngle}°)`,
      value: cv(mt),
      unit: unit,
      note: "Transverse plane module — larger than normal module",
    },
    {
      label: "Transverse Pressure Angle",
      symbol: "φt",
      formula: "arctan(tan(φn) / cos(β))",
      variables: "φn = Normal pressure angle, β = Helix angle",
      substitution: `arctan(tan(${pressureAngle}°) / cos(${helixAngle}°))`,
      value: phi_t_deg,
      unit: "°",
      note: "Always larger than normal pressure angle",
    },
    {
      label: "Pitch Diameter Pinion",
      symbol: "d1",
      formula: "mt × z1",
      variables: "mt = Transverse module, z1 = Pinion teeth",
      substitution: `${fmt(cv(mt))} × ${z1}`,
      value: cv(d1),
      unit,
    },
    {
      label: "Pitch Diameter Gear",
      symbol: "d2",
      formula: "mt × z2",
      variables: "mt = Transverse module, z2 = Gear teeth",
      substitution: `${fmt(cv(mt))} × ${z2}`,
      value: cv(d2),
      unit,
    },
    {
      label: "Outside Diameter Pinion",
      symbol: "da1",
      formula: "d1 + 2mn",
      variables: "d1 = Pitch diameter, mn = Normal module",
      substitution: `${fmt(cv(d1))} + 2 × ${fmt(cv(mn))}`,
      value: cv(da1),
      unit,
    },
    {
      label: "Outside Diameter Gear",
      symbol: "da2",
      formula: "d2 + 2mn",
      variables: "d2 = Pitch diameter, mn = Normal module",
      substitution: `${fmt(cv(d2))} + 2 × ${fmt(cv(mn))}`,
      value: cv(da2),
      unit,
    },
    {
      label: "Root Diameter Pinion",
      symbol: "df1",
      formula: "d1 - 2.5mn",
      variables: "d1 = Pitch diameter, mn = Normal module",
      substitution: `${fmt(cv(d1))} - 2.5 × ${fmt(cv(mn))}`,
      value: cv(df1),
      unit,
    },
    {
      label: "Base Diameter Pinion",
      symbol: "db1",
      formula: "d1 × cos(φt)",
      variables: "d1 = Pitch diameter, φt = Transverse pressure angle",
      substitution: `${fmt(cv(d1))} × cos(${fmt(phi_t_deg, 3)}°)`,
      value: cv(db1),
      unit,
    },
    {
      label: "Base Diameter Gear",
      symbol: "db2",
      formula: "d2 × cos(φt)",
      variables: "d2 = Pitch diameter, φt = Transverse pressure angle",
      substitution: `${fmt(cv(d2))} × cos(${fmt(phi_t_deg, 3)}°)`,
      value: cv(db2),
      unit,
    },
    {
      label: "Normal Circular Pitch",
      symbol: "pn",
      formula: "π × mn",
      variables: "mn = Normal module",
      substitution: `π × ${fmt(cv(mn))}`,
      value: cv(pn),
      unit,
    },
    {
      label: "Transverse Circular Pitch",
      symbol: "pt",
      formula: "π × mt",
      variables: "mt = Transverse module",
      substitution: `π × ${fmt(cv(mt))}`,
      value: cv(pt),
      unit,
    },
    {
      label: "Axial Pitch",
      symbol: "pa",
      formula: "pn / sin(β)",
      variables: "pn = Normal circular pitch, β = Helix angle",
      substitution: `${fmt(cv(pn))} / sin(${helixAngle}°)`,
      value: cv(pa),
      unit,
    },
    {
      label: "Lead (Pinion)",
      symbol: "L1",
      formula: "π × d1 / tan(β)",
      variables: "d1 = Pinion pitch diameter, β = Helix angle",
      substitution: `π × ${fmt(cv(d1))} / tan(${helixAngle}°)`,
      value: cv(lead1),
      unit,
      note: "Axial advance per revolution of pinion",
    },
    {
      label: "Lead (Gear)",
      symbol: "L2",
      formula: "π × d2 / tan(β)",
      variables: "d2 = Gear pitch diameter, β = Helix angle",
      substitution: `π × ${fmt(cv(d2))} / tan(${helixAngle}°)`,
      value: cv(lead2),
      unit,
    },
    {
      label: "Lead Angle",
      symbol: "λ",
      formula: "90° - β",
      variables: "β = Helix angle",
      substitution: `90° - ${helixAngle}°`,
      value: leadAngle1,
      unit: "°",
    },
    {
      label: "Centre Distance",
      symbol: "C",
      formula: "mt(z1+z2)/2",
      variables: "mt = Transverse module, z1, z2 = teeth",
      substitution: `${fmt(cv(mt))}(${z1}+${z2})/2`,
      value: cv(C),
      unit,
    },
    {
      label: "Virtual (Equivalent) Teeth Pinion",
      symbol: "zv1",
      formula: "z1 / cos³(β)",
      variables: "z1 = Pinion teeth, β = Helix angle",
      substitution: `${z1} / cos³(${helixAngle}°)`,
      value: zv1,
      unit: "teeth",
      note: "Used to select gear cutter number",
    },
    {
      label: "Virtual (Equivalent) Teeth Gear",
      symbol: "zv2",
      formula: "z2 / cos³(β)",
      variables: "z2 = Gear teeth, β = Helix angle",
      substitution: `${z2} / cos³(${helixAngle}°)`,
      value: zv2,
      unit: "teeth",
    },
    {
      label: "Overlap Ratio",
      symbol: "εβ",
      formula: "F × sin(β) / (π × mn)",
      variables: `F = Face width (${fmt(cv(F))} ${unit}), β = Helix angle, mn = Normal module`,
      substitution: `${fmt(cv(F))} × sin(${helixAngle}°) / (π × ${fmt(cv(mn))})`,
      value: eps_beta,
      unit: "",
      note: "Should be > 1.0 for smooth helical engagement",
    },
    {
      label: "Cutter Recommendation (Pinion)",
      symbol: "—",
      formula: "Based on virtual teeth zv1",
      variables: `zv1 = ${fmt(zv1, 1)} virtual teeth`,
      substitution: `Select cutter for ${fmt(zv1, 1)} teeth`,
      value: zv1,
      unit: "",
      note: `Cutter ${getCutterNum(zv1)}, Module ${mn} mm`,
    },
    {
      label: "Milling Table Setting",
      symbol: "—",
      formula: "Set helix angle β on dividing head",
      variables: "β = Helix angle",
      substitution: `Table angle = ${helixAngle}°`,
      value: helixAngle,
      unit: "°",
      note: `${hand === "right" ? "Right" : "Left"}-hand helix — set table to ${helixAngle}° in correct direction`,
    },
  ];
}
