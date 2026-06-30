// SVG Engineering Drawing Annotation Primitives
// All components render inside an <svg> element

import type { FC } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const DIM_COLOR  = "#1a1a1a";
const DIM_STROKE = 0.65;
const ARR_SIZE   = 7;
const TEXT_FONT  = "Arial, Helvetica, sans-serif";
const MONO_FONT  = "Courier New, Courier, monospace";

// ── Arrow Primitives ─────────────────────────────────────────────────────────
// Each arrow tip is at (x,y), pointing in the named direction.

export const ArrL: FC<{ x: number; y: number; s?: number }> = ({ x, y, s = ARR_SIZE }) => (
  <polygon points={`${x},${y} ${x + s},${y - s * 0.43} ${x + s},${y + s * 0.43}`} fill={DIM_COLOR} stroke="none" />
);
export const ArrR: FC<{ x: number; y: number; s?: number }> = ({ x, y, s = ARR_SIZE }) => (
  <polygon points={`${x},${y} ${x - s},${y - s * 0.43} ${x - s},${y + s * 0.43}`} fill={DIM_COLOR} stroke="none" />
);
export const ArrU: FC<{ x: number; y: number; s?: number }> = ({ x, y, s = ARR_SIZE }) => (
  <polygon points={`${x},${y} ${x - s * 0.43},${y + s} ${x + s * 0.43},${y + s}`} fill={DIM_COLOR} stroke="none" />
);
export const ArrD: FC<{ x: number; y: number; s?: number }> = ({ x, y, s = ARR_SIZE }) => (
  <polygon points={`${x},${y} ${x - s * 0.43},${y - s} ${x + s * 0.43},${y - s}`} fill={DIM_COLOR} stroke="none" />
);

// ── Horizontal Dimension ──────────────────────────────────────────────────────
// Measures horizontal distance from x1 to x2.
// fy = y of the feature; dimY = y of the dimension line.
export function HorizDim({
  x1, x2, fy, dimY, label,
}: { x1: number; x2: number; fy: number; dimY: number; label: string }) {
  const mid = (x1 + x2) / 2;
  const below = dimY > fy;
  const extY0 = below ? fy + 2 : fy - 2;
  const textY = below ? dimY + 10 : dimY - 3;
  return (
    <g stroke={DIM_COLOR} strokeWidth={DIM_STROKE} fill="none">
      <line x1={x1} y1={extY0} x2={x1} y2={dimY} />
      <line x1={x2} y1={extY0} x2={x2} y2={dimY} />
      <line x1={x1 + ARR_SIZE} y1={dimY} x2={x2 - ARR_SIZE} y2={dimY} />
      <ArrL x={x1} y={dimY} />
      <ArrR x={x2} y={dimY} />
      <text x={mid} y={textY} textAnchor="middle" fontSize={8.5} fontFamily={MONO_FONT} fill={DIM_COLOR} stroke="none">
        {label}
      </text>
    </g>
  );
}

// ── Vertical Dimension ────────────────────────────────────────────────────────
// Measures vertical distance from y1 to y2.
// fx = x of the feature; dimX = x of the dimension line.
export function VertDim({
  y1, y2, fx, dimX, label,
}: { y1: number; y2: number; fx: number; dimX: number; label: string }) {
  const mid = (y1 + y2) / 2;
  const right = dimX > fx;
  const extX0 = right ? fx + 2 : fx - 2;
  const textX = right ? dimX + 12 : dimX - 12;
  return (
    <g stroke={DIM_COLOR} strokeWidth={DIM_STROKE} fill="none">
      <line x1={extX0} y1={y1} x2={dimX} y2={y1} />
      <line x1={extX0} y1={y2} x2={dimX} y2={y2} />
      <line x1={dimX} y1={y1 + ARR_SIZE} x2={dimX} y2={y2 - ARR_SIZE} />
      <ArrU x={dimX} y={y1} />
      <ArrD x={dimX} y={y2} />
      <text
        x={textX} y={mid} textAnchor="middle" fontSize={8.5}
        fontFamily={MONO_FONT} fill={DIM_COLOR} stroke="none"
        transform={`rotate(-90,${textX},${mid})`}
      >
        {label}
      </text>
    </g>
  );
}

