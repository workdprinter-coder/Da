import { z } from "zod";
import type { CalculationResult } from "./spur-gear";

export const wormGearInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  m: z.number().min(0.1),
  z1: z.number().int().min(1).max(6),
  z2: z.number().int().min(10),
  pressureAngle: z.number().min(14.5).max(30),
  q: z.number().min(6).max(25).optional(),
  addendumFactor: z.number().min(0.1).max(3),
  dedendumFactor: z.number().min(0.1).max(3),
});

export type WormGearInput = z.infer<typeof wormGearInputSchema>;

export function calculateWormGear(input: WormGearInput): CalculationResult[] {
  const { unitSystem, m, z1, z2, pressureAngle, q: qInput, addendumFactor, dedendumFactor } = input;

  const q = qInput ?? 10;
  const phi = (pressureAngle * Math.PI) / 180;

  const i = z2 / z1;
  const px = Math.PI * m;               // axial pitch (= circular pitch of worm wheel)
  const lead = z1 * px;                 // worm lead

  const d1 = q * m;                    // worm pitch diameter
  const gamma = Math.atan(z1 / q);     // lead angle
  const gamma_deg = (gamma * 180) / Math.PI;
  const lambda_deg = 90 - gamma_deg;   // worm helix angle (from transverse plane)

  // Tooth proportions
  const a = addendumFactor * m;
  const b = dedendumFactor * m;
  const h = a + b;
  const hw = 2 * a;
  const hc = h;

  // Worm dimensions
  const da1 = d1 + 2 * a;             // worm major (outside) diameter
  const df1 = d1 - 2 * b;             // worm minor (root) diameter

  // Worm wheel dimensions
  const d2 = m * z2;                   // pitch diameter
  const da2 = d2 + 2 * a;             // outside diameter
  const df2 = d2 - 2 * b;             // root diameter
  const dt2 = da2;                     // throat diameter = outside (for wheel with concave profile)

  // Centre distance
  const C = (d1 + d2) / 2;

  // Axial and circular pitch
  const cp = Math.PI * m;              // circular pitch of wheel = axial pitch of worm
  const normal_pitch = px * Math.cos(gamma);

  // Face widths
  const b1_min = 11 * m;              // worm min face width
  const b2_rec = Math.min(0.75 * da1, 0.5 * d1 + 4 * m); // wheel recommended face width

  // Tooth thicknesses
  const ta = (Math.PI * m) / 2;       // axial tooth thickness of worm (at pitch cylinder)
  const tn_wheel = (Math.PI * m * Math.cos(gamma)) / 2; // normal tooth thickness of worm wheel

  // Efficiency (sliding friction model)
  const mu_low = 0.05;
  const mu_high = 0.10;
  const rho_low = Math.atan(mu_low / Math.cos(phi));
  const rho_high = Math.atan(mu_high / Math.cos(phi));
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
      label: "Circular Pitch (Worm Wheel)",
      symbol: "p",
      formula: "π × m",
      variables: "m = Module (= worm axial pitch)",
      substitution: `π × ${fmt(cv(m))}`,
      value: cv(cp),
      unit,
      note: "Wheel circular pitch must equal worm axial pitch for correct mesh",
    },
    {
      label: "Normal Pitch",
      symbol: "pn",
      formula: "px × cos(γ)",
      variables: "px = Axial pitch, γ = Lead angle",
      substitution: `${fmt(cv(px))} × cos(${fmt(gamma_deg, 3)}°)`,
      value: cv(normal_pitch),
      unit,
    },
    {
      label: "Worm Lead",
      symbol: "L",
      formula: "z1 × px = z1 × π × m",
      variables: "z1 = Number of starts, px = Axial pitch, m = Axial module",
      substitution: `${z1} × π × ${fmt(cv(m))} = ${z1} × ${fmt(cv(px))}`,
      value: cv(lead),
      unit,
      note: `Lead = ${fmt(cv(lead), 4)} ${unit} — axial advance per revolution of worm`,
      green: true,
    },
    {
      label: "Worm Diameter Factor",
      symbol: "q",
      formula: "d1 / m",
      variables: "d1 = Worm pitch diameter, m = module",
      substitution: `${q}`,
      value: q,
      unit: "",
      note: "Standard values: 6.3, 8, 10, 12.5, 16, 20. Recommended: q = 10",
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
      note: gamma_deg < 5 ? "γ < 5° — self-locking under most conditions" : "Gear set may not be self-locking",
    },
    {
      label: "Worm Helix Angle",
      symbol: "λ",
      formula: "90° − γ",
      variables: "γ = Worm lead angle",
      substitution: `90° − ${fmt(gamma_deg, 3)}°`,
      value: lambda_deg,
      unit: "°",
      note: "Worm helix angle from transverse plane. Worm wheel helix angle = lead angle γ.",
    },
    {
      label: "Worm Wheel Helix Angle",
      symbol: "β2",
      formula: "= γ (worm lead angle)",
      variables: "For 90° shaft angle, wheel helix angle equals worm lead angle",
      substitution: `β2 = γ = ${fmt(gamma_deg, 3)}°`,
      value: gamma_deg,
      unit: "°",
      note: "Worm wheel helix angle must equal worm lead angle for correct mesh at 90° shaft angle",
    },
    {
      label: "Addendum",
      symbol: "a",
      formula: "ha × m",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), m = Axial module`,
      substitution: `${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(a),
      unit,
    },
    {
      label: "Dedendum",
      symbol: "b",
      formula: "hf × m",
      variables: `hf = Dedendum factor (${fmt(dedendumFactor)}), m = Axial module`,
      substitution: `${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(b),
      unit,
    },
    {
      label: "Whole Depth",
      symbol: "h",
      formula: "(ha + hf) × m",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, m = Axial module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(m))}`,
      value: cv(h),
      unit,
    },
    {
      label: "Working Depth",
      symbol: "hw",
      formula: "2 × ha × m",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), m = Axial module`,
      substitution: `2 × ${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(hw),
      unit,
    },
    {
      label: "Depth of Cut",
      symbol: "hc",
      formula: "(ha + hf) × m",
      variables: `ha = ${fmt(addendumFactor)}, hf = ${fmt(dedendumFactor)}, m = Axial module`,
      substitution: `(${fmt(addendumFactor)} + ${fmt(dedendumFactor)}) × ${fmt(cv(m))}`,
      value: cv(hc),
      unit,
      note: "Tool depth setting = whole depth",
    },
    {
      label: "Worm Major (Outside) Diameter",
      symbol: "da1",
      formula: "d1 + 2 × ha × m",
      variables: `d1 = Worm pitch diam, ha = ${fmt(addendumFactor)}, m = module`,
      substitution: `${fmt(cv(d1))} + 2 × ${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(da1),
      unit,
      note: "Also known as outside diameter or tip diameter",
    },
    {
      label: "Worm Minor (Root) Diameter",
      symbol: "df1",
      formula: "d1 − 2 × hf × m",
      variables: `d1 = Worm pitch diam, hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `${fmt(cv(d1))} − 2 × ${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(df1),
      unit,
      note: "Also known as root diameter or minor diameter",
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
      label: "Worm Wheel Outside (Major) Diameter",
      symbol: "da2",
      formula: "d2 + 2 × ha × m",
      variables: `d2 = Wheel pitch diam, ha = ${fmt(addendumFactor)}, m = module`,
      substitution: `${fmt(cv(d2))} + 2 × ${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(da2),
      unit,
    },
    {
      label: "Worm Wheel Root (Minor) Diameter",
      symbol: "df2",
      formula: "d2 − 2 × hf × m",
      variables: `d2 = Wheel pitch diam, hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `${fmt(cv(d2))} − 2 × ${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(df2),
      unit,
    },
    {
      label: "Worm Wheel Throat Diameter",
      symbol: "dt2",
      formula: "da2 (for standard concave face form)",
      variables: "da2 = Wheel outside diameter",
      substitution: fmt(cv(dt2)),
      value: cv(dt2),
      unit,
      note: "Throat diameter at narrowest point of wheel face — sets hob OD for generating",
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
      label: "Axial Tooth Thickness (Worm)",
      symbol: "ta",
      formula: "π × m / 2",
      variables: "m = Axial module",
      substitution: `π × ${fmt(cv(m))} / 2`,
      value: cv(ta),
      unit,
      note: "Theoretical axial tooth thickness at pitch cylinder",
    },
    {
      label: "Normal Tooth Thickness (Wheel)",
      symbol: "tn",
      formula: "π × m × cos(γ) / 2",
      variables: "m = module, γ = Lead angle",
      substitution: `π × ${fmt(cv(m))} × cos(${fmt(gamma_deg, 3)}°) / 2`,
      value: cv(tn_wheel),
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
      formula: "min(0.75 × da1, 0.5 × d1 + 4m)",
      variables: "da1 = Worm OD, d1 = Worm PD, m = module",
      substitution: `min(0.75×${fmt(cv(da1))}, 0.5×${fmt(cv(d1))}+4×${fmt(cv(m))})`,
      value: cv(b2_rec),
      unit,
    },
    {
      label: "Efficiency (μ = 0.05)",
      symbol: "η",
      formula: "tan(γ) / tan(γ + ρ′)",
      variables: "γ = Lead angle, ρ′ = arctan(μ/cos(φ)), φ = pressure angle",
      substitution: `tan(${fmt(gamma_deg, 3)}°) / tan(${fmt(gamma_deg, 3)}° + arctan(0.05/cos(${pressureAngle}°)))`,
      value: eta_low,
      unit: "%",
      note: "Approximate; hardened steel worm, phosphor bronze wheel, good lubrication",
    },
    {
      label: "Efficiency (μ = 0.10)",
      symbol: "η",
      formula: "tan(γ) / tan(γ + ρ′)",
      variables: "γ = Lead angle, ρ′ = arctan(μ/cos(φ))",
      substitution: `tan(${fmt(gamma_deg, 3)}°) / tan(${fmt(gamma_deg, 3)}° + arctan(0.10/cos(${pressureAngle}°)))`,
      value: eta_high,
      unit: "%",
      note: "Approximate; moderate lubrication or cast iron wheel",
    },
    {
      label: "Cutter (Hob) Recommendation",
      symbol: "—",
      formula: "Hob matching worm profile",
      variables: "m = module, φ = pressure angle",
      substitution: `Module ${m} mm, PA ${pressureAngle}°`,
      value: m,
      unit: "",
      note: `Module ${m} mm hob, pressure angle ${pressureAngle}°. Hob pitch diameter ≈ worm pitch diameter (${fmt(cv(d1))} ${unit}) for generating worm wheel`,
    },
    {
      label: "Milling Table Setting (Worm)",
      symbol: "—",
      formula: "Table tilted to worm lead angle γ",
      variables: "γ = Worm lead angle",
      substitution: `Table angle = ${fmt(gamma_deg, 3)}°`,
      value: gamma_deg,
      unit: "°",
      note: "For milling worm thread: set milling table to lead angle. Depth of cut = whole depth = " + fmt(cv(hc), 4) + " " + unit,
    },
  ];
}
