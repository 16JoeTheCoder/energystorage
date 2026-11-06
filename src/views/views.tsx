import { useMemo, useState } from 'react';
import { BRIEF } from '../data/paramsMeta';
import { EVIDENCE } from '../data/evidence';
import { campus, clearDay, co2Readouts, dailyYield, efficiency, heatReadouts, hillPhysics, netGainVsLand, powerFactor, roundTrip, type Cooling, type Params } from '../engine';
import { HillScene } from '../scene/HillScene';
import { CampusScene, Co2Scene, HeatScene, SolarScene } from '../scene/OtherScenes';
import { WideScene } from '../scene/WideScene';
import { sceneState } from '../scene/useSceneState';
import { useStore } from '../state/store';
import { BASE_KPI, simulateCached, useResult } from '../state/useResult';
import { AdjustPanel } from '../ui/controls';
import { delta, fmt, pct } from '../ui/format';
import { Chip, Tag } from '../ui/kit';
import { Timeline } from '../ui/Timeline';
import { Layout } from './Layout';

const same = (cur: number, base: number, unit: string, d = 0) => (useStore.getState().compare ? delta(cur, base, unit, d) : '');
const useCompare = () => useStore((s) => s.compare);

function solarCoverHours(solar: ArrayLike<number>, load: number) { let n = 0; for (let i = 0; i < 96; i++) if (solar[i] >= load) n++; return n / 4; }

/* ---------- 1 Problem ---------- */
export function ProblemView() {
  const { params: p, r } = useResult(); useCompare();
  const c = campus(p), cb = campus(BRIEF);
  const cover = solarCoverHours(r.solar, p.loadMW);
  const gap = p.loadMW * 13.5;
  return (
    <Layout name="Problem · data campus" side={<AdjustPanel view="problem" after={<div className="limit"><b>Limitation.</b> The {fmt(p.loadMW)} MW size is our assumption. No real site, lake or discharge permit has been modelled. Lake volume is illustrative: it would warm about {c.lakeWarmingKday.toFixed(2)} K per day with no cooling.</div>} />}
      kpis={[
        { label: 'Campus load', value: `${fmt(p.loadMW)} MW`, sub: `${fmt(c.itMW)} MW IT · ${fmt(c.racks)} racks` },
        { label: 'Sun covers the load', value: `${fmt(cover, 1)} h`, sub: 'clear day, sun ≥ load' },
        { label: 'Store must cover', value: '13.5 h', sub: 'night as the brief defines it' },
        { label: 'The night gap', value: `${fmt(gap)} MWh`, sub: same(gap, 1350, 'MWh') || `${fmt(p.loadMW)} MW × 13.5 h`, hl: true },
        { label: 'Lake cooling flow', value: `${c.flow.toFixed(2)} m³/s`, sub: same(c.flow, cb.flow, 'm³/s', 2) || `${fmt(c.flowDay)} m³/day` },
      ]}>
      <div className="card scene"><CampusScene r={r} p={p} racks={c.racks} /></div>
      <div className="card"><b>Same power at 3 a.m. as at noon.</b> <span className="muted">The load line stays flat while the sun comes and goes: everything under the dashed line at night must come from storage.</span></div>
      <Timeline r={r} loadMW={p.loadMW} arrayMWp={p.arrayMWp} hideStore />
    </Layout>
  );
}

