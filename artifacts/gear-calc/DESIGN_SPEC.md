# Industrial Gear Engineering Calculator — Design Spec

## Product Identity
Professional engineering software for mechanical engineers, gear manufacturers, CNC programmers, and workshop machinists. Feels like mission-critical industrial software — dense with data but impeccably organised, like the control panel of a precision machine tool. Confident, technical, and trustworthy — every number displayed is correct and you can see why.

## Vibe
Dark by default. Feels like high-end CAD software or a CNC control panel: steel-grey tones with sharp cyan/amber accent highlights. Information-dense but never cluttered. Precision typography for numbers — use monospace font for all calculated output values. Prioritise clarity and information density. Make a bold, deliberate color choice that someone would remember.

---

## Pages & Routes

### `/` — Home Dashboard
Overview showing all 4 calculator modules as cards, quick-access recent calculations (persisted in localStorage), unit system selector (Metric/Imperial), app info and engineering references.

### `/spur-gear` — Spur Gear Pair Calculator

**Inputs (minimum required):**
- Toggle: Module (m) or Diametral Pitch (DP) mode
- Module (m) or DP value
- Pinion Teeth (z1)
- Gear Teeth (z2)
- Pressure Angle (φ) — default 20°

**Auto-calculated outputs — show ALL with formula, variable definitions, substitution, result, units, and engineering note:**
- Gear Ratio: i = z2/z1
- Pitch Diameter Pinion: d1 = m × z1 (or d1 = z1/DP × 25.4)
- Pitch Diameter Gear: d2 = m × z2
- Outside Diameter: da = d + 2m
- Root Diameter: df = d - 2.5m (clearance = 0.25m)
- Base Diameter: db = d × cos(φ)
- Circular Pitch: p = π × m
- Tooth Thickness at pitch circle: t = π × m / 2
- Addendum: a = 1.0 × m
- Dedendum: b = 1.25 × m
- Whole Depth: h = 2.25 × m
- Working Depth: hw = 2.0 × m
- Centre Distance: C = m(z1+z2)/2
- Contact Ratio: εα = [sqrt(ra1²-rb1²) + sqrt(ra2²-rb2²) - C×sin(φ)] / (π×m×cos(φ))
- Span Measurement (number of teeth k): W = m × cos(φ) × [π(k-0.5) + z × inv(φ)] where inv(φ) = tan(φ) - φ(rad)
- Tip relief recommendation text

Display pattern for each result:
1. Formula row (e.g. "da = d + 2m")  
2. Variables row (e.g. "da = outside diameter, d = pitch diameter, m = module")
3. Substitution row (e.g. "da = 50.000 + 2 × 2.000")
4. Result row bold (e.g. "da = 54.0000 mm")
5. Engineering note if applicable

Show input validation errors: z < 12 teeth warning, φ outside 14.5–25° warning.

---

### `/helical-gear` — Helical Gear Pair Calculator

**Inputs:**
- Normal Module (mn) — metric; or Normal DP
- Pinion Teeth (z1), Gear Teeth (z2)
- Helix Angle (β) — degrees, typically 15–35°
- Normal Pressure Angle (φn) — default 20°
- Hand of helix: Left / Right

