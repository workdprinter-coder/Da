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
  addendumFactor: z.number().min(0.1).max(3),
  dedendumFactor: z.number().min(0.1).max(3),
});

export type HelicalGearInput = z.infer<typeof helicalGearInputSchema>;

export function calculateHelicalGear(input: HelicalGearInput): CalculationResult[] {
  const { unitSystem, mn, z1, z2, helixAngle, pressureAngle, hand, faceWidth, addendumFactor, dedendumFactor } = input;

  const beta = (helixAngle * Math.PI) / 180;
  const phi_n = (pressureAngle * Math.PI) / 180;

  const mt = mn / Math.cos(beta);
  const tan_phi_t = Math.tan(phi_n) / Math.cos(beta);
  const phi_t = Math.atan(tan_phi_t);
  const phi_t_deg = (phi_t * 180) / Math.PI;

  const i = z2 / z1;
  const d1 = mt * z1;
  const d2 = mt * z2;

  // Tooth proportions (normal plane)
  const a = addendumFactor * mn;
  const b = dedendumFactor * mn;
  const h = a + b;
  const hw = 2 * a;
  const hc = h;

  const da1 = d1 + 2 * a;
  const da2 = d2 + 2 * a;
  const df1 = d1 - 2 * b;
  const df2 = d2 - 2 * b;
  const db1 = d1 * Math.cos(phi_t);
  const db2 = d2 * Math.cos(phi_t);

  // Pitches
  const pn = Math.PI * mn;              // normal circular pitch
  const pt = Math.PI * mt;             // transverse circular pitch
  const pa = pn / Math.sin(beta);      // axial pitch

  // Lead
  const lead1 = Math.PI * d1 / Math.tan(beta);   // = z1 × pa
  const lead2 = Math.PI * d2 / Math.tan(beta);

  const C = mt * (z1 + z2) / 2;

  // Virtual (equivalent) teeth
  const zv1 = z1 / Math.pow(Math.cos(beta), 3);
  const zv2 = z2 / Math.pow(Math.cos(beta), 3);

  const F = faceWidth ?? (10 * mn);
  const eps_beta = F * Math.sin(beta) / pn;

  // Tooth thickness (normal plane, at pitch cylinder)
  const tn = pn / 2;   // normal tooth thickness = π×mn/2
  const tt = pt / 2;   // transverse tooth thickness = π×mt/2

  const getCutterNum = (zv: number): string => {
    if (zv >= 135) return "#1 (135 teeth to rack)";
    if (zv >= 55) return "#2 (55–134 teeth)";
    if (zv >= 35) return "#3 (35–54 teeth)";
    if (zv >= 26) return "#4 (26–34 teeth)";
    if (zv >= 21) return "#5 (21–25 teeth)";
    if (zv >= 17) return "#6 (17–20 teeth)";
    if (zv >= 14) return "#7 (14–16 teeth)";
    return "#8 (12–13 teeth)";
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
      label: "Normal Module",
      symbol: "mn",
      formula: "User input",
      variables: "mn = Normal module (in normal cross-section plane)",
      substitution: fmt(cv(mn)),
      value: cv(mn),
      unit,
      note: "This is the standard module used to select the hob/cutter",
    },
    {
      label: "Transverse Module",
      symbol: "mt",
      formula: "mn / cos(β)",
      variables: "mn = Normal module, β = Helix angle",
      substitution: `${fmt(cv(mn))} / cos(${helixAngle}°)`,
      value: cv(mt),
      unit,
      note: "Transverse plane module — always larger than normal module",
    },
    {
      label: "Helix Angle",
      symbol: "β",
      formula: "User input",
      variables: `β = ${helixAngle}°, Hand = ${hand === "right" ? "Right (RH)" : "Left (LH)"}`,
      substitution: `${helixAngle}°`,
      value: helixAngle,
      unit: "°",
      note: `${hand === "right" ? "RH" : "LH"} helix — mating gear must be opposite hand for parallel axis`,
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
      label: "Pitch Diameter — Pinion",
      symbol: "d1",
      formula: "mt × z1",
      variables: "mt = Transverse module, z1 = Pinion teeth",
      substitution: `${fmt(cv(mt))} × ${z1}`,
      value: cv(d1),
      unit,
    },
    {
      label: "Pitch Diameter — Gear",
      symbol: "d2",
      formula: "mt × z2",
      variables: "mt = Transverse module, z2 = Gear teeth",
      substitution: `${fmt(cv(mt))} × ${z2}`,
      value: cv(d2),
      unit,
    },
    {
      label: "Addendum",
      symbol: "a",
      formula: "ha × mn",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), mn = Normal module`,
      substitution: `${fmt(addendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(a),
      unit,
      note: "Tooth height above pitch cylinder — measured in normal plane",
    },
    {
      label: "Dedendum",
      symbol: "b",
      formula: "hf × mn",
      variables: `hf = Dedendum factor (${fmt(dedendumFactor)}), mn = Normal module`,
      substitution: `${fmt(dedendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(b),
      unit,
    },
    {
      label: "Whole Depth",
      symbol: "h",
      formula: "(ha + hf) × mn",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, mn = Normal module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(mn))}`,
      value: cv(h),
      unit,
    },
    {
      label: "Working Depth",
      symbol: "hw",
      formula: "2 × ha × mn",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), mn = Normal module`,
      substitution: `2 × ${fmt(addendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(hw),
      unit,
    },
    {
      label: "Depth of Cut",
      symbol: "hc",
      formula: "(ha + hf) × mn",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, mn = Normal module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(mn))}`,
      value: cv(hc),
      unit,
      note: "Hob / cutter depth setting = whole depth",
    },
    {
      label: "Outside Diameter — Pinion",
      symbol: "da1",
      formula: "d1 + 2 × ha × mn",
      variables: `d1 = Pitch diameter, ha = ${fmt(addendumFactor)}, mn = Normal module`,
      substitution: `${fmt(cv(d1))} + 2 × ${fmt(addendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(da1),
      unit,
    },
    {
      label: "Outside Diameter — Gear",
      symbol: "da2",
      formula: "d2 + 2 × ha × mn",
      variables: `d2 = Pitch diameter, ha = ${fmt(addendumFactor)}, mn = Normal module`,
      substitution: `${fmt(cv(d2))} + 2 × ${fmt(addendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(da2),
      unit,
    },
    {
      label: "Root Diameter — Pinion",
      symbol: "df1",
      formula: "d1 − 2 × hf × mn",
      variables: `d1 = Pitch diameter, hf = ${fmt(dedendumFactor)}, mn = Normal module`,
      substitution: `${fmt(cv(d1))} − 2 × ${fmt(dedendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(df1),
      unit,
    },
    {
      label: "Root Diameter — Gear",
      symbol: "df2",
      formula: "d2 − 2 × hf × mn",
      variables: `d2 = Pitch diameter, hf = ${fmt(dedendumFactor)}, mn = Normal module`,
      substitution: `${fmt(cv(d2))} − 2 × ${fmt(dedendumFactor)} × ${fmt(cv(mn))}`,
      value: cv(df2),
      unit,
    },
    {
      label: "Base Diameter — Pinion",
      symbol: "db1",
      formula: "d1 × cos(φt)",
      variables: "d1 = Pitch diameter, φt = Transverse pressure angle",
      substitution: `${fmt(cv(d1))} × cos(${fmt(phi_t_deg, 3)}°)`,
      value: cv(db1),
      unit,
    },
    {
      label: "Base Diameter — Gear",
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
      label: "Normal Tooth Thickness",
      symbol: "tn",
      formula: "π × mn / 2",
      variables: "mn = Normal module (standard, no profile shift)",
      substitution: `π × ${fmt(cv(mn))} / 2`,
      value: cv(tn),
      unit,
      note: "Tooth thickness at pitch cylinder, measured in normal cross-section",
    },
    {
      label: "Transverse Tooth Thickness",
      symbol: "tt",
      formula: "π × mt / 2",
      variables: "mt = Transverse module",
      substitution: `π × ${fmt(cv(mt))} / 2`,
      value: cv(tt),
      unit,
      note: "Tooth thickness at pitch cylinder, measured in transverse cross-section",
    },
    {
      label: "Lead — Pinion",
      symbol: "L1",
      formula: "π × d1 / tan(β)",
      variables: "d1 = Pinion pitch diameter, β = Helix angle",
      substitution: `π × ${fmt(cv(d1))} / tan(${helixAngle}°)`,
      value: cv(lead1),
      unit,
      note: `Lead = ${fmt(cv(lead1), 4)} ${unit}. Also = z1 × pa = ${z1} × ${fmt(cv(pa), 4)} = ${fmt(cv(z1 * pa), 4)} ${unit}`,
      green: true,
    },
    {
      label: "Lead — Gear",
      symbol: "L2",
      formula: "π × d2 / tan(β)",
      variables: "d2 = Gear pitch diameter, β = Helix angle",
      substitution: `π × ${fmt(cv(d2))} / tan(${helixAngle}°)`,
      value: cv(lead2),
      unit,
      note: `Also = z2 × pa = ${z2} × ${fmt(cv(pa), 4)} = ${fmt(cv(z2 * pa), 4)} ${unit}`,
    },
    {
      label: "Centre Distance",
      symbol: "C",
      formula: "mt(z1+z2) / 2",
      variables: "mt = Transverse module, z1, z2 = teeth",
      substitution: `${fmt(cv(mt))}(${z1}+${z2})/2`,
      value: cv(C),
      unit,
    },
    {
      label: "Virtual Teeth — Pinion",
      symbol: "zv1",
      formula: "z1 / cos³(β)",
      variables: "z1 = Pinion teeth, β = Helix angle",
      substitution: `${z1} / cos³(${helixAngle}°)`,
      value: zv1,
      unit: "teeth",
      note: "Used to select gear cutter number",
    },
    {
      label: "Virtual Teeth — Gear",
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
      warning: eps_beta < 1.0,
      note: eps_beta < 1.0 ? "εβ < 1.0 — helical action incomplete; increase face width or helix angle" : "Acceptable helical overlap",
    },
    {
      label: "Cutter Recommendation — Pinion",
      symbol: "—",
      formula: "Based on virtual teeth zv1",
      variables: `zv1 = ${fmt(zv1, 1)} virtual teeth`,
      substitution: `Select cutter for ${fmt(zv1, 1)} teeth`,
      value: zv1,
      unit: "",
      note: `${getCutterNum(zv1)}, Module mn = ${mn} mm, Normal PA ${pressureAngle}°`,
    },
    {
      label: "Milling Table Setting",
      symbol: "—",
      formula: "Set helix angle β on dividing head / table",
      variables: "β = Helix angle",
      substitution: `Table angle = ${helixAngle}°`,
      value: helixAngle,
      unit: "°",
      note: `${hand === "right" ? "Right" : "Left"}-hand helix — set milling table to ${helixAngle}° in correct rotation direction`,
    },
  ];
}
