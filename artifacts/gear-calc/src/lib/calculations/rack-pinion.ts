import { z } from "zod";
import type { CalculationResult } from "./spur-gear";

export const rackPinionInputSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  m: z.number().min(0.1),
  z: z.number().int().min(6),
  pressureAngle: z.number().min(14.5).max(30),
  faceWidth: z.number().min(1),
  rackLength: z.number().min(1),
  addendumFactor: z.number().min(0.1).max(3),
  dedendumFactor: z.number().min(0.1).max(3),
});

export type RackPinionInput = z.infer<typeof rackPinionInputSchema>;

export function calculateRackPinion(input: RackPinionInput): CalculationResult[] {
  const { unitSystem, m, z, pressureAngle, faceWidth, rackLength, addendumFactor, dedendumFactor } = input;

  const phi = (pressureAngle * Math.PI) / 180;

  // Pinion geometry
  const d = m * z;                     // pitch diameter
  const a = addendumFactor * m;        // addendum
  const b = dedendumFactor * m;        // dedendum
  const h = a + b;                     // whole depth
  const hw = 2 * a;                    // working depth
  const da = d + 2 * a;               // outside diameter
  const df = d - 2 * b;               // root diameter
  const db = d * Math.cos(phi);       // base diameter

  // Circular pitch and tooth thickness
  const p = Math.PI * m;               // circular pitch
  const t = p / 2;                     // tooth thickness at pitch line

  // Rack geometry
  const rack_addendum = a;             // rack addendum = pinion addendum (standard mesh)
  const rack_dedendum = b;             // rack dedendum = pinion dedendum
  const rack_pitch = p;                // rack tooth pitch = circular pitch
  const n_rack_teeth = Math.floor(rackLength / rack_pitch);

  // Motion
  const travel_per_rev = Math.PI * d;  // linear travel per pinion revolution
  const travel_per_tooth = rack_pitch; // linear travel per pinion tooth

  // Speed ratio (pinion RPM to rack linear speed relation)
  const pitch_line_velocity_factor = Math.PI * d; // mm per revolution at any speed

  // Recommended blank
  const blank_dia = da + 2 * m;        // recommended rough blank (add finishing stock)
  const blank_hub_max = df * 0.6;      // approximate max hub diameter (60% of root diam)

  const isImperial = unitSystem === "imperial";
  const unit = isImperial ? "in" : "mm";
  const cv = (val: number) => (isImperial ? val / 25.4 : val);
  const fmt = (n: number, d = 4) => n.toFixed(d);

  return [
    {
      label: "Pinion Pitch Diameter",
      symbol: "d",
      formula: "m × z",
      variables: "m = module, z = Pinion teeth",
      substitution: `${fmt(cv(m))} × ${z}`,
      value: cv(d),
      unit,
    },
    {
      label: "Addendum",
      symbol: "a",
      formula: "ha × m",
      variables: `ha = Addendum factor (${fmt(addendumFactor)}), m = module`,
      substitution: `${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(a),
      unit,
    },
    {
      label: "Dedendum",
      symbol: "b",
      formula: "hf × m",
      variables: `hf = Dedendum factor (${fmt(dedendumFactor)}), m = module`,
      substitution: `${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(b),
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
      label: "Outside Diameter (Pinion)",
      symbol: "da",
      formula: "d + 2 × ha × m",
      variables: "d = Pitch diameter, ha = Addendum factor, m = module",
      substitution: `${fmt(cv(d))} + 2 × ${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(da),
      unit,
    },
    {
      label: "Root Diameter (Pinion)",
      symbol: "df",
      formula: "d − 2 × hf × m",
      variables: "d = Pitch diameter, hf = Dedendum factor, m = module",
      substitution: `${fmt(cv(d))} − 2 × ${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(df),
      unit,
    },
    {
      label: "Base Diameter (Pinion)",
      symbol: "db",
      formula: "d × cos(φ)",
      variables: "d = Pitch diameter, φ = Pressure angle",
      substitution: `${fmt(cv(d))} × cos(${pressureAngle}°)`,
      value: cv(db),
      unit,
    },
    {
      label: "Circular Pitch",
      symbol: "p",
      formula: "π × m",
      variables: "m = module",
      substitution: `π × ${fmt(cv(m))}`,
      value: cv(p),
      unit,
      note: "Also equals the rack tooth pitch",
    },
    {
      label: "Tooth Thickness at Pitch Line",
      symbol: "t",
      formula: "π × m / 2",
      variables: "m = module (standard, no profile shift)",
      substitution: `π × ${fmt(cv(m))} / 2`,
      value: cv(t),
      unit,
    },
    {
      label: "Rack Tooth Pitch",
      symbol: "pr",
      formula: "π × m",
      variables: "m = module (equals circular pitch)",
      substitution: `π × ${fmt(cv(m))}`,
      value: cv(rack_pitch),
      unit,
    },
    {
      label: "Rack Addendum",
      symbol: "ar",
      formula: "ha × m",
      variables: `ha = ${fmt(addendumFactor)}, m = module`,
      substitution: `${fmt(addendumFactor)} × ${fmt(cv(m))}`,
      value: cv(rack_addendum),
      unit,
      note: "Rack tooth height above pitch line",
    },
    {
      label: "Rack Dedendum",
      symbol: "br",
      formula: "hf × m",
      variables: `hf = ${fmt(dedendumFactor)}, m = module`,
      substitution: `${fmt(dedendumFactor)} × ${fmt(cv(m))}`,
      value: cv(rack_dedendum),
      unit,
      note: "Rack tooth depth below pitch line",
    },
    {
      label: "Number of Rack Teeth",
      symbol: "Nr",
      formula: "⌊Rack Length / Pitch⌋",
      variables: `Rack length = ${fmt(cv(rackLength))} ${unit}, pitch = ${fmt(cv(rack_pitch))} ${unit}`,
      substitution: `⌊${fmt(cv(rackLength))} / ${fmt(cv(rack_pitch))}⌋`,
      value: n_rack_teeth,
      unit: "teeth",
      note: `Full teeth fitting in rack length of ${fmt(cv(rackLength))} ${unit}`,
    },
    {
      label: "Linear Travel per Revolution",
      symbol: "vrev",
      formula: "π × d",
      variables: "d = Pinion pitch diameter",
      substitution: `π × ${fmt(cv(d))}`,
      value: cv(travel_per_rev),
      unit,
      note: "Rack travel for one full pinion revolution",
    },
    {
      label: "Linear Travel per Tooth",
      symbol: "vt",
      formula: "π × m",
      variables: "m = module (= rack tooth pitch)",
      substitution: `π × ${fmt(cv(m))}`,
      value: cv(travel_per_tooth),
      unit,
      note: "Rack advances one circular pitch per pinion tooth",
    },
    {
      label: "Pitch Line Velocity Factor",
      symbol: "—",
      formula: "π × d [mm/rev]",
      variables: "d = Pinion pitch diameter",
      substitution: `π × ${fmt(cv(d))}`,
      value: cv(pitch_line_velocity_factor),
      unit,
      note: `At 1 RPM → rack travels ${fmt(cv(pitch_line_velocity_factor), 3)} ${unit}/min. Scale linearly with RPM.`,
    },
    {
      label: "Gear Ratio",
      symbol: "i",
      formula: "Rack = infinite teeth (linear motion)",
      variables: "Effective ratio depends on application speed",
      substitution: "∞",
      value: 0,
      unit: "",
      note: `Pinion z = ${z} teeth; rack treated as infinite teeth. Speed ratio = rack velocity / pinion RPM`,
    },
    {
      label: "Blank Diameter (Pinion)",
      symbol: "db_blank",
      formula: "da + 2m (rough stock allowance)",
      variables: "da = Outside diameter, m = module",
      substitution: `${fmt(cv(da))} + 2 × ${fmt(cv(m))}`,
      value: cv(blank_dia),
      unit,
      note: "Recommended rough blank. Finish to da after hobbing/gear cutting.",
    },
    {
      label: "Max Hub Bore (Approx)",
      symbol: "dh",
      formula: "≈ 0.6 × df",
      variables: "df = Root diameter",
      substitution: `0.6 × ${fmt(cv(df))}`,
      value: cv(blank_hub_max),
      unit,
      note: "Approximate maximum hub bore — verify with stress analysis for application",
    },
    {
      label: "Face Width",
      symbol: "b",
      formula: "User input",
      variables: `b = ${fmt(cv(faceWidth))} ${unit} — recommended: 8m to 16m`,
      substitution: fmt(cv(faceWidth)),
      value: cv(faceWidth),
      unit,
      warning: faceWidth < 8 * m || faceWidth > 20 * m,
      note:
        faceWidth < 8 * m
          ? `Face width < 8m (${fmt(cv(8 * m))} ${unit}) — consider increasing`
          : faceWidth > 20 * m
          ? `Face width > 20m — may cause load distribution problems`
          : `Acceptable — ratio b/m = ${fmt(faceWidth / m, 2)}`,
    },
  ];
}
