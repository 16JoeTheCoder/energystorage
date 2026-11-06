import type { DayResult, Params } from '../engine/types';
import { useStore } from '../state/store';
import { fmt, hhmm } from '../ui/format';
import { Clock, Defs, Label, Moon, tw } from './parts';
import { isNight, sceneState, skyColors, sunPos } from './useSceneState';

const Ground = ({ id, y = 380, h = 200 }: { id: string; y?: number; h?: number }) => (
  <><rect x="0" y={y} width="1000" height={h} fill={`url(#${id}earth)`} /><rect x="0" y={y} width="1000" height={h} fill={`url(#${id}strata)`} /><rect x="0" y={y - 4} width="1000" height="8" fill="#789A68" /></>
);
function Sky({ id, hour, h = 380 }: { id: string; hour: number; h?: number }) {
  const night = isNight(hour), s = sunPos(Math.min(18, Math.max(6, hour)));
  return <>
    <rect x="0" y="0" width="1000" height={h} fill={`url(#${id}sky)`} />
    {night ? <Moon x={860} y={70} /> : <g><circle cx={s.x} cy={s.y + 40} r="70" fill={`url(#${id}glow)`} /><circle cx={s.x} cy={s.y + 40} r="24" fill="#FFC83D" /></g>}
  </>;
}

/** Chapter 1: the data campus */
export function CampusScene({ r, p, racks }: { r: DayResult; p: Params; racks: number }) {
  const hour = useStore((s) => s.hour); const st = sceneState(r, hour); const night = isNight(hour);
  const fromSun = st.direct, fromStore = st.discharge, grid = st.imported;
  const rackN = Math.min(28, Math.max(4, Math.round(racks / 40)));
  return (
    <svg viewBox="0 0 1000 520" role="img" aria-label={`Data campus at ${hhmm(hour)}: ${fmt(p.loadMW)} MW load, ${fmt(fromSun)} MW from the sun, ${fmt(fromStore)} MW from storage, ${fmt(grid)} MW from the grid.`} fontFamily="Instrument Sans, Arial, sans-serif" fontSize="16" fill="#111827">
      <Defs id="c-" sky={skyColors(hour)} /><Sky id="c-" hour={hour} /><Ground id="c-" y={380} h={140} />
      <path d="M0 400 Q60 440 180 444 H300 V520 H0Z" fill="url(#c-water)" />
      <path d="M180 430 H360" stroke="#5DA9BC" strokeWidth="8" /><path d="M360 470 H180" stroke="#2A6174" strokeWidth="6" strokeDasharray="10 6" />
      <rect x="380" y="250" width="380" height="130" fill="url(#c-slate)" />
      <path d={'M380 250 ' + Array.from({ length: 10 }, (_, k) => `V226 L${418 + k * 38} 250`).join(' ') + ' H760'} fill="#7B8699" stroke="#333C4C" strokeWidth="1.2" />
      <g>{Array.from({ length: rackN }, (_, k) => <rect key={k} x={396 + (k % 14) * 25.5} y={k < 14 ? 270 : 324} width="18" height="44" rx="2" fill="#262B36" stroke="#4B5563" />)}</g>
      <g fill="#7CFFB0" opacity={night ? 0.9 : 0.6}>{Array.from({ length: rackN }, (_, k) => <rect key={k} x={400 + (k % 14) * 25.5} y={(k < 14 ? 276 : 330)} width="4" height="3" />)}</g>
      <g fill="#A9B0BC" stroke="#4B5563"><rect x="780" y="320" width="50" height="60" rx="3" /><rect x="840" y="320" width="50" height="60" rx="3" /></g>
      <g stroke="#4B5563" strokeWidth="2" fill="none">{[790, 805, 820, 850, 865, 880].map((x) => <path key={x} d={`M${x} 330 V370`} />)}</g>
      <g stroke="#333C4C" strokeWidth="2" fill="none"><path d="M910 380 V280 M960 380 V280 M900 290 H970 M900 310 H970" /><path d="M910 280 L935 250 L960 280" /></g>
      <Label x={380} y={190} w={tw(`Data hall · ${fmt(p.loadMW)} MW · ${fmt(racks)} racks`)}>Data hall · {fmt(p.loadMW)} MW · {fmt(racks)} racks</Label>
      <Label x={20} y={350} w={tw('Lake intake and return')}>Lake intake and return</Label>
      <Label x={770} y={286} w={tw('Chillers')}>Chillers</Label>
      <Label x={860} y={210} w={tw('150 kV yard')}>150 kV yard</Label>
      <g fontSize="15">
        <Label x={400} y={410} w={tw(`Sun ${fmt(fromSun)} MW`)} stroke="#E9A100" strokeOpacity={1} sw={2}>Sun {fmt(fromSun)} MW</Label>
        <Label x={540} y={410} w={tw(`Store ${fmt(fromStore)} MW`)} stroke="#FF5B1F" strokeOpacity={1} sw={2}>Store {fmt(fromStore)} MW</Label>
        {grid > 0.05 && <Label x={690} y={410} w={tw(`Grid ${fmt(grid)} MW`)} dark sw={0}>Grid {fmt(grid)} MW</Label>}
      </g>
      <Clock time={hhmm(hour)} line={night ? `Night · ${fmt(p.loadMW)} MW still needed` : `Day · sun ${fmt(st.solar)} MW`} />
    </svg>
  );
}

