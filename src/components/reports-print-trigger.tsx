'use client';

import { useEffect } from 'react';

export function ReportsPrintTrigger({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(() => window.print(), 450);
    return () => window.clearTimeout(timer);
  }, [auto]);

  return <button type="button" onClick={() => window.print()}>הדפס / שמור כ־PDF</button>;
}