// ── Diameter / Radius Leader ──────────────────────────────────────────────────
// Leader line from a point on a circle to a text label.
// angleDeg: angle from 3-o'clock (0°) going clockwise.
// side: "right" means text is to the right of the leader elbow.
export function DiaLeader({
  cx, cy, r, angleDeg, label, side = "right", offset = 55,
}: {
  cx: number; cy: number; r: number; angleDeg: number;
  label: string; side?: "right" | "left"; offset?: number;
}) {
  const rad = (angleDeg * Math.PI) / 180;
  const px = cx + r * Math.cos(rad);   // point on circle
  const py = cy + r * Math.sin(rad);
  const ex = cx + (r + offset) * Math.cos(rad);  // elbow
  const ey = cy + (r + offset) * Math.sin(rad);
  const tx = side === "right" ? ex + 4 : ex - 4;
  const shelfLen = 55;
  const shelfX2 = side === "right" ? ex + shelfLen : ex - shelfLen;
  // Arrow tip at circle
  const arrowAngle = Math.atan2(py - ey, px - ex);
  const tipX = px;
  const tipY = py;
  const b1x = tipX + ARR_SIZE * Math.cos(arrowAngle + 2.8);
  const b1y = tipY + ARR_SIZE * Math.sin(arrowAngle + 2.8);
  const b2x = tipX + ARR_SIZE * Math.cos(arrowAngle - 2.8);
  const b2y = tipY + ARR_SIZE * Math.sin(arrowAngle - 2.8);
  return (
    <g stroke={DIM_COLOR} strokeWidth={DIM_STROKE} fill="none">
      <line x1={px} y1={py} x2={ex} y2={ey} />
      <line x1={ex} y1={ey} x2={shelfX2} y2={ey} />
      <polygon points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`} fill={DIM_COLOR} stroke="none" />
      <text
        x={side === "right" ? shelfX2 + 3 : shelfX2 - 3}
        y={ey - 3}
        textAnchor={side === "right" ? "start" : "end"}
        fontSize={8.5} fontFamily={MONO_FONT} fill={DIM_COLOR} stroke="none"
      >
        {label}
      </text>
    </g>
  );
}

// ── Note Leader ───────────────────────────────────────────────────────────────
export function NoteLeader({
  x1, y1, x2, y2, label, side = "right",
}: { x1: number; y1: number; x2: number; y2: number; label: string; side?: "right" | "left" }) {
  return (
    <g stroke={DIM_COLOR} strokeWidth={DIM_STROKE} fill="none">
      <circle cx={x1} cy={y1} r={2} fill={DIM_COLOR} stroke="none" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <text
        x={side === "right" ? x2 + 4 : x2 - 4}
        y={y2 + 3}
        textAnchor={side === "right" ? "start" : "end"}
        fontSize={8} fontFamily={TEXT_FONT} fill={DIM_COLOR} stroke="none"
      >
        {label}
      </text>
    </g>
  );
}

// ── Angular Dimension ─────────────────────────────────────────────────────────
export function AngularDim({
  cx, cy, r, startDeg, endDeg, label,
}: { cx: number; cy: number; r: number; startDeg: number; endDeg: number; label: string }) {
  const s = (startDeg * Math.PI) / 180;
  const e = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(s); const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e); const y2 = cy + r * Math.sin(e);
  const mid = ((startDeg + endDeg) / 2 * Math.PI) / 180;
  const tx = cx + (r + 20) * Math.cos(mid);
  const ty = cy + (r + 20) * Math.sin(mid);
  const la = endDeg - startDeg > 180 ? 1 : 0;
  return (
    <g stroke={DIM_COLOR} strokeWidth={DIM_STROKE} fill="none">
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`} />
      <text x={tx} y={ty} textAnchor="middle" fontSize={8.5} fontFamily={MONO_FONT} fill={DIM_COLOR} stroke="none">
        {label}
      </text>
    </g>
  );
}

// ── Line Types ────────────────────────────────────────────────────────────────
export const CL: FC<{ x1: number; y1: number; x2: number; y2: number }> = ({ x1, y1, x2, y2 }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a1a1a" strokeWidth={0.5} strokeDasharray="10 3 2 3" fill="none" />
);

export const HL: FC<{ x1: number; y1: number; x2: number; y2: number }> = ({ x1, y1, x2, y2 }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#444" strokeWidth={0.8} strokeDasharray="5 3" fill="none" />
);

export const PhL: FC<{ x1: number; y1: number; x2: number; y2: number }> = ({ x1, y1, x2, y2 }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#777" strokeWidth={0.6} strokeDasharray="10 3 2 3 2 3" fill="none" />
);

// ── Gear Data Table ───────────────────────────────────────────────────────────
export type TableRow = { label: string; value: string };

export function GearTable({
  x, y, width = 310, title, rows,
}: { x: number; y: number; width?: number; title: string; rows: TableRow[] }) {
  const rowH = 16;
  const titleH = 20;
  const colW = width * 0.58;
  const totalH = titleH + rows.length * rowH + 1;

  return (
    <g>
      {/* Outer border */}
      <rect x={x} y={y} width={width} height={totalH} fill="#fff" stroke="#1a1a1a" strokeWidth={1} />
      {/* Title row */}
      <rect x={x} y={y} width={width} height={titleH} fill="#2a2a2a" stroke="none" />
      <text x={x + width / 2} y={y + 13} textAnchor="middle" fontSize={9} fontFamily={TEXT_FONT} fontWeight="bold" fill="#fff" stroke="none">
        {title}
      </text>
      {/* Column separator */}
      <line x1={x + colW} y1={y + titleH} x2={x + colW} y2={y + totalH} stroke="#1a1a1a" strokeWidth={0.5} />
      {/* Rows */}
      {rows.map((row, i) => {
        const ry = y + titleH + i * rowH;
        const isEven = i % 2 === 0;
        return (
          <g key={i}>
            {isEven && <rect x={x + 1} y={ry} width={width - 2} height={rowH} fill="#f5f5f5" stroke="none" />}
            <line x1={x} y1={ry} x2={x + width} y2={ry} stroke="#ccc" strokeWidth={0.4} />
            <text x={x + 5} y={ry + 11} fontSize={8} fontFamily={TEXT_FONT} fill="#1a1a1a" stroke="none">{row.label}</text>
            <text x={x + colW + 5} y={ry + 11} fontSize={8} fontFamily={MONO_FONT} fill="#1a1a1a" stroke="none">{row.value}</text>
          </g>
        );
      })}
    </g>
  );
}

// ── Hatch Pattern (Section fill) ─────────────────────────────────────────────
export function HatchRect({
  x, y, width, height, id,
}: { x: number; y: number; width: number; height: number; id: string }) {
  return (
    <>
      <defs>
        <pattern id={id} width={5} height={5} patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1={0} y1={0} x2={0} y2={5} stroke="#ccc" strokeWidth={0.6} />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={`url(#${id})`} />
    </>
  );
}

// Export TEXT_FONT for use in other modules
export { TEXT_FONT, MONO_FONT, DIM_COLOR };
