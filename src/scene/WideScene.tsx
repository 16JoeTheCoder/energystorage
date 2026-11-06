import type { DayResult, Params } from '../engine/types';
import { useStore } from '../state/store';
import { fmt, hhmm } from '../ui/format';
import { Handle } from './Handle';
import { Clock, Defs, Hot, Label, Moon, tw } from './parts';
import { isNight, sceneState, skyColors, sunPos } from './useSceneState';

const ID = 'w-';
// lake edge: 200..730 MWp spans x 90..290, 730..2200 spans 290..330 (back row fills in)
const arrayToX = (a: number) => (a <= 730 ? 90 + (200 * (a - 200)) / 530 : 290 + (40 * (a - 730)) / 1470);
const xToArray = (x: number) => (x <= 290 ? 200 + ((x - 90) / 200) * 530 : 730 + ((x - 290) / 40) * 1470);
const u = (n: string) => `url(#${ID}${n})`;
/** hill top y for a head in metres; base stays at y=400 */
export const hillTop = (h: number) => 400 - (h / 300) * 210;
const HILL = [[330, 400], [380, 382], [424, 290], [462, 206], [470, 190], [490, 190], [590, 190], [610, 190], [618, 206], [656, 290], [700, 382], [750, 400]];

function hillPath(top: number) {
  const k = (400 - top) / 210;
  const p = HILL.map(([x, y]) => [x, 400 - (400 - y) * k].map((v) => +v.toFixed(1)));
  return `M${p[0]} C${p[1]} ${p[2]} ${p[3]} Q${p[4]} ${p[5]} H${p[6][0]} Q${p[7]} ${p[8]} C${p[9]} ${p[10]} ${p[11]}Z`;
}