/** Chapter 4: floating solar */
export function SolarScene({ r, p, active }: { r: DayResult; p: Params; active: boolean }) {
  const hour = useStore((s) => s.hour); const st = sceneState(r, hour);
  const bright = Math.min(1, st.solar / Math.max(1, p.arrayMWp * 0.64));
  const land = p.cooling === 'land';
  const rows = Math.min(7, Math.max(2, Math.round(p.arrayMWp / 250)));
  return (
    <svg viewBox="0 0 1000 460" role="img" aria-label={`${land ? 'Land-mounted' : 'Floating'} solar at ${hhmm(hour)}, producing ${fmt(st.solar)} MW.`} fontFamily="Instrument Sans, Arial, sans-serif" fontSize="16" fill="#111827">
      <Defs id="s-" sky={skyColors(hour)} /><Sky id="s-" hour={hour} h={300} />
      {land ? <><rect x="0" y="296" width="1000" height="164" fill="#9DB27F" /><rect x="0" y="296" width="1000" height="164" fill="url(#s-strata)" opacity="0.4" /></>
        : <><rect x="0" y="296" width="1000" height="164" fill="url(#s-water)" /><path d="M0 300 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#fff" strokeOpacity="0.4" /></>}
      {Array.from({ length: rows }, (_, row) => {
        const y = 320 + row * 20, sc = 0.6 + row * 0.08;
        return <g key={row}>{Array.from({ length: 14 }, (_, k) => {
          const x = 30 + k * 68 + (row % 2) * 20;
          return <g key={k}>
            <path d={`M${x} ${y} l${10 * sc} ${-18 * sc} h${50 * sc} l${-10 * sc} ${18 * sc}z`} fill="url(#s-panel)" stroke="#0C1F3D" />
            <path d={`M${x + 12 * sc} ${y - 10 * sc} h${40 * sc}`} stroke="#9FC2E6" strokeOpacity={0.1 + 0.8 * bright} />
            {active && p.cooling === 'spray' && <g fill="#CFE8F5">{[0, 1, 2].map((d) => <circle key={d} cx={x + 20 * sc + d * 10} cy={y - 24 * sc - d * 3} r="2" />)}</g>}
            {active && p.cooling === 'film' && <path d={`M${x + 8 * sc} ${y - 14 * sc} h${46 * sc}`} stroke="#CFE8F5" strokeWidth="2" />}
          </g>;
        })}</g>;
      })}
      <path d="M980 300 V250 H900" stroke="#111827" strokeWidth="3" fill="none" /><rect x="880" y="236" width="40" height="28" fill="#9AA3B2" stroke="#4B5563" />
      <Label x={20} y={250} w={tw(`${fmt(p.arrayMWp)} MWp · ${fmt(p.arrayMWp / p.mwpPerHa)} ha`)}>{fmt(p.arrayMWp)} MWp · {fmt(p.arrayMWp / p.mwpPerHa)} ha</Label>
      <Label x={760} y={200} w={tw('Shore cable')}>Shore cable</Label>
      {(p.cooling === 'spray' || p.cooling === 'film') && <Label x={20} y={420} w={tw(active ? `${p.cooling === 'spray' ? 'Spray' : 'Film'} running now` : `${p.cooling === 'spray' ? 'Spray' : 'Film'} off (schedule)`)}>{active ? `${p.cooling === 'spray' ? 'Spray' : 'Film'} running now` : `${p.cooling === 'spray' ? 'Spray' : 'Film'} off (schedule)`}</Label>}
      <Clock time={hhmm(hour)} line={`Sun ${fmt(st.solar)} MW`} />
    </svg>
  );
}

