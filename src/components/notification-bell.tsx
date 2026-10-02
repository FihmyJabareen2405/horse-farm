'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { count?: number };
        if (mounted) setCount(Number.isFinite(data.count) ? Number(data.count) : 0);
      } catch {
        // Notifications are helpful, but they should never block the rest of the app.
      }
    };

    void load();
    const interval = window.setInterval(load, 60_000);
    window.addEventListener('focus', load);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', load);
    };
  }, []);

  return (
    <Link href="/notifications" className="notification-bell" aria-label="התראות / الإشعارات">
      <Bell size={19} strokeWidth={1.9} />
      {count > 0 && <span className="notification-bell-count">{count > 99 ? '99+' : count}</span>}
    </Link>
  );
}
