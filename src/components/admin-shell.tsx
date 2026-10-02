'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  Home,
  PawPrint,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { logout } from '@/app/logout/actions';
import { NotificationBell } from '@/components/notification-bell';

type AdminShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  userName?: string;
  farmName?: string;
  actions?: React.ReactNode;
};

const navItems = [
  { href: '/admin', label: 'לוח בקרה', sub: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/horses', label: 'סוסים', sub: 'الخيول', icon: PawPrint },
  { href: '/riders', label: 'רוכבים', sub: 'الفرسان', icon: Users },
  { href: '/instructors', label: 'מדריכים', sub: 'المدربون', icon: UserRoundCheck },
  { href: '/lessons', label: 'שיעורים', sub: 'الدروس', icon: ClipboardList },
  { href: '/lessons/week', label: 'יומן שבועי', sub: 'الجدول الأسبوعي', icon: CalendarDays },
  { href: '/treatments', label: 'טיפולים', sub: 'العلاجات', icon: ShieldCheck },
  { href: '/reports', label: 'דוחות וסטטיסטיקות', sub: 'التقارير والإحصائيات', icon: Activity },
  { href: '/notifications', label: 'התראות', sub: 'الإشعارات', icon: Bell },
  { href: '/users', label: 'משתמשים', sub: 'المستخدمون', icon: Users },
  { href: '/account', label: 'החשבון שלי', sub: 'حسابي', icon: UserRoundCheck },
  { href: '/settings', label: 'הגדרות', sub: 'الإعدادات', icon: Settings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="ניווט ניהול">
      {navItems.map(({ href, label, sub, icon: Icon }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`admin-nav-item ${active ? 'is-active' : ''}`}
          >
            <Icon size={20} strokeWidth={1.9} />
            <span className="min-w-0 flex-1">
              <strong>{label}</strong>
              <small>{sub}</small>
            </span>
            <ChevronLeft size={16} className="admin-nav-arrow" />
          </Link>
        );
      })}
    </nav>
  );
}


function MobileDock() {
  const pathname = usePathname();
  const items = [
    { href: '/admin', label: 'בית', sub: 'الرئيسية', icon: LayoutDashboard },
    { href: '/lessons', label: 'שיעורים', sub: 'الدروس', icon: ClipboardList },
    { href: '/horses', label: 'סוסים', sub: 'الخيول', icon: PawPrint },
    { href: '/riders', label: 'רוכבים', sub: 'الفرسان', icon: Users },
  ];

  return (
    <nav className="admin-mobile-dock" aria-label="ניווט מהיר">
      {items.map(({ href, label, sub, icon: Icon }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`admin-mobile-dock-item ${active ? 'is-active' : ''}`}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
            <small>{sub}</small>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children, title, subtitle, userName = 'מנהל החווה', farmName = 'مربط ابو ماجد', actions }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="admin-app" dir="rtl">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand" aria-label="דף הבית">
          <span className="admin-brand-mark"><img src="/brand/abu-majed-logo.jfif" alt="" /></span>
          <span className="admin-brand-copy"><strong>{farmName}</strong><small>Horse Farm Management</small></span>
        </Link>
        <NavContent />
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-home-link"><Home size={18} /> <span>האתר הראשי / الرئيسية</span></Link>
        </div>
      </aside>

      {open && <button className="admin-overlay" aria-label="סגירת תפריט" onClick={() => setOpen(false)} />}
      <aside className={`admin-mobile-drawer ${open ? 'is-open' : ''}`}>
        <div className="admin-mobile-head">
          <Link href="/" className="admin-brand" onClick={() => setOpen(false)}>
            <span className="admin-brand-mark"><img src="/brand/abu-majed-logo.jfif" alt="" /></span>
            <span className="admin-brand-copy"><strong>{farmName}</strong><small>Horse Farm Management</small></span>
          </Link>
          <button className="admin-icon-button" onClick={() => setOpen(false)} aria-label="סגירת תפריט"><X size={21} /></button>
        </div>
        <NavContent onNavigate={() => setOpen(false)} />
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-start">
            <button className="admin-icon-button admin-mobile-menu" onClick={() => setOpen(true)} aria-label="פתיחת תפריט"><Menu size={22} /></button>
            <div className="admin-page-heading">
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <div className="admin-topbar-end">
            {actions}
            <NotificationBell />
            <Link href="/account" className="admin-user-chip" aria-label="החשבון שלי / حسابي">
              <span className="admin-user-avatar">{userName.trim().charAt(0) || 'מ'}</span>
              <span><strong>{userName}</strong><small>ADMIN</small></span>
            </Link>
            <form action={logout}><button className="admin-logout-button" type="submit">יציאה / خروج</button></form>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
      <MobileDock />
    </div>
  );
}
