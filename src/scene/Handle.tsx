import { useRef, useState } from 'react';
import { useStore } from '../state/store';

/** SVG drag handle that is also a keyboard slider (plan 7.4). */
export function Handle({ cx, cy, label, value, min, max, step, onChange, toValue, valueText, pill, commit = true }: {
  cx: number; cy: number; label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; toValue: (svgX: number, svgY: number) => number; valueText: string; pill: string; commit?: boolean;
}) {
  const begin = useStore((s) => s.begin), end = useStore((s) => s.end);
  const [drag, setDrag] = useState(false);
  const ref = useRef<SVGGElement>(null);
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const svgPoint = (e: React.PointerEvent) => {
    const svg = ref.current!.ownerSVGElement!;
    const b = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return [((e.clientX - b.left) / b.width) * vb.width, ((e.clientY - b.top) / b.height) * vb.height];
  };
  return (
    <g ref={ref} role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={valueText}
      style={{ cursor: 'grab', touchAction: 'none', outline: 'none' }} className="handle"
      onPointerDown={(e) => { e.stopPropagation(); (e.currentTarget as Element).setPointerCapture(e.pointerId); setDrag(true); if (commit) begin(); }}
      onPointerMove={(e) => { if (!drag) return; const [x, y] = svgPoint(e); onChange(snap(toValue(x, y))); }}
      onPointerUp={() => { setDrag(false); if (commit) end(); }}
      onPointerCancel={() => { setDrag(false); if (commit) end(); }}
      onKeyDown={(e) => {
        const k = e.shiftKey ? 10 : 1;
        let v: number | null = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = value + step * k;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = value - step * k;
        if (e.key === 'Home') v = min; if (e.key === 'End') v = max;
        if (v != null) { e.preventDefault(); e.stopPropagation(); onChange(snap(v)); }
      }}
      onKeyUp={() => { if (commit) end(); }} onKeyDownCapture={() => { if (commit) begin(); }} onBlur={() => { if (commit) end(); }}>
      <circle cx={cx} cy={cy} r={18} fill="transparent" />
      <circle cx={cx} cy={cy} r={10} fill="#FFFFFF" stroke="#111827" strokeWidth={2} className="hring" />
      <circle cx={cx} cy={cy} r={4} fill="#FF5B1F" />
      {drag && (
        <g pointerEvents="none">
          <rect x={cx + 14} y={cy - 34} width={pill.length * 8 + 20} height={24} rx={12} fill="#111827" />
          <text x={cx + 24} y={cy - 17} fill="#F3EFE6" fontSize={14}>{pill}</text>
        </g>
      )}
    </g>
  );
}
