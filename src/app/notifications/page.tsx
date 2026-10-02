import { Bell, Check, CheckCheck } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncNotificationsForUser } from '@/lib/notifications';
import { AdminShell } from '@/components/admin-shell';
import { SessionBar } from '@/components/session-bar';
import { PushNotificationSettings } from '@/components/push-notification-settings';
import { NotificationPreferences } from '@/components/notification-preferences';
import { markAllNotificationsRead, markNotificationRead, openNotification } from './actions';

function formatStamp(date: Date) {
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function NotificationContent({ notifications, role, preferences }: { notifications: Awaited<ReturnType<typeof loadNotifications>>; role: Awaited<ReturnType<typeof loadPreferenceState>>['role']; preferences: Awaited<ReturnType<typeof loadPreferenceState>>['preferences'] }) {
  const unread = notifications.filter((item) => item.readAt === null).length;

  return (
    <div className="notification-page-shell" dir="rtl">
      <section className="notification-page-hero">
        <div>
          <span className="notification-page-kicker">NOTIFICATIONS</span>
          <h2>התראות / الإشعارات</h2>
          <p>עדכונים חשובים על שיעורים, טיפולים ופעילות בחווה.</p>
        </div>
        <div className="notification-page-hero-actions">
          <span className="notification-unread-summary"><Bell size={17} /> {unread} לא נקראו / غير مقروءة</span>
          {unread > 0 && (
            <form action={markAllNotificationsRead}>
              <button className="notification-mark-all" type="submit"><CheckCheck size={17} /> סמן הכל כנקרא</button>
            </form>
          )}
        </div>
      </section>

      <PushNotificationSettings />
      <NotificationPreferences role={role} preferences={preferences} />

      <section className="notification-list">
        {notifications.map((item) => (
          <article key={item.id} className={`notification-card ${item.readAt ? '' : 'is-unread'}`}>
            <div className="notification-card-icon"><Bell size={18} /></div>
            <div className="notification-card-copy">
              <div className="notification-card-head">
                <div>
                  <strong>{item.titleHe}</strong>
                  <span lang="ar">{item.titleAr}</span>
                </div>
                <time>{formatStamp(item.createdAt)}</time>
              </div>
              {item.bodyHe && <p>{item.bodyHe}</p>}
              {item.bodyAr && <p lang="ar" className="notification-card-ar">{item.bodyAr}</p>}
              <div className="notification-card-actions">
                {item.href && (
                  <form action={openNotification}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="href" value={item.href} />
                    <button className="notification-open-button" type="submit">פתח / فتح</button>
                  </form>
                )}
                {!item.readAt && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="notification-read-button" type="submit"><Check size={15} /> סמן כנקרא</button>
                  </form>
                )}
              </div>
            </div>
          </article>
        ))}
        {notifications.length === 0 && (
          <div className="notification-empty">
            <Bell size={28} />
            <strong>אין התראות כרגע / لا توجد إشعارات حالياً</strong>
            <span>כשתהיה פעילות שדורשת את תשומת הלב שלך היא תופיע כאן.</span>
          </div>
        )}
      </section>
    </div>
  );
}


async function loadPreferenceState(userId: number, role: 'ADMIN' | 'INSTRUCTOR' | 'RIDER') {
  const preference = await prisma.notificationPreference.findUnique({ where: { userId } });
  return {
    role,
    preferences: {
      lessonUpcoming: preference?.lessonUpcoming ?? true,
      lessonCreated: preference?.lessonCreated ?? true,
      lessonUpdated: preference?.lessonUpdated ?? true,
      lessonCancelled: preference?.lessonCancelled ?? true,
      treatmentDue: preference?.treatmentDue ?? true,
    },
  };
}

async function loadNotifications(userId: number) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return [...rows.filter((item) => item.readAt === null), ...rows.filter((item) => item.readAt !== null)];
}

export default async function NotificationsPage() {
  const user = await requireUser();
  await syncNotificationsForUser(user);
  const [notifications, preferenceState] = await Promise.all([
    loadNotifications(user.id),
    loadPreferenceState(user.id, user.role),
  ]);
  const content = <NotificationContent notifications={notifications} role={preferenceState.role} preferences={preferenceState.preferences} />;

  if (user.role === 'ADMIN') {
    return (
      <AdminShell
        userName={user.displayName}
        title="התראות / الإشعارات"
        subtitle="עדכונים חשובים מהחווה"
      >
        {content}
      </AdminShell>
    );
  }

  return (
    <>
      <SessionBar name={user.displayName} role={user.role === 'INSTRUCTOR' ? 'מדריך / مدرب' : 'רוכב / فارس'} />
      <main className="portal-page">
        <div className="portal-container">{content}</div>
      </main>
    </>
  );
}
