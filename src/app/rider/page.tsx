import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SessionBar } from '@/components/session-bar';

function formatDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default async function RiderPortal() {
  const user = await requireRole('RIDER');

  if (!user.riderId) {
    return (
      <>
        <SessionBar name={user.displayName} role="רוכב / فارس" />
        <main dir="rtl" className="portal-page">
          <div className="portal-container">
            <section className="portal-empty-card">
              <span className="portal-empty-kicker">ACCOUNT SETUP</span>
              <h1>החשבון עדיין לא מקושר / الحساب غير مرتبط بعد</h1>
              <p>יש לפנות למנהל החווה כדי לקשר את החשבון לכרטיס הרוכב.</p>
              <p>يرجى مراجعة مدير المربط لربط الحساب بملف الفارس.</p>
            </section>
          </div>
        </main>
      </>
    );
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [farm, rider, upcoming, completedCount, recentCompleted, progressHistory] = await Promise.all([
    prisma.farm.findUnique({ where: { id: user.farmId }, select: { name: true, timezone: true } }),
    prisma.rider.findFirst({ where: { id: user.riderId, farmId: user.farmId }, select: { name: true, phone: true, level: true, notes: true, isActive: true } }),
    prisma.lessonParticipant.findMany({
      where: { riderId: user.riderId, lesson: { farmId: user.farmId, startsAt: { gte: now }, status: { not: 'CANCELLED' } } },
      take: 20,
      orderBy: { lesson: { startsAt: 'asc' } },
      include: { horse: true, lesson: { include: { arena: true, instructor: true } } },
    }),
    prisma.lessonParticipant.count({
      where: { riderId: user.riderId, attendance: 'PRESENT', lesson: { farmId: user.farmId, status: 'COMPLETED', startsAt: { gte: thirtyDaysAgo, lt: now } } },
    }),
    prisma.lessonParticipant.findMany({
      where: { riderId: user.riderId, lesson: { farmId: user.farmId, status: 'COMPLETED', startsAt: { lt: now } } },
      take: 5,
      orderBy: { lesson: { startsAt: 'desc' } },
      include: { horse: true, lesson: { include: { arena: true, instructor: true } } },
    }),
    prisma.lessonParticipant.findMany({
      where: { riderId: user.riderId, progressScore: { not: null }, lesson: { farmId: user.farmId, status: { not: 'CANCELLED' } } },
      take: 12,
      orderBy: { lesson: { startsAt: 'desc' } },
      include: { horse: true, lesson: { include: { instructor: true } } },
    }),
  ]);

  const timeZone = farm?.timezone ?? 'Asia/Jerusalem';
  const nextLesson = upcoming[0] ?? null;
  const uniqueUpcomingHorses = new Set(upcoming.map((item) => item.horseId)).size;
  const scoredProgress = progressHistory.filter((item) => item.progressScore !== null);
  const averageProgress = scoredProgress.length
    ? scoredProgress.reduce((sum, item) => sum + (item.progressScore ?? 0), 0) / scoredProgress.length
    : null;

  return (
    <>
      <SessionBar name={user.displayName} role="רוכב / فارس" />
      <main dir="rtl" className="portal-page">
        <div className="portal-container">
          <section className="portal-welcome portal-welcome-rider">
            <div>
              <span className="portal-eyebrow">{farm?.name ?? 'مربط ابو ماجد'}</span>
              <h1>שלום {rider?.name ?? user.displayName}</h1>
              <p>כל השיעורים וההתקדמות שלך במקום אחד · دروسك وتقدمك في مكان واحد</p>
            </div>
            <div className="portal-live-chip"><span /> {rider?.isActive ? 'פעיל / نشط' : 'לא פעיל / غير نشط'}</div>
          </section>

          <section className="portal-stat-grid">
            <article className="portal-stat-card"><span>שיעורים קרובים / دروس قادمة</span><strong>{upcoming.length}</strong><small>מתוכננים עבורך / مخطط لك</small></article>
            <article className="portal-stat-card"><span>נוכחות ב־30 יום / حضور خلال 30 يوم</span><strong>{completedCount}</strong><small>שיעורים שהשתתפת בהם / دروس حضرتها</small></article>
            <article className="portal-stat-card"><span>סוסים קרובים / خيول قادمة</span><strong>{uniqueUpcomingHorses}</strong><small>בשיעורים הקרובים / في الدروس القادمة</small></article>
            <article className="portal-stat-card"><span>התקדמות ממוצעת / متوسط التقدم</span><strong>{averageProgress ? averageProgress.toFixed(1) : '—'}<em>/5</em></strong><small>לפי הערכות המדריכים / حسب تقييمات المدربين</small></article>
          </section>

          <section className="portal-next-card portal-next-rider">
            <div className="portal-next-copy">
              <span className="portal-next-label">השיעור הבא שלך / درسك القادم</span>
              {nextLesson ? (
                <>
                  <strong>{formatDateTime(nextLesson.lesson.startsAt, timeZone)}</strong>
                  <p>{nextLesson.lesson.instructor.name} · {nextLesson.horse.name}</p>
                  <div className="portal-next-tags"><span>{nextLesson.lesson.arena.nameHe} / {nextLesson.lesson.arena.nameAr}</span></div>
                </>
              ) : <strong>אין שיעורים עתידיים / لا توجد دروس قادمة</strong>}
            </div>
            <div className="portal-next-number">NEXT</div>
          </section>

          <div className="portal-rider-layout">
            <section className="portal-section">
              <div className="portal-section-head"><div><span className="portal-section-kicker">UPCOMING</span><h2>השיעורים הקרובים שלי / دروسي القادمة</h2><p>כל המידע שצריך לפני השיעור.</p></div></div>
              <div className="portal-upcoming-list">
                {upcoming.map((participant, index) => (
                  <article key={participant.id} className="portal-upcoming-card">
                    <span className="portal-upcoming-index">{String(index + 1).padStart(2, '0')}</span>
                    <div className="portal-upcoming-main">
                      <strong>{formatDateTime(participant.lesson.startsAt, timeZone)}</strong>
                      <p>{participant.lesson.arena.nameHe} / {participant.lesson.arena.nameAr}</p>
                    </div>
                    <div className="portal-upcoming-meta">
                      <span><small>מדריך / المدرب</small><strong>{participant.lesson.instructor.name}</strong></span>
                      <span><small>סוס / الحصان</small><strong>{participant.horse.name}</strong></span>
                    </div>
                    {participant.lesson.notes && <p className="portal-upcoming-note">{participant.lesson.notes}</p>}
                  </article>
                ))}
                {upcoming.length === 0 && <div className="portal-empty-line portal-empty-large">אין שיעורים עתידיים / لا توجد دروس قادمة</div>}
              </div>
            </section>

            <aside className="portal-rider-aside">
              <section className="portal-info-card">
                <span className="portal-section-kicker">PROFILE</span>
                <h2>הפרטים שלי / بياناتي</h2>
                <dl>
                  <div><dt>שם / الاسم</dt><dd>{rider?.name ?? user.displayName}</dd></div>
                  <div><dt>טלפון / الهاتف</dt><dd>{rider?.phone || '—'}</dd></div>
                  <div><dt>רמה / المستوى</dt><dd>{rider?.level || '—'}</dd></div>
                </dl>
              </section>

              <section className="portal-info-card">
                <span className="portal-section-kicker">RECENT</span>
                <h2>שיעורים אחרונים / دروس سابقة</h2>
                <div className="portal-history-list">
                  {recentCompleted.map((participant) => (
                    <div key={participant.id} className="portal-history-row">
                      <div><strong>{formatDateTime(participant.lesson.startsAt, timeZone)}</strong><small>{participant.lesson.instructor.name} · {participant.horse.name}</small></div>
                      <span className={`portal-attendance ${participant.attendance === 'PRESENT' ? 'is-present' : participant.attendance === 'ABSENT' ? 'is-absent' : 'is-unmarked'}`}>
                        {participant.attendance === 'PRESENT' ? 'נוכח / حاضر' : participant.attendance === 'ABSENT' ? 'נעדר / غائب' : 'לא סומן / غير محدد'}
                      </span>
                    </div>
                  ))}
                  {recentCompleted.length === 0 && <p className="portal-empty-line">עדיין אין שיעורים שהושלמו / لا توجد دروس مكتملة بعد</p>}
                </div>
              </section>

              <section className="portal-info-card portal-progress-card">
                <span className="portal-section-kicker">PROGRESS</span>
                <h2>ההתקדמות שלי / تقدمي</h2>
                <p className="portal-card-subtitle">הערכות והערות מהמדריכים</p>
                <div className="portal-progress-list">
                  {progressHistory.map((participant) => (
                    <div key={participant.id} className="portal-progress-row">
                      <div className="portal-progress-row-head">
                        <div><strong>{formatDateTime(participant.lesson.startsAt, timeZone)}</strong><small>{participant.lesson.instructor.name} · {participant.horse.name}</small></div>
                        <span>{participant.progressScore} / 5</span>
                      </div>
                      {participant.instructorNote && <p>{participant.instructorNote}</p>}
                    </div>
                  ))}
                  {progressHistory.length === 0 && <p className="portal-empty-line">עדיין אין הערכות התקדמות / لا توجد تقييمات تقدم بعد</p>}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