/* ---------- 2 Idea ---------- */
export function WideView() {
  const { params: p, r, k } = useResult(); useCompare();
  const hour = useStore((s) => s.hour), set = useStore((s) => s.set), setChapter = useStore((s) => s.setChapter);
  const st = sceneState(r, hour);
  return (
    <Layout name="Wide view" side={<AdjustPanel view="wide" before={
      <div className="card ctl"><span style={{ fontWeight: 600 }}>Storage type</span>
        <div className="row" style={{ gap: 8 }}>
          <Chip on={p.storage === 'hill'} onClick={() => set('storage', 'hill')}>Hill battery</Chip>
          <Chip on={p.storage === 'co2'} onClick={() => set('storage', 'co2')}>CO₂ dome</Chip>
          <Chip on={p.storage === 'heat'} onClick={() => { set('storage', 'heat'); setChapter(6); }}>Heat + factory</Chip>
        </div>
        <div className="note">{p.storage === 'co2' ? 'Numbers below now run through the CO₂ dome. Its own view is in chapter 6.' : 'Heat + factory opens chapter 6: heat serves a factory, not the campus at night.'}</div>
      </div>} />}
      kpis={[
        { label: 'Grid import / day', value: `${fmt(k.imported)} MWh`, sub: same(k.imported, BASE_KPI.imported, 'MWh') },
        { label: 'Delivered from store', value: `${fmt(k.delivered)} MWh`, sub: same(k.delivered, BASE_KPI.delivered, 'MWh') },
        { label: 'Curtailed solar', value: `${fmt(k.curtailed)} MWh`, sub: same(k.curtailed, BASE_KPI.curtailed, 'MWh') },
        { label: 'Store right now', value: `${fmt(st.store)} MWh`, sub: `${Math.round(st.frac * 100)}% of ${fmt(r.capacity)}` },
        { label: 'Night covered', value: pct(k.nightCovered), sub: `of ${fmt(k.nightNeed)} MWh`, hl: true },
      ]}>
      <div className="card scene"><WideScene r={r} p={p} /></div>
      <div className="row small" style={{ gap: 8 }}><span style={{ fontWeight: 600 }}>Zoom to</span>
        <Chip onClick={() => setChapter(4)}>Lake · solar</Chip><Chip onClick={() => setChapter(3)}>Hill · fluid</Chip><Chip onClick={() => setChapter(1)}>Campus</Chip>
        <span className="muted">or click them in the picture. Drag the sun, the hill top or the lake edge.</span></div>
      <Timeline r={r} loadMW={p.loadMW} arrayMWp={p.arrayMWp} />
    </Layout>
  );
}

/* ---------- 3 Fluid ---------- */
const FLUIDS = [
  { sg: 1, name: 'Water', color: '#CFE3EE', tag: null },
  { sg: 2.5, name: 'R-19, real', color: '#B8803A', tag: 'S' as const },
  { sg: 3, name: 'R-29X, ours', color: '#E8590C', tag: 'A' as const },
];
export function HillView() {
  const { params: p, r } = useResult(); useCompare();
  const set = useStore((s) => s.set);
  const [explain, setExplain] = useState(false);
  const { ed } = efficiency(p);
  const h = hillPhysics(p, ed), hb = hillPhysics(BRIEF, efficiency(BRIEF).ed);
  const hillParams: Params = p.storage === 'co2' ? { ...p, storage: 'hill' } : p;
  const hr = p.storage === 'co2' ? simulateCached(hillParams) : r;
  return (
    <Layout name="Fluid · hill battery" side={<AdjustPanel view="hill" after={<div className="limit"><b>Limitation.</b> R-29X is a hypothetical recipe. Fluid settling and pump wear at {h.pressure.toFixed(2)} MPa are not modelled yet.</div>} />}
      kpis={[
        { label: 'Energy per m³', value: `${h.energyPerM3.toFixed(2)} kWh`, sub: same(h.energyPerM3, hb.energyPerM3, 'kWh', 2) || 'calculated' },
        { label: 'Pressure at the foot', value: `${h.pressure.toFixed(2)} MPa`, sub: `about ${fmt(h.atm)} atm` },
        { label: 'Fluid volume', value: `${fmt(Math.round(h.volume / 1000) * 1000)} m³`, sub: same(h.volume, hb.volume, 'm³') },
        { label: 'Full store', value: `${fmt(h.capacity)} MWh`, sub: `${h.hoursAtLoad.toFixed(1)} h at ${fmt(p.loadMW)} MW` },
        { label: 'Turbine wear', value: `${h.wear.toFixed(2)}×`, sub: `vs a ${fmt(p.wearRefHead)} m drop`, hl: true },
      ]}>
      {p.storage === 'co2' && <div className="limit">The CO₂ dome is the selected storage. This chapter still shows the hill battery for comparison.</div>}
      <div className="fluids">
        {FLUIDS.map((f) => {
          const vol = (h.capacity * 1000) / (h.energyPerM3 / p.sg * f.sg) ;
          const ratio = 1 / f.sg;
          const H = 52 * ratio;
          return (
            <button type="button" key={f.sg} className="card fluid" aria-pressed={Math.abs(p.sg - f.sg) < 1e-9} onClick={() => set('sg', f.sg)}>
              <svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">
                <rect x="4" y="4" width="52" height="52" rx="3" fill="none" stroke="#111827" strokeWidth="1.5" strokeDasharray="3 3" />
                <rect x="4" y={56 - H} width="52" height={H} rx="2" fill={f.color} stroke="#111827" strokeWidth="2" />
              </svg>
              <span><span style={{ fontWeight: 600, display: 'block' }}>{f.name}</span><span style={{ fontSize: 14 }}>SG {f.sg.toFixed(1)} · {(vol / 1e6).toFixed(2)} M m³ {f.tag && <Tag t={f.tag} />}</span></span>
            </button>
          );
        })}
      </div>
      <div className="card scene"><HillScene r={hr} p={hillParams} jet={h.jet} onPelton={() => setExplain((v) => !v)} /></div>
      {explain && (
        <div className="card" role="region" aria-label="Pelton wheel explainer">
          <b>Why the drop sets the wear.</b> The jet leaves the nozzle at about √(2gh) × {p.jetCv}: {h.jet.toFixed(1)} m/s at {fmt(p.headM)} m, whatever the fluid. Abrasion of the buckets grows very fast with jet speed (roughly with its cube), which works out near head^1.5 against a {fmt(p.wearRefHead)} m reference: {h.wear.toFixed(2)}× here. <b>This is a rule of thumb, not a measurement.</b> A denser fluid stores more per m³ and raises the pressure, but leaves the jet speed and this wear factor unchanged. <button type="button" className="lk" onClick={() => setExplain(false)}>Close</button>
        </div>
      )}
      <Timeline r={hr} loadMW={p.loadMW} arrayMWp={p.arrayMWp} />
    </Layout>
  );
}