**Auto-calculated:**
- Gear Ratio: i = z2/z1
- Transverse Module: mt = mn / cos(β)
- Transverse Pressure Angle: tan(φt) = tan(φn) / cos(β)
- Pitch Diameter: d = mt × z = mn × z / cos(β)
- Outside Diameter: da = d + 2mn
- Root Diameter: df = d - 2.5mn
- Base Diameter: db = d × cos(φt)
- Normal Circular Pitch: pn = π × mn
- Transverse Circular Pitch: pt = π × mt
- Lead: L = π × d / tan(β)
- Lead Angle: λ = arctan(π × d / L) = 90° - β
- Centre Distance: C = mt(z1+z2)/2
- Normal Tooth Thickness: tn = π × mn / 2
- Transverse Tooth Thickness: tt = π × mt / 2
- Equivalent Number of Teeth (virtual spur): zv = z / cos³(β)
- Overlap Ratio: εβ = F × sin(β) / (π × mn)
- Axial Pitch: pa = pn / sin(β) = π × mn / sin(β)
- Cutter Recommendation: Based on zv — show standard cutter number from the series (Cutter #1: 135+, #2: 55–134, #3: 35–54, #4: 26–34, #5: 21–25, #6: 17–20, #7: 14–16, #8: 12–13)
- Milling Table Setting: helix angle β to set on universal dividing head/milling machine
- Mating hand: "Left hand pinion meshes with right hand gear on parallel axes"

---

### `/worm-gear` — Worm & Worm Wheel Calculator

**Inputs:**
- Axial Module (m)
- Number of Worm Starts (z1): 1, 2, 3, or 4
- Number of Worm Wheel Teeth (z2)
- Pressure Angle (φ): default 20°
- Worm Reference Diameter (d1): optional — suggest d1 = q × m where q is from standard series (6.3, 8, 10, 12.5, 16, 20), recommend q=10 if blank

**Auto-calculated:**
- Gear Ratio: i = z2/z1 (exact ratio)
- Axial Pitch (worm): px = π × m
- Lead: L = z1 × px = z1 × π × m
- Lead Angle: γ = arctan(L / (π × d1)) = arctan(z1 / q)
- Helix Angle of Worm Wheel: β = 90° - γ
- Worm Pitch Diameter: d1 = q × m
- Worm Outside Diameter: da1 = d1 + 2m
- Worm Root Diameter: df1 = d1 - 2.5m
- Worm Throat Radius: rf1 = m × (q/2 - 1.25) [root]
- Worm Wheel Pitch Diameter: d2 = m × z2
- Worm Wheel Outside/Tip Diameter: da2 = d2 + 2m
- Worm Wheel Root Diameter: df2 = d2 - 2.5m
- Worm Wheel Throat Diameter: dt = da2 (throat = tip for worm wheel)
- Centre Distance: C = m(q + z2)/2 = (d1 + d2)/2
- Worm Face Width (recommended): b1 ≥ 11m
- Worm Wheel Face Width: b2 = min(0.75 × da1, ...)
- Axial Tooth Thickness (worm): ta = π × m / 2
- Efficiency (approx): η ≈ tan(γ) / tan(γ + ρ) where ρ = friction angle (show for μ=0.05 and μ=0.1)
- Cutter Recommendation: "Use a hob cutter with same module m and pressure angle φ; hob OD should match worm pitch diameter"
- Milling Table Setting: Set milling table to lead angle γ

---

### `/spiral-bevel` — Spiral Bevel Gear Calculator

**Inputs:**
- Normal Module at mid-face (mn)
- Pinion Teeth (z1), Gear Teeth (z2)
- Shaft Angle (Σ): default 90°
- Mean Spiral Angle (β): default 35°
- Normal Pressure Angle (φn): default 20°
- Face Width (F): default = Re/3

**Auto-calculated (for 90° shaft angle):**
- Gear Ratio: i = z2/z1
- Pitch Cone Angles: δ2 = arctan(z2/z1), δ1 = 90° - δ2
- Mean Cone Distance: Rm = mn × z2 / (2 × sin(δ2)) - F/2
- Outer Cone Distance: Re = Rm + F/2
- Mean Module: mm = mn (note: mn is specified at mid-face)
- Mean Pitch Diameters: dm1 = mm × z1, dm2 = mm × z2
- Outer Pitch Diameters: de1 = 2 × Re × sin(δ1), de2 = 2 × Re × sin(δ2)
- Addendum (outer, pinion): ae1 = mn × (1 + 0.1)  [Gleason unequal-depth; simplified: ae1 = 0.54mn for ratio]
  Note: For simplified calcs use equal-depth: ae1 = ae2 = mn
- Dedendum (outer): be = 1.25 × mn
- Outside Diameters: dae1 = de1 + 2ae1 × cos(δ1), dae2 = de2 + 2ae2 × cos(δ2)
- Root Diameters: dfe1 = de1 - 2be × cos(δ1), dfe2 = de2 - 2be × cos(δ2)
- Face Angle: δf1 = δ1 + arctan(ae1/Re), δf2 = δ2 + arctan(ae2/Re)
- Root Angle: δr1 = δ1 - arctan(be/Re), δr2 = δ2 - arctan(be/Re)
- Back Angle = Pitch Cone Angle
- Crown to Back: for blank sizing
- Tooth Thickness at mid-face
- Cutter Recommendation: Show cutter number and radius (Gleason #XS, S, M, L etc.) based on mean module
- Dividing Head: Simple/compound indexing calculation for z1 and z2 teeth
- Machine Setup Note: "RH spiral pinion meshes with LH spiral gear; drive side and coast side pressure angles differ"

---

### `/materials` — Material Database

Searchable, filterable card/table layout. Filter by: material type (steel/cast iron/non-ferrous), machinability, heat treat available.

Materials with all properties:

1. **Mild Steel (EN1A / 1018)**: UTS 420 MPa, YS 350 MPa, HB 120, E 200 GPa, Machinability: Excellent, Poisson 0.29
   - Heat treatment: None standard / case harden
   - Gear applications: Light duty, slow speed gears, racks
   - EN/AISI: EN1A / 1018

2. **EN8 (080M40 / 1040)**: UTS 620–850 MPa, YS 460 MPa, HB 179–229, E 200 GPa, Machinability: Good
   - Heat treatment: N&T, case harden
   - Gear applications: Medium duty gears, shafts
   - EN/AISI: EN8 / 1040

3. **EN9 (070M55 / 1055)**: UTS 700–900 MPa, YS 530 MPa, HB 201–255, Machinability: Good
   - Heat treatment: N&T, induction harden
   - Gear applications: Medium-high duty gears

4. **EN19 (709M40 / 4140)**: UTS 850–1000 MPa (HT), YS 700–850 MPa, HB 248–302, Machinability: Good
   - Heat treatment: Through harden, N&T, nitriding
   - Gear applications: High duty gears, pinions, shafts

5. **EN24 (817M40 / 4340)**: UTS 1000–1150 MPa (HT), YS 850–1000 MPa, HB 302–363, Machinability: Fair
   - Heat treatment: Through harden, case harden, nitriding
   - Gear applications: High performance gears, aerospace, heavy-duty

6. **EN31 (535A99 / 52100)**: UTS 620–1000 MPa, YS 420–840 MPa, HB 207 (ann), Machinability: Fair
   - Heat treatment: Through harden (60–64 HRc), oil quench
   - Gear applications: High-precision gears, bearing-quality, form ground gears

7. **Grey Cast Iron (Grade 250 / BS1452)**: UTS 250 MPa, Compressive 600 MPa, HB 180–240, E 100 GPa, Machinability: Excellent
   - Heat treatment: Stress relief only
   - Gear applications: Gear blanks, housings, slow speed large gears, good vibration damping

8. **Phosphor Bronze (PB1 / C51000)**: UTS 320 MPa, YS 150 MPa, HB 80, E 120 GPa, Machinability: Excellent
   - Heat treatment: None
   - Gear applications: Worm wheels (pairs with steel worm), bushes, slow speed gears

9. **Aluminium Bronze (AB1 / C95400)**: UTS 500 MPa, YS 200 MPa, HB 140, E 120 GPa, Machinability: Good
   - Heat treatment: Age harden
   - Gear applications: Marine worm wheels, high-load bronze gears

10. **Brass (CZ121 / C38500)**: UTS 385 MPa, YS 310 MPa, HB 100, E 97 GPa, Machinability: Excellent
    - Heat treatment: None
    - Gear applications: Light duty gears, clocks, instruments

11. **Aluminium Alloy (6061-T6)**: UTS 310 MPa, YS 275 MPa, HB 95, E 69 GPa, Machinability: Excellent
    - Heat treatment: T6 — solution + age harden
    - Gear applications: Light duty, aerospace, high-speed low-load gears

12. **Stainless Steel 304 (A2)**: UTS 515 MPa, YS 205 MPa, HB 215, E 193 GPa, Machinability: Fair
    - Heat treatment: Cannot harden (austenitic), anneal only
    - Gear applications: Corrosion-resistant gears, food industry, chemical plant

Show each material in a card with all properties, heat treatment options, and typical applications.

---

### `/tools` — Engineering Tools

A collection of standalone calculators, each in its own panel/card:

1. **Module to DP Converter**: m = 25.4/DP; DP = 25.4/m. Show lookup table of standard modules: 0.5, 0.8, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0, 20.0 with their DP equivalents.

2. **Unit Converter** (tabs for categories):
   - Length: mm, inch, m, ft, cm
   - Torque: N·m, lb·ft, lb·in, kgf·m
   - Power: kW, HP (mechanical), HP (metric)
   - Force: N, kN, lbf, kgf
   - Pressure/Stress: MPa, N/mm², psi, ksi, bar, kgf/cm²
   - Speed: RPM, rad/s, m/s

3. **Gear Ratio Calculator**: Enter any two of: z1, z2, n1 (rpm), n2 (rpm) — solve for the remaining two.

4. **Centre Distance Calculator**: Two modes:
   - Mode A: Enter m, z1, z2 → calculate C
   - Mode B: Enter C and target ratio → suggest best integer tooth combinations within ±1% of target ratio

5. **Lead Calculator**: Enter module, number of starts, pitch diameter → lead, lead angle, helix angle

6. **Helix Angle Calculator**: Enter any two of: lead, pitch diameter, helix angle → solve for third

7. **Involute Function Table**: Show inv(φ) = tan(φ) - φ(rad) for φ = 10°, 12°, 14.5°, 15°, 17.5°, 20°, 22.5°, 25°, 27.5°, 30°. Interactive calculator: enter any angle, show inv(φ).

8. **Gear Cutter Selection**: Enter module (or DP) and number of teeth → recommend standard cutter number:
   - #1: 135 teeth to rack, #2: 55–134, #3: 35–54, #4: 26–34, #5: 21–25, #6: 17–20, #7: 14–16, #8: 12–13

9. **Dividing Head Calculator**: Enter required divisions → show:
   - Simple indexing: turns = 40/N, hole circle required
   - Compound indexing if simple not possible
   - Show available standard Brown & Sharpe hole circles: 15,16,17,18,19,20 / 21,23,27,29,31,33 / 37,39,41,43,47,49

10. **Pitch Calculator**: Show relationships: Circular pitch p = π×m; p = π/DP; Normal pitch pn = p×cos(β); Base pitch pb = p×cos(φ); Axial pitch pa = p/tan(β)

---

### `/reports` — Reports

Interface to generate professional reports from stored calculations.

Show a checklist of which calculators have been used (have stored results). For each available result, allow generating:
- PDF Report: using jspdf and jspdf-autotable — professional layout with company header area, calculation inputs table, results table with formulas, manufacturing notes section, footer with date
- Excel Report: using xlsx — separate sheets for: Summary, Input Parameters, Calculated Results, Formula Reference
- CSV Report: plain text with headers and values

PDF generation code pattern:
```
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const doc = new jsPDF();
// Add title, inputs table, results table
autoTable(doc, { head: [...], body: [...] });
doc.save('gear-calculation.pdf');
```

Excel generation:
```
import * as XLSX from 'xlsx';
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([...]);
XLSX.utils.book_append_sheet(wb, ws, 'Results');
XLSX.writeFile(wb, 'gear-calculation.xlsx');
```

---

### `/settings` — Settings

- Unit system: Metric / Imperial
- Default pressure angle: 14.5°, 20°, 25°
- Decimal places: 2, 3, 4, 5, 6
- Dark/Light mode toggle
- About: list engineering references used (Machinery's Handbook, ISO 6336, AGMA 2001, DIN 3960)
- Reset all stored calculations button

---

## Architecture

All calculations are pure client-side TypeScript — NO backend API calls.

Organise calculation logic in:
- src/lib/calculations/spur-gear.ts
- src/lib/calculations/helical-gear.ts
- src/lib/calculations/worm-gear.ts
- src/lib/calculations/spiral-bevel.ts
- src/lib/calculations/unit-converter.ts
- src/lib/materials.ts (static data)
- src/lib/reports.ts (PDF/Excel/CSV generation)
- src/context/calculator-context.tsx (global state: unit system, settings, stored results)

Use React Context + localStorage for persistent state. Use react-hook-form + zod for all inputs. Calculate results reactively on every valid input change using useMemo or useEffect.

## Numerical Precision
Use at least 6 significant figures in intermediate calculations. Display with configurable decimal places (default 4). All trigonometric functions use radians internally.

## Validation
- Show inline validation errors
- z < 12 teeth: warning "Undercut risk — consider profile shift"
- Helix angle > 45°: warning "High axial thrust — bearing selection critical"
- Face width > Re/3 for bevel: warning "Excessive face width"
- Contact ratio < 1.1: error "Contact ratio below 1.1 — redesign required"
- Contact ratio shown coloured: < 1.2 red, 1.2–1.5 amber, > 1.5 green

## Navigation
Collapsible sidebar with icons and labels. Show active calculation badge (e.g. "m=2, z=20/40") when a calculation is stored. Sidebar items: Home, Spur Gear, Helical Gear, Worm Gear, Spiral Bevel, Materials, Tools, Reports, Settings.

## Do not use emojis anywhere in the UI.
