import Link from 'next/link';
import { logout } from '@/app/logout/actions';
import { NotificationBell } from '@/components/notification-bell';

export function SessionBar({ name, role }: { name: string; role: string }) {
  return (
    <header dir="rtl" className="portal-topbar">
      <div className="portal-topbar-inner">
        <Link href="/" className="portal-brand" aria-label="العودة للصفحة الرئيسية">
          <span className="portal-brand-mark">
            <img src="/brand/abu-majed-logo.png" alt="" />
          </span>
          <span className="portal-brand-copy">
            <strong lang="ar">مربط ابو ماجد</strong>
            <small>HORSE FARM</small>
          </span>
        </Link>

        <div className="portal-account">
          <NotificationBell />
          <span className="portal-role-badge">{role}</span>
          <Link href="/account" className="portal-user-name" aria-label="החשבון שלי / حسابي">{name}</Link>
          <form action={logout}>
            <button className="portal-logout">יציאה / خروج</button>
          </form>
        </div>
      </div>
    </header>
  );
}