/* ---------- 4 Plant ---------- */
const COOL: { c: Cooling; label: string }[] = [{ c: 'land', label: 'Land' }, { c: 'float', label: 'Floating' }, { c: 'film', label: 'Floating + film' }, { c: 'spray', label: 'Floating + spray' }];
const tSeries = (c: Cooling) => (c === 'land' ? clearDay.tLand : c === 'float' ? clearDay.tFloat : c === 'film' ? clearDay.tFilm : clearDay.tSpray);
export function SolarView() {
  const { params: p, r, k } = useResult(); useCompare();
  const hour = useStore((s) => s.hour);
  const cloudy = useMemo(() => [1, 0.7, 0.5, 0.25].map((s) => ({ s, imp: simulateCached({ ...p, sunshine: s }).totals.imported })), [p]);
  const tNoon = tSeries(p.cooling)[48];
  const active = (p.cooling === 'film' || p.cooling === 'spray') && hour >= 9.5 && hour < 14.5;
  const maxImp = Math.max(1, ...cloudy.map((c) => c.imp), p.loadMW * 24 * 0.75);
  return (
    <Layout name="Plant · floating solar" side={<AdjustPanel view="solar" after={<div className="limit"><b>Limitation.</b> The day shape is a clear day scaled, not real weather. Pump energies are back-solved from the brief, not specified pumps.</div>} />}
      kpis={[
        { label: 'Net gain vs land', value: `${netGainVsLand(p) >= 0 ? '+' : ''}${(netGainVsLand(p) * 100).toFixed(2)}%`, sub: `after ${fmt(p.cooling === 'land' ? 0 : p.cooling === 'float' ? p.pumpFloat : p.cooling === 'film' ? p.pumpFilm : p.pumpSpray, 1)} MWh/day pumping`, hl: true },
        { label: 'Daily solar yield', value: `${fmt(dailyYield(p))} MWh`, sub: same(dailyYield(p), dailyYield(BRIEF), 'MWh') },
        { label: 'Power factor at noon', value: pct(powerFactor(tNoon, p.tempCoeff), 1), sub: `−${(p.tempCoeff * 100).toFixed(2)}% per °C above 25` },
        { label: 'Cell temperature, noon', value: `${tNoon.toFixed(1)} °C`, sub: p.cloudCooling ? 'clear-day value' : 'reference clear day' },
        { label: 'Grid import / day', value: `${fmt(k.imported)} MWh`, sub: same(k.imported, BASE_KPI.imported, 'MWh') },
      ]}>
      <div className="card scene"><SolarScene r={r} p={p} active={active} /></div>
      <div className="grid2">
        <div className="card"><b>Cell temperature at noon</b>
          <div className="bars" style={{ marginTop: 8 }}>{COOL.map(({ c, label }) => { const t = tSeries(c)[48]; return (
            <div className="bar" key={c}><span style={{ fontWeight: p.cooling === c ? 600 : 400 }}>{label}</span><span className="track"><span className="fill" style={{ width: `${(t / 60) * 100}%`, background: p.cooling === c ? 'var(--signal)' : 'var(--ink)', opacity: p.cooling === c ? 1 : 0.55 }} /></span><span className="num">{t.toFixed(1)} °C</span></div>); })}</div>
          <div className="note" style={{ marginTop: 6 }}>Film and spray run on a schedule (film 09:30–14:30), so their curves switch there.</div>
        </div>
        <div className="card"><b>Grid import on a cloudy day</b> <span className="small muted">engine, steady state</span>
          <div className="bars" style={{ marginTop: 8 }}>{cloudy.map(({ s, imp }) => (
            <div className="bar" key={s}><span style={{ fontWeight: Math.abs(p.sunshine - s) < 1e-9 ? 600 : 400 }}>{Math.round(s * 100)}% sun</span><span className="track"><span className="fill" style={{ width: `${(imp / maxImp) * 100}%`, background: 'var(--ink)' }} /></span><span className="num">{fmt(imp)} MWh</span></div>))}</div>
        </div>
      </div>
      <Timeline r={r} loadMW={p.loadMW} arrayMWp={p.arrayMWp} />
    </Layout>
  );
}

