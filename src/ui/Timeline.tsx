import { useRef, useState } from 'react';
import type { DayResult } from '../engine/types';
import { at } from '../engine';
import { useStore } from '../state/store';
import { BASELINE } from '../state/useResult';
import { Chip } from './kit';
import { fmt, hhmm } from './format';

const X0 = 72, X1 = 932, Y0 = 14, Y1 = 120;
const x = (h: number) => X0 + ((X1 - X0) * h) / 24;
const niceUp = (v: number) => { const s = v > 1000 ? 250 : v > 300 ? 50 : 25; return Math.ceil(v / s) * s; };

export function Timeline({ r, loadMW, arrayMWp, hideStore }: { r: DayResult; loadMW: number; arrayMWp: number; hideStore?: boolean }) {
  const hour = useStore((s) => s.hour), setHour = useStore((s) => s.setHour), compare = useStore((s) => s.compare);
  const playing = useStore((s) => s.playing), setPlaying = useStore((s) => s.setPlaying), speed = useStore((s) => s.speed), setSpeed = useStore((s) => s.setSpeed);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);

  const pMax = niceUp(Math.max(arrayMWp * 0.62, loadMW * 1.15, 50));
  const sMax = Math.max(r.capacity, BASELINE.capacity, 1);
  const yP = (v: number) => Y1 - ((Y1 - Y0) * v) / pMax;
  const yS = (v: number) => Y1 - ((Y1 - Y0) * v) / sMax;
  const steps = Array.from({ length: 97 }, (_, i) => i);
  // store[i] is post-step: the value at hour (i+1)/4. At 0h use the start-of-day store.
  const storePts = (d: DayResult) => [`${x(0)},${yS(d.startStore)}`, ...steps.slice(1).map((i) => `${x(i / 4)},${yS(d.store[i - 1])}`)].join(' ');
  const solarPts = `${x(0)},${Y1} ` + steps.map((i) => `${x(i / 4)},${yP(r.solar[i % 96])}`).join(' ') + ` ${x(24)},${Y1}`;
  const ghostSolar = steps.map((i) => `${x(i / 4)},${yP(BASELINE.solar[i % 96])}`).join(' ');

  const toHour = (clientX: number) => {
    const b = svgRef.current!.getBoundingClientRect();
    const sx = ((clientX - b.left) / b.width) * 1000;
    return Math.min(24, Math.max(0, ((sx - X0) / (X1 - X0)) * 24));
  };
  const storeAt = (h: number) => h < 0.25 ? r.startStore + (r.store[0] - r.startStore) * (h / 0.25) : at(r.store, h - 0.25);
  const hv = hover ?? null;
  const tipIdx = hv == null ? 0 : Math.min(95, Math.floor(hv * 4));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
        <div className="row" style={{ gap: 8 }}>
          <Chip on onClick={() => setPlaying(!playing)} label={playing ? 'Pause (Space)' : 'Play day (Space)'}>
            <span style={{ display: 'inline-block', minWidth: 62, fontSize: 15 }}>{playing ? 'Pause' : 'Play day'}</span>
          </Chip>
          {([1, 4, 16] as const).map((s) => <Chip key={s} on={speed === s} onClick={() => setSpeed(s)} label={`Speed ${s} times`}>{s}×</Chip>)}
          <span className="hd num" style={{ fontSize: 18, marginLeft: 6 }}>{hhmm(hour)}</span>
        </div>
        <div className="legend">
          <span><i style={{ width: 18, height: 10, background: 'var(--gold)' }} />Solar MW</span>
          {!hideStore && <span><i style={{ width: 20, borderTop: '3px solid var(--store)' }} />Store MWh</span>}
          <span><i style={{ width: 20, borderTop: '2px dashed var(--ink)' }} />Campus {fmt(loadMW)} MW</span>
          {compare && <span><i style={{ width: 20, borderTop: '2px dotted #6B7280' }} />Brief</span>}
          <span><i style={{ width: 18, height: 10, background: 'var(--ink)', opacity: 0.14 }} />Night</span>
        </div>
      </div>
      <svg ref={svgRef} viewBox="0 0 1000 150" role="img" style={{ display: 'block', width: '100%', touchAction: 'none', cursor: 'ew-resize' }}
        aria-label={`Day chart. Solar peaks at ${fmt(Math.max(...r.solar))} MW. ${hideStore ? '' : `Store ranges ${fmt(r.minStore)} to ${fmt(r.maxStore)} MWh.`} Playhead at ${hhmm(hour)}.`}
        fontFamily="Instrument Sans, Arial, sans-serif" fontSize="13" fill="#111827"
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); setPlaying(false); setHour(toHour(e.clientX)); }}
        onPointerMove={(e) => { const h = toHour(e.clientX); setHover(h); if (dragging.current) setHour(h); }}
        onPointerUp={() => { dragging.current = false; }} onPointerLeave={() => setHover(null)}>
        <rect x={x(0)} y={Y0} width={x(6) - x(0)} height={Y1 - Y0} fill="#111827" opacity="0.1" />
        <rect x={x(18)} y={Y0} width={x(24) - x(18)} height={Y1 - Y0} fill="#111827" opacity="0.1" />
        <polygon points={solarPts} fill="#F2C14E" fillOpacity="0.85" stroke="#C98F00" strokeWidth="1.5" />
        {compare && <polyline points={ghostSolar} fill="none" stroke="#6B7280" strokeWidth="1.5" strokeDasharray="2 3" />}
        <line x1={X0} y1={yP(loadMW)} x2={X1} y2={yP(loadMW)} stroke="#111827" strokeWidth="2" strokeDasharray="6 5" />
        {!hideStore && compare && <polyline fill="none" stroke="#6B7280" strokeWidth="2" strokeDasharray="2 3" points={storePts(BASELINE)} />}
        {!hideStore && <polyline fill="none" stroke="#FF5B1F" strokeWidth="3.5" strokeLinejoin="round" points={storePts(r)} />}
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="#111827" strokeWidth="1.5" />
        {[0, 6, 12, 18, 24].map((h) => <text key={h} x={x(h)} y={140} textAnchor="middle">{String(h).padStart(2, '0')}:00</text>)}
        <text x={X0 - 6} y={Y0 + 10} textAnchor="end">{fmt(pMax)} MW</text>
        {!hideStore && <text x={X1 + 6} y={Y0 + 2} textAnchor="start">{fmt(sMax)}</text>}
        {!hideStore && <text x={X1 + 6} y={Y0 + 16} textAnchor="start">MWh</text>}
        <line x1={x(hour)} y1={8} x2={x(hour)} y2={Y1} stroke="#111827" strokeWidth="2" />
        <circle cx={x(hour)} cy={8} r={7} fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
        {hv != null && <line x1={x(hv)} y1={Y0} x2={x(hv)} y2={Y1} stroke="#111827" strokeOpacity="0.35" />}
      </svg>
      <input type="range" min={0} max={24} step={0.25} value={hour} aria-label="Time of day" aria-valuetext={hhmm(hour)}
        onChange={(e) => { setPlaying(false); setHour(Number(e.target.value)); }} />
      {hv != null && (
        <div className="tip num" style={{ left: `${(x(hv) / 1000) * 100}%`, top: 56 }}>
          {hhmm(hv)} · sun {fmt(r.solar[tipIdx])} MW{!hideStore && <> · store {fmt(storeAt(hv))} MWh</>}{r.imported[tipIdx] > 0.05 && <> · import {fmt(r.imported[tipIdx])} MW</>}
        </div>
      )}
    </div>
  );
}
