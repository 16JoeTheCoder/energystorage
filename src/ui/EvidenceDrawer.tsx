import { useEffect, useRef, useState } from 'react';
import { EVIDENCE } from '../data/evidence';
import type { Tag } from '../data/paramsMeta';
import { useStore } from '../state/store';
import { Chip } from './kit';

const TAGS: Tag[] = ['S', 'C', 'C*', 'SIM', 'A', 'V', '?'];
export function EvidenceDrawer() {
  const open = useStore((s) => s.evidenceOpen), ui = useStore((s) => s.ui);
  const [filter, setFilter] = useState<Tag | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); ui({ evidenceOpen: false }); } };
    window.addEventListener('keydown', onKey, true);
    return () => { window.removeEventListener('keydown', onKey, true); prev?.focus(); };
  }, [open, ui]);
  if (!open) return null;
  const list = EVIDENCE.filter((e) => !filter || e.tag === filter);
  const chapters = [...new Set(list.map((e) => e.chapter))];
  return (
    <>
      <div className="drawer-bg" onClick={() => ui({ evidenceOpen: false })} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Evidence" tabIndex={-1} ref={ref}>
        <div className="row"><h2 className="hd" style={{ margin: 0, fontSize: 22 }}>Evidence</h2><span className="spacer" /><Chip onClick={() => ui({ evidenceOpen: false })}>Close</Chip></div>
        <div className="limit"><b>Anything marked A, V or ? is not proven.</b> Items marked stale were promised for dates now past: re-check them.</div>
        <div className="row" style={{ gap: 6 }}>
          <Chip on={!filter} onClick={() => setFilter(null)}>All</Chip>
          {TAGS.map((t) => <Chip key={t} on={filter === t} onClick={() => setFilter(t)}>{t}</Chip>)}
        </div>
        {chapters.map((c) => (
          <section key={c}>
            <h3 className="hd" style={{ fontSize: 17, margin: '8px 0 0' }}>{c}</h3>
            {list.filter((e) => e.chapter === c).map((e) => (
              <div className="ev" key={e.id}>
                <div><b>{e.label}</b> <span className="tg" style={{ cursor: 'default' }}>{e.tag}</span></div>
                <div>{e.status !== 'ok' && <span className="st-u">{e.status}</span>}</div>
                <div>{e.value}{e.note && <span className="muted"> · {e.note}</span>}</div>
                <div className="small muted">checked {e.checked}</div>
                {e.source && <div className="small">{e.source.url ? <a href={e.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--ink)' }}>{e.source.title}</a> : e.source.title}</div>}
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