/* ---------- 5 Limits ---------- */
export function LimitsView() {
  const { params: p, k } = useResult(); useCompare();
  const set = useStore((s) => s.set);
  const cases = (['best', 'planning', 'measured'] as const).map((c) => {
    const q = { ...p, effCase: c };
    const t = simulateCached(q).totals;
    return { c, rt: roundTrip(q), energyIn: (p.loadMW * 13.5) / roundTrip(q), delivered: t.delivered, imported: t.imported };
  });
  const maxE = Math.max(...cases.map((c) => c.energyIn));
  const night = p.loadMW * 13.5;
  const label = { best: 'Best', planning: 'Planning', measured: 'Measured' };
  const tags = { best: 'C', planning: 'A', measured: 'S' } as const;
  return (
    <Layout name="Limits · efficiency" side={<AdjustPanel view="limits" only={['effCase', 'rtCustom']} after={<div className="limit"><b>Only 59% has ever been measured</b>, on a 500 kW demonstrator. Everything above that is a hope, not a result.</div>} />}
      kpis={[
        { label: 'Round trip', value: pct(roundTrip(p), 1), sub: p.effCase === 'measured' ? 'quoted as 59% measured' : same(roundTrip(p) * 100, roundTrip(BRIEF) * 100, 'pt', 1) },
        { label: 'Energy in for one night', value: `${fmt(night / roundTrip(p))} MWh`, sub: `to deliver ${fmt(night)} MWh` },
        { label: 'Delivered from store', value: `${fmt(k.delivered)} MWh`, sub: same(k.delivered, BASE_KPI.delivered, 'MWh') },
        { label: 'Grid import / day', value: `${fmt(k.imported)} MWh`, sub: same(k.imported, BASE_KPI.imported, 'MWh'), hl: k.imported > 0.5 },
        { label: 'Night covered', value: pct(k.nightCovered), sub: `of ${fmt(k.nightNeed)} MWh` },
      ]}>
      <div className="card"><b>Energy in needed for one {fmt(night)} MWh night</b>
        <div className="bars" style={{ marginTop: 8 }}>{cases.map((c) => (
          <div className="bar" key={c.c}><button type="button" className={'chip' + (p.effCase === c.c ? ' sel' : '')} onClick={() => set('effCase', c.c)} style={{ justifySelf: 'start' }}>{label[c.c]} {pct(c.rt, 1)}<Tag t={tags[c.c]} /></button>
            <span className="track"><span className="fill" style={{ width: `${(c.energyIn / maxE) * 100}%`, background: 'var(--signal)', opacity: p.effCase === c.c ? 1 : 0.45 }} /></span><span className="num">{fmt(c.energyIn)} MWh</span></div>))}</div>
      </div>
      <div className="card"><b>Delivered from the store vs grid import, per day</b> <span className="small muted">full dispatch, not simple multiplication</span>
        <div className="bars" style={{ marginTop: 8 }}>{cases.map((c) => (
          <div className="bar" key={c.c}><span>{label[c.c]}</span>
            <span className="track"><span className="fill" style={{ width: `${(c.delivered / night) * 100}%`, background: 'var(--signal)' }} /><span className="fill" style={{ width: `${(c.imported / night) * 100}%`, background: 'var(--ink)' }} /></span>
            <span className="num small">{fmt(c.delivered)} / {fmt(c.imported)}</span></div>))}</div>
        <div className="legend" style={{ marginTop: 6 }}><span><i style={{ width: 14, height: 10, background: 'var(--signal)' }} />from store</span><span><i style={{ width: 14, height: 10, background: 'var(--ink)' }} />grid import (MWh)</span></div>
      </div>
      <div className="grid2">
        <div className="card"><b>What has to be true</b>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            <li>The heavy fluid stays mixed and does not settle in the tanks.</li>
            <li>Pumps and turbines survive {hillPhysics(p, 1).pressure.toFixed(1)} MPa of abrasive fluid.</li>
            <li>Efficiency climbs from the measured 59% to the planned 70.8%.</li>
            <li>A site exists with a {fmt(p.headM)} m drop next to a lake and a grid line.</li>
          </ul></div>
        <div className="card"><b>The scale gap</b> <Tag t="C" />
          <p style={{ margin: '8px 0 0' }}>Compared with the Cornwood demonstrator, our plant needs about <b>1,376×</b> the fluid and <b>200×</b> the power. Nothing this size has been built.</p></div>
      </div>
    </Layout>
  );
}