export function WideScene({ r, p }: { r: DayResult; p: Params }) {
  const hour = useStore((s) => s.hour), setHour = useStore((s) => s.setHour), setPlaying = useStore((s) => s.setPlaying);
  const set = useStore((s) => s.set), setChapter = useStore((s) => s.setChapter), playing = useStore((s) => s.playing);
  const st = sceneState(r, hour);
  const night = isNight(hour);
  const sky = skyColors(hour);
  const sun = sunPos(Math.min(18, Math.max(6, hour)));
  const top = hillTop(p.headM);
  const dy = top - 190;
  const co2 = p.storage === 'co2';
  const sunNow = st.solar;
  const bright = Math.min(1, sunNow / Math.max(1, p.arrayMWp * 0.64));
  // panel field grows with the array: handle x in [60, 330] for 200..2200 MWp
  const edge = arrayToX(p.arrayMWp);
  const panelsFront = Math.max(1, Math.round((edge - 36) / 56));
  const pw = (edge - 36) / panelsFront;
  const status = night ? (st.discharge > 0.05 ? 'Night · turbines' : 'Night') : st.charge > 0.05 ? 'Day · pumping' : st.discharge > 0.05 ? 'Day · turbines' : 'Day';
  const fillH = 16 * 1.875 * st.frac; // inner tank height 30
  const tankY = 186 + dy;
  const cavFill = 23 * (1 - st.frac) * 1.0 + 2; // caverns fill as tanks empty
  const flowOn = !playing ? 'paused' : '';
  const storeLbl = co2 ? 'CO₂ dome' : 'Top tanks';

  return (
    <svg viewBox="0 0 1000 580" role="img" className={flowOn}
      aria-label={`Cutaway of the site at ${hhmm(hour)}. Sun ${fmt(sunNow)} MW, ${fmt(st.charge)} MW to storage, ${fmt(st.direct + st.discharge)} MW to the campus, store ${Math.round(st.frac * 100)}% full.`}
      fontFamily="Instrument Sans, Arial, sans-serif" fontSize="16" fill="#111827">
      <Defs id={ID} sky={sky} />
      <rect x="0" y="0" width="1000" height="400" fill={u('sky')} />
      <path d="M0 340 L110 285 L215 326 L350 250 L470 312 L590 268 L760 322 L880 286 L1000 332 V400 H0Z" fill={night ? '#2F3A52' : '#B9CFCB'} opacity="0.65" />
      <path d="M60 330 Q500 -150 940 330" fill="none" stroke="#FFFFFF" strokeOpacity={night ? 0.25 : 0.7} strokeWidth="2" strokeDasharray="4 9" />
      {night ? <Moon x={hour >= 18 ? 120 + (hour - 18) * 60 : 480 + hour * 60} y={70} /> : (
        <g pointerEvents="none"><circle cx={sun.x} cy={sun.y} r="85" fill={u('glow')} /><circle cx={sun.x} cy={sun.y} r="26" fill="#FFC83D" /></g>
      )}
      {!night && <g fill="#FFFFFF" opacity={0.85 * (1 - p.sunshine) + 0.35} pointerEvents="none"><ellipse cx="170" cy="92" rx="52" ry="13" /><ellipse cx="202" cy="80" rx="30" ry="14" /><ellipse cx="800" cy="118" rx="46" ry="12" /><ellipse cx="826" cy="106" rx="26" ry="12" />
        {p.sunshine < 0.75 && <><ellipse cx="420" cy="60" rx="70" ry="16" /><ellipse cx="610" cy="74" rx="60" ry="15" /></>}</g>}

      <rect x="0" y="398" width="1000" height="182" fill={u('earth')} />
      <rect x="0" y="398" width="1000" height="182" fill={u('strata')} />
      <path d="M0 448 Q250 436 500 452 T1000 446 M0 520 Q300 508 600 524 T1000 516" fill="none" stroke="#2E271F" strokeOpacity="0.3" strokeWidth="2" />
      <rect x="0" y="394" width="1000" height="8" fill="#789A68" />

      <Hot label={co2 ? 'Storage: CO₂ dome. Open chapter 6' : 'Hill battery. Open chapter 3, Fluid'} onGo={() => setChapter(co2 ? 6 : 3)}>
        <path d={hillPath(top)} fill={u('rock')} stroke="#5E5344" strokeWidth="1.5" opacity={co2 ? 0.35 : 1} strokeDasharray={co2 ? '6 5' : undefined} />
        <path d={hillPath(top)} fill={u('strata')} opacity={co2 ? 0.35 : 1} />
        {!co2 && <>
          <rect x="528" y={top} width="24" height={402 - top} fill="#262B36" />
          <rect x="531" y={top + 6} width="18" height={394 - top} fill={u('fluid')} opacity={0.2 + 0.8 * Math.min(1, (st.charge + st.discharge) / 150)} />
          {(st.charge > 0.05 || st.discharge > 0.05) && [330, 280, 230].filter((y) => y > top + 10).map((y) => (
            <path key={y} d={st.charge > 0.05 ? `M534 ${y} l6 -9 l6 9` : `M534 ${y - 9} l6 9 l6 -9`} fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          ))}
          <g stroke="#8C867A" strokeWidth="1.5"><rect x="452" y={148 + dy} width="72" height="42" rx="4" fill="#DAD5CA" /><rect x="556" y={148 + dy} width="72" height="42" rx="4" fill="#DAD5CA" /><path d={`M452 ${148 + dy} L488 ${134 + dy} L524 ${148 + dy}Z M556 ${148 + dy} L592 ${134 + dy} L628 ${148 + dy}Z`} fill="#C4BEB0" /></g>
          <rect x="524" y={168 + dy} width="32" height="10" fill="#8A93A0" />
          <rect x="460" y={156 + dy} width="56" height="30" rx="2" fill="#262B36" /><rect x="564" y={156 + dy} width="56" height="30" rx="2" fill="#262B36" />
          <rect x="462" y={tankY - fillH} width="52" height={fillH} fill={u('fluid')} /><rect x="566" y={tankY - fillH} width="52" height={fillH} fill={u('fluid')} />
        </>}
      </Hot>
      {co2 && (() => {
        const inflate = 1 - st.frac; // gas dome is full when the store is empty
        const ry = 30 + 70 * inflate;
        return (
          <Hot label="CO₂ dome. Open chapter 6" onGo={() => setChapter(6)}>
            <path d={`M440 400 A100 ${ry} 0 0 1 640 400Z`} fill="#E8EEF3" stroke="#111827" strokeWidth="2" />
            <g><rect x="660" y="330" width="26" height="70" rx="10" fill="#262B36" /><rect x="692" y="330" width="26" height="70" rx="10" fill="#262B36" />
              <rect x="663" y={398 - 64 * st.frac} width="20" height={64 * st.frac} rx="6" fill={u('fluid')} /><rect x="695" y={398 - 64 * st.frac} width="20" height={64 * st.frac} rx="6" fill={u('fluid')} /></g>
          </Hot>
        );
      })()}

      <Hot label="Machine hall and caverns. Open chapter 3" onGo={() => setChapter(3)}>
        <rect x="420" y="400" width="280" height="54" rx="4" fill="#262B36" />
        <g fill="#A9B0BC" stroke="#4B5563" strokeWidth="1.5"><rect x="434" y="412" width="22" height="30" rx="3" /><rect x="462" y="412" width="22" height="30" rx="3" /><rect x="490" y="412" width="22" height="30" rx="3" />
          {[574, 610, 646, 682].map((cx) => <circle key={cx} cx={cx} cy="427" r="14" />)}</g>
        <g fill="#4B5563">{[574, 610, 646, 682].map((cx) => <circle key={cx} cx={cx} cy="427" r="3" />)}</g>
        {!co2 && <>
          <g fill="#6B7280"><rect x="442" y="454" width="6" height="34" /><rect x="524" y="454" width="6" height="34" /><rect x="606" y="454" width="6" height="34" /><rect x="688" y="454" width="6" height="34" /></g>
          {[410, 492, 574, 656].map((x0) => <g key={x0}><rect x={x0} y="488" width="70" height="58" rx="10" fill="#262B36" /><rect x={x0 + 3} y={543 - cavFill} width="64" height={cavFill} rx="7" fill={u('fluid')} /></g>)}
        </>}
      </Hot>

      <Hot label="Floating solar on the lake. Open chapter 4, Plant" onGo={() => setChapter(4)}>
        <path d="M18 398 Q36 452 120 458 H236 Q308 452 332 398Z" fill={u('water')} />
        <path d="M36 410 q14 -5 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.5" />
        {p.arrayMWp > 760 && <g fill={u('panel')} stroke="#0C1F3D" strokeWidth="1.2" opacity="0.6">
          {Array.from({ length: Math.max(1, Math.round(panelsFront * Math.min(1, (p.arrayMWp - 730) / 1470))) }, (_, k) => <path key={k} d={`M${62 + k * pw} 388 l10 -20 h${pw - 10} l-10 20z`} />)}</g>}
        <g fill={u('panel')} stroke="#0C1F3D" strokeWidth="1.5">
          {Array.from({ length: panelsFront }, (_, k) => <path key={k} d={`M${36 + k * pw} 400 l12 -26 h${pw - 4} l-12 26z`} />)}</g>
        <g stroke="#9FC2E6" strokeOpacity={0.15 + 0.7 * bright} strokeWidth="1">
          {Array.from({ length: panelsFront }, (_, k) => <path key={k} d={`M${54 + k * pw} 387 H${50 + (k + 1) * pw - 8} M${60 + k * pw} 381 H${56 + (k + 1) * pw - 8}`} />)}</g>
      </Hot>

      {st.charge > 0.05 && <path className="flow" d="M316 396 C340 414 380 426 420 424" fill="none" stroke="#FF5B1F" strokeWidth="3.5" strokeDasharray="10 4" markerEnd={u('ar')} />}
      <path className={st.direct > 0.05 ? 'flow' : ''} d="M300 440 C320 470 350 468 380 468 H790 V404" fill="none" stroke="#E9A100" strokeWidth="3" strokeDasharray="9 5" opacity={st.direct > 0.05 ? 1 : 0.25} markerEnd={u('arg')} />
      <path className={st.discharge > 0.05 ? 'flow' : ''} d="M700 430 H760 V404" fill="none" stroke="#111827" strokeWidth={st.discharge > 0.05 ? 3 : 1.5} strokeDasharray="7 5" opacity={st.discharge > 0.05 ? 1 : 0.35} markerEnd={u('ari')} />

      <Hot label="Data campus. Open chapter 1, Problem" onGo={() => setChapter(1)}>
        <rect x="800" y="330" width="150" height="70" fill={u('slate')} />
        <path d="M800 330 V314 L826 330 V314 L852 330 V314 L878 330 V314 L904 330 V314 L930 330 V314 L950 330Z" fill="#7B8699" stroke="#333C4C" strokeWidth="1.2" />
        <g fill="#FFE3A0" opacity={night ? 1 : 0.8}>{[344, 360].map((y) => [812, 834, 856, 878, 900, 922].map((x) => <rect key={x + '-' + y} x={x} y={y} width="10" height="6" />))}</g>
        <rect x="958" y="362" width="30" height="38" fill="#7B8699" stroke="#333C4C" /><circle cx="973" cy="378" r="9" fill="#333C4C" />
        <rect x="770" y="378" width="20" height="22" fill="#9AA3B2" stroke="#4B5563" />
      </Hot>
      {!co2 && <g opacity="0.45" fill="none" stroke="#111827" strokeDasharray="3 3" pointerEvents="none"><path d="M752 400 A20 14 0 0 1 792 400" /></g>}

      {!co2 && <g pointerEvents="none" stroke="#111827" strokeOpacity="0.55" strokeWidth="1.5" fill="none"><path d={`M668 ${top} V400 M660 ${top} H676 M660 400 H676`} strokeDasharray="5 4" /></g>}
      {!co2 && <Label x={654} y={(top + 400) / 2 - 13} w={68} dark sw={0}>{fmt(p.headM)} m</Label>}

      <Label x={co2 ? 440 : 290} y={co2 ? 270 : Math.max(84, 108 + dy)} w={tw(`${storeLbl} · ${Math.round(st.frac * 100)}% full`)}>{storeLbl} · {Math.round(st.frac * 100)}% full</Label>
      <Label x={40} y={318} w={tw(`Floating solar · ${fmt(p.arrayMWp)} MWp`)}>Floating solar · {fmt(p.arrayMWp)} MWp</Label>
      <Label x={738} y={506} w={tw(co2 ? 'Turbine hall' : 'Lower caverns')}>{co2 ? 'Turbine hall' : 'Lower caverns'}</Label>
      <Label x={800} y={276} w={tw(`Data campus · ${fmt(p.loadMW)} MW`)}>Data campus · {fmt(p.loadMW)} MW</Label>
      {st.charge > 0.05 && <Label x={330} y={372 - 30} w={tw(`Pump ${fmt(st.charge)} MW`)} stroke="#FF5B1F" strokeOpacity={1} sw={1.5}>{co2 ? 'Compress' : 'Pump'} {fmt(st.charge)} MW</Label>}
      <Label x={520} y={456} w={tw(`Sun to campus ${fmt(st.direct)} MW`)} stroke="#E9A100" strokeOpacity={1} sw={1.5}>Sun to campus {fmt(st.direct)} MW</Label>
      {st.discharge > 0.05 && <Label x={720} y={436 - 6} w={tw(`Turbines ${fmt(st.discharge)} MW`)} stroke="#111827" strokeOpacity={1} sw={1.5}>Turbines {fmt(st.discharge)} MW</Label>}
      {st.curtailed > 0.05 && <Label x={744} y={60} w={tw(`Curtailing ${fmt(st.curtailed)} MW`)} dark sw={0}>Curtailing {fmt(st.curtailed)} MW</Label>}
      {st.imported > 0.05 && <g pointerEvents="none"><rect x={744} y={94} width={tw(`Grid import ${fmt(st.imported)} MW`)} height={26} rx={4} fill="#FF5B1F" /><text x={753} y={112} fontSize={15} fontWeight={600}>Grid import {fmt(st.imported)} MW</text></g>}

      {!co2 && <Handle cx={668} cy={top} label="Hill height (head)" value={p.headM} min={100} max={500} step={10} valueText={`${p.headM} m`} pill={`${p.headM} m`}
        onChange={(v) => set('headM', v, false)} toValue={(_x, y) => ((400 - y) / 210) * 300} />}
      <Handle cx={edge} cy={388} label="Solar array size" value={p.arrayMWp} min={200} max={2200} step={10} valueText={`${p.arrayMWp} MWp`} pill={`${fmt(p.arrayMWp)} MWp`}
        onChange={(v) => set('arrayMWp', v, false)} toValue={xToArray} />
      {!night && <Handle cx={sun.x} cy={sun.y} label="Time of day (drag the sun)" value={hour} min={6} max={18} step={0.25} valueText={hhmm(hour)} pill={hhmm(hour)} commit={false}
        onChange={(v) => { setPlaying(false); setHour(v); }} toValue={(x) => 6 + ((x - 60) / 880) * 12} />}

      <Clock time={hhmm(hour)} line={`${status} · sun ${fmt(sunNow)} MW`} />
      <g pointerEvents="none"><rect x="744" y="16" width="240" height="34" rx="6" fill="#FFFFFF" fillOpacity="0.92" /><text x="756" y="38" fontSize="15">Sunshine {Math.round(p.sunshine * 100)}% · {p.sunshine >= 0.95 ? 'clear sky' : p.sunshine >= 0.6 ? 'hazy' : p.sunshine >= 0.35 ? 'cloudy' : 'storm'}</text></g>
    </svg>
  );
}
