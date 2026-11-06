import type { ReactNode } from 'react';

export function Defs({ id, sky }: { id: string; sky: [string, string] }) {
  return (
    <defs>
      <linearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
      <radialGradient id={id + 'glow'}><stop offset="0" stopColor="#FFE7A0" stopOpacity="0.95" /><stop offset="1" stopColor="#FFE7A0" stopOpacity="0" /></radialGradient>
      <linearGradient id={id + 'rock'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B8AA93" /><stop offset="1" stopColor="#7C6F5B" /></linearGradient>
      <linearGradient id={id + 'earth'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7E715D" /><stop offset="1" stopColor="#3C352B" /></linearGradient>
      <linearGradient id={id + 'water'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5DA9BC" /><stop offset="1" stopColor="#2A6174" /></linearGradient>
      <linearGradient id={id + 'panel'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3A6BA5" /><stop offset="1" stopColor="#14305A" /></linearGradient>
      <linearGradient id={id + 'fluid'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A4C" /><stop offset="1" stopColor="#D4450C" /></linearGradient>
      <linearGradient id={id + 'slate'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#667286" /><stop offset="1" stopColor="#333C4C" /></linearGradient>
      <pattern id={id + 'strata'} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="14" stroke="#2E271F" strokeOpacity="0.25" strokeWidth="1.5" /></pattern>
      <marker id={id + 'ar'} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#FF5B1F" /></marker>
      <marker id={id + 'arg'} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#E9A100" /></marker>
      <marker id={id + 'ari'} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#111827" /></marker>
    </defs>
  );
}

export function Label({ x, y, children, w, stroke = '#111827', strokeOpacity = 0.4, sw = 1, dark }: { x: number; y: number; children: ReactNode; w: number; stroke?: string; strokeOpacity?: number; sw?: number; dark?: boolean }) {
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={w} height={26} rx={4} fill={dark ? '#111827' : '#FFFFFF'} stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth={sw} />
      <text x={x + 9} y={y + 18} fontSize={15} fill={dark ? '#F3EFE6' : '#111827'}>{children}</text>
    </g>
  );
}
/** rough text width for label boxes at 15px Instrument Sans */
export const tw = (s: string, px = 15) => Math.ceil(s.length * px * 0.53) + 20;

export function Clock({ x = 16, y = 16, time, line }: { x?: number; y?: number; time: string; line: string }) {
  const w = Math.max(200, tw(line) + 10);
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={w} height={58} rx={6} fill="#111827" />
      <text x={x + 14} y={y + 30} fontSize={26} fontWeight={800} fill="#F3EFE6" fontFamily="Bricolage Grotesque, Arial Black, Arial, sans-serif">{time}</text>
      <text x={x + 14} y={y + 50} fontSize={15} fill="#C9CDD6">{line}</text>
    </g>
  );
}

export function Moon({ x, y }: { x: number; y: number }) {
  return <g pointerEvents="none"><circle cx={x} cy={y} r={20} fill="#F3EFE6" /><circle cx={x + 9} cy={y - 6} r={18} fill="#1B2440" /></g>;
}

export function Hot({ label, onGo, children }: { label: string; onGo: () => void; children: ReactNode }) {
  return (
    <g className="hot" role="button" tabIndex={0} aria-label={label} onClick={onGo}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGo(); } }}>
      <title>{label}</title>{children}
    </g>
  );
}