/* ---------- 6 Other storage ---------- */
const BLOCKS = [
  { b: 'brick' as const, name: 'Brick', ev: 'rondo' },
  { b: 'graphite' as const, name: 'Graphite', ev: 'antora' },
  { b: 'ceramic' as const, name: 'Ceramic', ev: 'argonne' },
];
export function OtherView() {
  const { params: p } = useResult(); useCompare();
  const set = useStore((s) => s.set);
  const q: Params = { ...p, storage: 'co2' };
  const r = simulateCached(q);
  const k = { imported: r.totals.imported };
  const [sub, setSub] = useState<'co2' | 'heat' | 'compare'>(p.storage === 'heat' ? 'heat' : p.storage === 'co2' ? 'co2' : 'co2');
  const go = (s: typeof sub) => setSub(s);
  const c = co2Readouts(p), h = heatReadouts(p);
  const tabs = (
    <div className="row" role="tablist" aria-label="Storage type" style={{ gap: 8 }}>
      {([['co2', 'CO₂ dome'], ['heat', 'Heat + factory'], ['compare', 'Compare storage']] as const).map(([v, l]) => (
        <button key={v} role="tab" aria-selected={sub === v} className={'chip' + (sub === v ? ' sel' : '')} onClick={() => go(v)}>{l}</button>))}
      {p.storage !== 'hill' && <button type="button" className="lk" onClick={() => set('storage', 'hill')}>Back to the hill battery</button>}
    </div>
  );
  if (sub === 'compare') {
    const rows: [string, string, 'A' | 'S' | 'V' | 'C'][] = [['Hill battery, planning', '70.8%', 'A'], ['Hill battery, measured', '59%', 'S'], ['CO₂ dome', '75%', 'V'], ['Gravity tower', '>80%', 'V'], ['Heat kept as heat', '>97%', 'V'], ['Heat back to electricity', '31.5%', 'C']];
    return (
      <Layout name="Other storage · compare" side={<aside className="side"><div className="limit"><b>These efficiency numbers are NOT directly comparable.</b> They come from different sizes, maturities and boundaries (electricity to electricity vs heat to heat).</div></aside>}
        kpis={[{ label: 'Hill (planning)', value: '70.8%', sub: 'assumption' }, { label: 'Hill (measured)', value: '59%', sub: '500 kW', hl: true }, { label: 'CO₂ dome', value: '75%', sub: 'vendor claim' }, { label: 'Gravity tower', value: '>80%', sub: 'vendor claim' }, { label: 'Heat → power', value: '31.5%', sub: 'calculated' }]}>
        {tabs}
        <div className="card"><table className="cmp"><thead><tr><th>Storage</th><th>Round trip</th><th>Evidence</th></tr></thead>
          <tbody>{rows.map(([n, v, t]) => <tr key={n}><td>{n}</td><td className="num">{v}</td><td><Tag t={t} /></td></tr>)}</tbody></table></div>
      </Layout>
    );
  }
  if (sub === 'heat') {
    const ev = (id: string) => EVIDENCE.find((e) => e.id === id)!;
    return (
      <Layout name="Other storage · heat battery to a factory" side={<AdjustPanel view="other" />}
        kpis={[
          { label: 'Heat needed', value: h.heatNeeded == null ? '—' : `${fmt(h.heatNeeded)} MWh`, sub: h.heatNeeded == null ? 'enter a demand' : `${fmt(p.heatDemandMW!)} MW × ${p.heatHours} h` },
          { label: 'Units needed', value: h.units == null ? '—' : fmt(h.units), sub: `of ${fmt(p.heatUnitMWh)} MWh` },
          { label: 'Electricity in', value: h.electricityIn == null ? '—' : `${fmt(h.electricityIn)} MWh`, sub: 'at 97% kept as heat' },
          { label: 'If turned back to power', value: h.backToElec == null ? '—' : `${fmt(h.backToElec)} MWh`, sub: '31.5%, range 25–55%' },
          { label: 'To replace our night', value: `${fmt(h.unitsFor1350)} units`, sub: `${fmt(h.heatFor1350)} MWh heat for 1,350 MWh`, hl: true },
        ]}>
        {tabs}
        <div className="card scene"><HeatScene block={p.heatBlock} /></div>
        <div className="grid2">{BLOCKS.map((b) => { const e = ev(b.ev); return (
          <button type="button" key={b.b} className="card fluid" aria-pressed={p.heatBlock === b.b} onClick={() => set('heatBlock', b.b)} style={{ display: 'block' }}>
            <b>{b.name}</b> <Tag t={e.tag} />{e.status !== 'ok' && <span className="small muted"> · {e.status}</span>}
            <div className="small">{e.label}: {e.value}</div></button>); })}</div>
        <div className="limit"><b>Key idea.</b> Heat is cheap to keep but loses most of its value turning back into power (about 31.5%). So it feeds the factory’s process heat directly, not the data campus at night.</div>
      </Layout>
    );
  }
  return (
    <Layout name="Other storage · CO₂ dome" side={<AdjustPanel view="other" after={<div className="limit"><b>Risks.</b> A leak of this much CO₂ is an asphyxiation hazard in low ground. The dome is tall and wind-loaded. The largest plant running today is about {fmt(c.vsLargest, 2)}× smaller than this.</div>} />}
      kpis={[
        { label: 'Lasts', value: `${c.hours.toFixed(1)} h`, sub: `at ${fmt(p.co2PowerMW)} MW` },
        { label: 'Energy in per night', value: `${fmt(c.energyInPerNight)} MWh`, sub: `${pct(p.co2RoundTrip)} round trip` },
        { label: 'CO₂ needed', value: `${fmt(c.co2Tonnes)} t`, sub: 'at 100 kWh per tonne' },
        { label: 'vs largest plant', value: `${c.vsLargest.toFixed(2)}×`, sub: 'Ottana 200 MWh', hl: true },
        { label: 'Grid import / day', value: `${fmt(k.imported)} MWh`, sub: same(k.imported, BASE_KPI.imported, 'MWh') },
      ]}>
      {tabs}
      <div className="row small" style={{ gap: 8 }}>{p.storage === 'co2' ? <span>The CO₂ dome is now the storage for the whole simulator.</span> : <><Chip onClick={() => set('storage', 'co2')}>Use the CO₂ dome everywhere</Chip><span className="muted">This tab always runs the dispatch with the dome.</span></>}</div>
      <div className="card scene"><Co2Scene r={r} p={p} /></div>
      <Timeline r={r} loadMW={p.loadMW} arrayMWp={p.arrayMWp} />
    </Layout>
  );
}