/** Chapter 6a: CO2 dome */
export function Co2Scene({ r, p }: { r: DayResult; p: Params }) {
  const hour = useStore((s) => s.hour); const st = sceneState(r, hour);
  const ry = 40 + 110 * (1 - st.frac);
  return (
    <svg viewBox="0 0 1000 460" role="img" aria-label={`CO₂ dome at ${hhmm(hour)}: liquid tanks ${Math.round(st.frac * 100)}% full; the dome inflates as the store empties.`} fontFamily="Instrument Sans, Arial, sans-serif" fontSize="16" fill="#111827">
      <Defs id="o-" sky={skyColors(hour)} /><Sky id="o-" hour={hour} h={360} /><Ground id="o-" y={360} h={100} />
      <path d={`M120 360 A190 ${ry} 0 0 1 500 360Z`} fill="#E8EEF3" stroke="#111827" strokeWidth="2" />
      <path d={`M140 360 A170 ${Math.max(10, ry - 20)} 0 0 1 480 360`} fill="none" stroke="#111827" strokeOpacity=".2" strokeDasharray="4 6" />
      {[560, 620].map((x) => <g key={x}><rect x={x} y="220" width="44" height="140" rx="20" fill="#262B36" /><rect x={x + 4} y={356 - 132 * st.frac} width="36" height={132 * st.frac} rx="16" fill="url(#o-fluid)" /></g>)}
      <rect x="700" y="290" width="90" height="70" rx="4" fill="#A9B0BC" stroke="#4B5563" /><circle cx="745" cy="325" r="22" fill="#D9DEE6" stroke="#4B5563" />
      <rect x="830" y="300" width="140" height="60" fill="url(#o-slate)" />
      <path className={st.discharge > 0.05 ? 'flow' : ''} d="M790 330 H830" stroke="#111827" strokeWidth="3" strokeDasharray="7 5" opacity={st.discharge > 0.05 ? 1 : 0.3} />
      <Label x={170} y={110} w={tw(`Gas dome · ${Math.round((1 - st.frac) * 100)}% inflated`)}>Gas dome · {Math.round((1 - st.frac) * 100)}% inflated</Label>
      <Label x={540} y={180} w={tw(`Liquid CO₂ · ${fmt(st.store)} MWh`)}>Liquid CO₂ · {fmt(st.store)} MWh</Label>
      <Label x={690} y={250} w={tw('Heater + turbine')}>Heater + turbine</Label>
      <Label x={830} y={266} w={tw(`Campus ${fmt(p.loadMW)} MW`)}>Campus {fmt(p.loadMW)} MW</Label>
      <Clock time={hhmm(hour)} line={st.charge > 0.05 ? `Compressing ${fmt(st.charge)} MW` : st.discharge > 0.05 ? `Expanding ${fmt(st.discharge)} MW` : 'Idle'} />
    </svg>
  );
}

/** Chapter 6b: heat battery to a factory */
export function HeatScene({ block }: { block: string }) {
  const hour = useStore((s) => s.hour); const night = isNight(hour);
  return (
    <svg viewBox="0 0 1000 400" role="img" aria-label={`Sun charges a ${block} heat battery by day; steam or hot oil goes straight to the factory, ${night ? 'now from the battery' : 'now from the sun'}.`} fontFamily="Instrument Sans, Arial, sans-serif" fontSize="16" fill="#111827">
      <Defs id="t-" sky={skyColors(hour)} /><Sky id="t-" hour={hour} h={320} /><Ground id="t-" y={320} h={80} />
      <g fill="url(#t-panel)" stroke="#0C1F3D">{[30, 90, 150].map((x) => <path key={x} d={`M${x} 320 l12 -26 h46 l-12 26z`} />)}</g>
      <path className={night ? '' : 'flow'} d="M220 300 H330" stroke="#E9A100" strokeWidth="3" strokeDasharray="9 5" fill="none" opacity={night ? 0.3 : 1} />
      <rect x="330" y="200" width="200" height="120" rx="6" fill={block === 'graphite' ? '#3A3F47' : block === 'ceramic' ? '#E4DCCB' : '#B5523B'} stroke="#111827" strokeWidth="2" />
      <g stroke="#111827" strokeOpacity=".3">{[230, 260, 290].map((y) => <path key={y} d={`M330 ${y} H530`} />)}{[380, 430, 480].map((x) => <path key={x} d={`M${x} 200 V320`} />)}</g>
      <path className="flow" d="M530 260 H680" stroke="#FF5B1F" strokeWidth="4" strokeDasharray="10 5" fill="none" />
      <rect x="680" y="200" width="220" height="120" fill="url(#t-slate)" /><rect x="840" y="140" width="24" height="60" fill="#4B5563" />
      <g fill="#FFFFFF" opacity=".7"><circle cx="852" cy="128" r="10" /><circle cx="862" cy="110" r="13" /></g>
      <Label x={330} y={160} w={tw(`${block[0].toUpperCase() + block.slice(1)} heat battery`)}>{block[0].toUpperCase() + block.slice(1)} heat battery</Label>
      <Label x={540} y={220} w={tw('Steam / hot oil')}>Steam / hot oil</Label>
      <Label x={690} y={330} w={tw('Factory process heat')}>Factory process heat</Label>
      <Clock time={hhmm(hour)} line={night ? 'Night · heat from the battery' : 'Day · sun charges the battery'} />
    </svg>
  );
}
