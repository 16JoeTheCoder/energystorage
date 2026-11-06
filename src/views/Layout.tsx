import type { ReactNode } from 'react';
import { Footer, KpiBar, type KpiCell } from '../ui/shell';

export function Layout({ kpis, children, side, name }: { kpis: KpiCell[]; children: ReactNode; side: ReactNode; name: string }) {
  return (
    <>
      <KpiBar cells={kpis} />
      <div className="main">
        <div className="wide">{children}</div>
        {side}
      </div>
      <Footer name={name} />
    </>
  );
}
