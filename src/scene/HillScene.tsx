import { RECIPES } from '../engine/fluid';
import type { DayResult, Params } from '../engine/types';
import { useStore } from '../state/store';
import { fmt, hhmm } from '../ui/format';
import { Handle } from './Handle';
import { Clock, Defs, Label, Moon, tw } from './parts';
import { isNight, sceneState, skyColors } from './useSceneState';

const ID = 'h-';
const u = (n: string) => `url(#${ID}${n})`;
export const hillTopH = (h: number) => 358 - 206 * (h / 300) ** 0.7;
const BASE = [[60, 358], [140, 340], [230, 250], [300, 172], [315, 152], [340, 152], [560, 152], [585, 152], [600, 172], [670, 250], [760, 340], [840, 358]];
function hillPath(top: number) {
  const k = (358 - top) / 206;
  const p = BASE.map(([x, y]) => [x, +(358 - (358 - y) * k).toFixed(1)]);
  return `M${p[0]} C${p[1]} ${p[2]} ${p[3]} Q${p[4]} ${p[5]} H${p[6][0]} Q${p[7]} ${p[8]} C${p[9]} ${p[10]} ${p[11]}Z`;
}

export function HillScene({ r, p, jet, onPelton }: { r: DayResult; p: Params; jet: number; onPelton: () => void }) {
  const hour = useStore((s) => s.hour), set = useStore((s) => s.set), playing = useStore((s) => s.playing);
  const st = sceneState(r, hour);
  const night = isNight(hour);
  const top = hillTopH(p.headM), dy = top - 152;
  const fillH = 32 * st.frac;
  const cav = 8 + 70 * (1 - st.frac);
  const spinning = st.discharge > 0.05 && playing;
  const period = Math.max(0.3, 6 / Math.max(1, jet / 10));
  const status = st.charge > 0.05 ? `Charging · pumps ${fmt(st.charge)} MW` : st.discharge > 0.05 ? `Turbines ${fmt(st.discharge)} MW` : st.frac > 0.99 ? `Store full${st.curtailed > 0.05 ? ` · curtailing ${fmt(st.curtailed)} MW` : ''}` : 'Idle';
  const units = Math.max(1, Math.round(p.turbineMaxMW / 25));
  const shown = Math.min(units, 6);
  const rec = RECIPES[p.recipe];
  const fluidName = Math.abs(p.sg - rec.sgNominal) <= 0.05 ? rec.name : `SG ${p.sg.toFixed(1)}`;
  return (
    <svg viewBox="0 0 1000 640" role="img"
      aria-label={`Cutaway of the hill battery at ${hhmm(hour)}. Tanks ${Math.round(st.frac * 100)}% full, ${fmt(r.capacity)} MWh capacity, ${fmt(p.headM)} metre shaft, Pelton jet ${jet.toFixed(1)} metres per second.`}
      fontFamily="Instrument Sans, Arial, sans-serif" fontSize="16" fill="#111827">
      <Defs id={ID} sky={skyColors(hour)} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .wheel{transform-origin:880px 185px;animation:spin ${period}s linear infinite}`}</style>
      <rect x="0" y="0" width="1000" height="360" fill={u('sky')} />
      <path d="M0 330 L120 280 L240 318 L380 240 L520 300 L660 262 L800 316 L1000 276 V360 H0Z" fill={night ? '#2F3A52' : '#B9CFCB'} opacity="0.6" />
      {night ? <Moon x={140} y={120} /> : <><circle cx="140" cy="120" r="80" fill={u('glow')} /><circle cx="140" cy="120" r="24" fill="#FFC83D" /></>}
      <rect x="0" y="356" width="1000" height="284" fill={u('earth')} /><rect x="0" y="356" width="1000" height="284" fill={u('strata')} />
      <path d="M0 420 Q250 408 500 424 T1000 418 M0 600 Q300 588 600 604 T1000 596" fill="none" stroke="#2E271F" strokeOpacity="0.3" strokeWidth="2" />
      <rect x="0" y="352" width="1000" height="8" fill="#789A68" />
      <path d={hillPath(top)} fill={u('rock')} stroke="#5E5344" strokeWidth="1.5" />
      <path d={hillPath(top)} fill={u('strata')} />

      <rect x="438" y={top} width="24" height={402 - top} fill="#262B36" />
      <rect x="441" y={top + 4} width="18" height={396 - top} fill={u('fluid')} opacity={st.charge + st.discharge > 0.05 ? 0.9 : 0.35} />
      {(st.charge > 0.05 || st.discharge > 0.05) && [330, 280, 230].filter((y) => y > top + 12).map((y) => (
        <path key={y} d={st.discharge > 0.05 ? `M444 ${y} l6 8 l6 -8` : `M444 ${y + 8} l6 -8 l6 8`} fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      ))}
      <rect x="250" y="400" width="400" height="72" rx="4" fill="#262B36" />
      <rect x="370" y="406" width="160" height="10" fill="#8A93A0" /><rect x="444" y="400" width="12" height="8" fill="#8A93A0" />
      <g fill="#A9B0BC" stroke="#4B5563" strokeWidth="1.5"><rect x="268" y="420" width="30" height="40" rx="3" /><rect x="308" y="420" width="30" height="40" rx="3" />
        {Array.from({ length: shown }, (_, k) => <circle key={k} cx={395 + k * (200 / shown)} cy="444" r={Math.min(20, 90 / shown)} />)}</g>
      <g stroke={st.discharge > 0.05 ? '#E8590C' : '#8A93A0'} strokeWidth="4">{Array.from({ length: shown }, (_, k) => <path key={k} d={`M${395 + k * (200 / shown)} 416 V424`} />)}</g>
      <g fill="#6B7280"><rect x="251" y="472" width="8" height="30" /><rect x="381" y="472" width="8" height="30" /><rect x="511" y="472" width="8" height="30" /><rect x="641" y="472" width="8" height="30" /></g>
      {[200, 330, 460, 590].map((x0) => <g key={x0}><rect x={x0} y="500" width="110" height="90" rx="14" fill="#262B36" /><rect x={x0 + 4} y={588 - cav} width="102" height={cav} rx="6" fill={u('fluid')} /></g>)}
      <g stroke="#8C867A" strokeWidth="1.5"><rect x="326" y={104 + dy} width="112" height="48" rx="4" fill="#DAD5CA" /><rect x="462" y={104 + dy} width="112" height="48" rx="4" fill="#DAD5CA" />
        <path d={`M326 ${104 + dy} L382 ${88 + dy} L438 ${104 + dy}Z M462 ${104 + dy} L518 ${88 + dy} L574 ${104 + dy}Z`} fill="#C4BEB0" /></g>
      <rect x="334" y={112 + dy} width="96" height="36" rx="2" fill="#262B36" /><rect x="470" y={112 + dy} width="96" height="36" rx="2" fill="#262B36" />
      <rect x="336" y={146 + dy - fillH} width="92" height={fillH} rx="1" fill={u('fluid')} /><rect x="472" y={146 + dy - fillH} width="92" height={fillH} rx="1" fill={u('fluid')} />
      <rect x="438" y={122 + dy} width="24" height="10" fill="#8A93A0" />

      <g stroke="#111827" strokeOpacity="0.55" strokeWidth="1.5" fill="none" strokeDasharray="5 4"><path d={`M740 ${top} V400 M732 ${top} H748 M732 400 H748`} /><path d="M830 238 Q700 320 568 436" /></g>
      <Label x={706} y={(top + 400) / 2 - 13} w={68} dark sw={0}>{fmt(p.headM)} m</Label>

      <g role="button" tabIndex={0} aria-label="Pelton wheel: open the explainer" className="hot" onClick={onPelton} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPelton(); } }}>
        <circle cx="880" cy="160" r="96" fill="#FFFFFF" fillOpacity="0.96" stroke="#111827" strokeWidth="2" />
        <circle cx="880" cy="185" r="44" fill="#D9DEE6" stroke="#6B7280" strokeWidth="2" />
        <g className={spinning ? 'wheel' : ''}><g fill="#8A93A0" stroke="#4B5563" strokeWidth="1.5">
          {Array.from({ length: 12 }, (_, k) => { const a = (k * Math.PI) / 6; return <circle key={k} cx={880 + 52 * Math.cos(a)} cy={185 + 52 * Math.sin(a)} r="7" />; })}</g>
          <path d="M880 185 L932 185" stroke="#4B5563" strokeWidth="2" /></g>
        <circle cx="880" cy="185" r="8" fill="#4B5563" />
        <path d="M792 214 L830 212" stroke="#E8590C" strokeWidth={st.discharge > 0.05 ? 6 : 2} strokeLinecap="round" opacity={st.discharge > 0.05 ? 1 : 0.4} />
        <rect x="772" y="207" width="22" height="14" rx="2" fill="#8A93A0" stroke="#4B5563" />
        <text x="880" y="94" textAnchor="middle" fontSize="15" fontWeight="600" textDecoration="underline">Pelton wheel</text>
        <rect x="818" y="258" width="124" height="26" rx="13" fill="#111827" /><text x="880" y="276" textAnchor="middle" fill="#F3EFE6" fontSize="15">Jet {jet.toFixed(1)} m/s</text>
      </g>

      <Label x={330} y={Math.max(4, 58 + dy)} w={tw(`Two covered tanks · ${Math.round(st.frac * 100)}% · ${fmt(r.capacity)} MWh`)}>Two covered tanks · {Math.round(st.frac * 100)}% · {fmt(r.capacity)} MWh</Label>
      <Label x={470} y={292} w={76}>Shaft</Label>
      <Label x={664} y={426} w={108}>Machine hall</Label>
      <Label x={664} y={458} w={tw(`${units} × ${fmt(p.turbineMaxMW / units, 1).replace('.0', '')} MW Pelton turbines`)}>{units} × {fmt(p.turbineMaxMW / units, 1).replace('.0', '')} MW Pelton turbines</Label>
      <Label x={240} y={368} w={tw(`Pumps · ${fmt(p.pumpMaxMW)} MW`)}>Pumps · {fmt(p.pumpMaxMW)} MW</Label>
      <Label x={716} y={548} w={tw(`Lower caverns · ${fluidName}`)}>Lower caverns · {fluidName}</Label>

      <Handle cx={740} cy={top} label="Head (drag the hill top)" value={p.headM} min={100} max={500} step={10} valueText={`${p.headM} m`} pill={`${p.headM} m`}
        onChange={(v) => set('headM', v, false)} toValue={(_x, y) => 300 * (Math.max(0, 358 - y) / 206) ** (1 / 0.7)} />
      <Clock time={hhmm(hour)} line={status} />
    </svg>
  );
}
