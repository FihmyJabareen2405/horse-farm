import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SessionBar } from '@/components/session-bar';
import { completeLesson, saveParticipantProgress, setAttendance } from './actions';

function formatDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function attendanceLabel(status: 'UNMARKED' | 'PRESENT' | 'ABSENT') {
  if (status === 'PRESENT') return 'נוכח / حاضر';
  if (status === 'ABSENT') return 'נעדר / غائب';
  return 'לא סומן / غير محدد';
}

function attendanceClass(status: 'UNMARKED' | 'PRESENT' | 'ABSENT') {
  if (status === 'PRESENT') return 'is-present';
  if (status === 'ABSENT') return 'is-absent';
  return 'is-unmarked';
}

export default async function InstructorPortal() {
  const user = await requireRole('INSTRUCTOR');

  if (!user.instructorId) {
    return (
      <>
        <SessionBar name={user.displayName} role="מדריך / مدرب" />
        <main dir="rtl" className="portal-page">
          <div className="portal-container">
            <section className="portal-empty-card">
              <span className="portal-empty-kicker">ACCOUNT SETUP</span>
              <h1>החשבון עדיין לא מקושר / الحساب غير مرتبط بعد</h1>
              <p>יש לפנות למנהל החווה כדי לקשר את החשבון לכרטיס המדריך.</p>
              <p>يرجى مراجعة مدير المربط لربط الحساب بملف المدرب.</p>
            </section>
          </div>
        </main>
      </>
    );
  }

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [farm, instructor, upcomingLessons, weekLessons, trackingLessons] = await Promise.all([
    prisma.farm.findUnique({
      where: { id: user.farmId },
      select: { name: true, timezone: true },
    }),
    prisma.instructor.findFirst({
      where: { id: user.instructorId, farmId: user.farmId },
      select: { name: true, phone: true, isActive: true },
    }),
    prisma.lesson.findMany({
      where: {
        farmId: user.farmId,
        instructorId: user.instructorId,
        startsAt: { gte: now },
        status: { not: 'CANCELLED' },
      },
      take: 20,
      orderBy: { startsAt: 'asc' },
      include: {
        arena: true,
        participants: {
          include: { rider: true, horse: true },
          orderBy: { rider: { name: 'asc' } },
        },
      },
    }),
    prisma.lesson.findMany({
      where: {
        farmId: user.farmId,
        instructorId: user.instructorId,
        startsAt: { gte: now, lt: weekEnd },
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        participants: { select: { riderId: true, horseId: true } },
      },
    }),
    prisma.lesson.findMany({
      where: {
        farmId: user.farmId,
        instructorId: user.instructorId,
        startsAt: { gte: sevenDaysAgo },
        status: { not: 'CANCELLED' },
      },
      take: 30,
      orderBy: { startsAt: 'desc' },
      include: {
        arena: true,
        participants: {
          include: { rider: true, horse: true },
          orderBy: { rider: { name: 'asc' } },
        },
      },
    }),
  ]);

  const timeZone = farm?.timezone ?? 'Asia/Jerusalem';
  const uniqueRiders = new Set(weekLessons.flatMap((lesson) => lesson.participants.map((p) => p.riderId))).size;
  const uniqueHorses = new Set(weekLessons.flatMap((lesson) => lesson.participants.map((p) => p.horseId))).size;
  const nextLesson = upcomingLessons[0] ?? null;

  return (
    <>
      <SessionBar name={user.displayName} role="מדריך / مدرب" />
      <main dir="rtl" className="portal-page">
        <div className="portal-container">
          <section className="portal-welcome portal-welcome-instructor">
            <div>
              <span className="portal-eyebrow">{farm?.name ?? 'مربط ابو ماجد'}</span>
              <h1>שלום {instructor?.name ?? user.displayName}</h1>
              <p>מרכז העבודה שלך להיום · لوحة عمل المدرب لليوم</p>
            </div>
            <div className="portal-live-chip"><span /> {instructor?.isActive ? 'פעיל / نشط' : 'לא פעיל / غير نشط'}</div>
          </section>

          <section className="portal-stat-grid">
            <article className="portal-stat-card"><span>שיעורים ב־7 ימים / دروس خلال 7 أيام</span><strong>{weekLessons.length}</strong><small>השבוע הקרוב / الأسبوع القادم</small></article>
            <article className="portal-stat-card"><span>רוכבים שונים / فرسان مختلفون</span><strong>{uniqueRiders}</strong><small>ברשימת השיעורים / في جدول الدروس</small></article>
            <article className="portal-stat-card"><span>סוסים שונים / خيول مختلفة</span><strong>{uniqueHorses}</strong><small>משובצים לשיעורים / مخصصة للدروس</small></article>
            <article className="portal-stat-card"><span>טלפון / هاتف</span><strong className="is-phone">{instructor?.phone || '—'}</strong><small>פרטי המדריך / بيانات المدرب</small></article>
          </section>

          <section className="portal-next-card">
            <div className="portal-next-copy">
              <span className="portal-next-label">השיעור הבא / الدرس القادم</span>
              {nextLesson ? (
                <>
                  <strong>{formatDateTime(nextLesson.startsAt, timeZone)}</strong>
                  <p>{nextLesson.arena.nameHe} / {nextLesson.arena.nameAr}</p>
                  <div className="portal-next-tags">
                    {nextLesson.participants.map((p) => <span key={p.id}>{p.rider.name} · {p.horse.name}</span>)}
                    {nextLesson.participants.length === 0 && <span>אין משתתפים / لا يوجد مشاركون</span>}
                  </div>
                </>
              ) : <strong>אין שיעורים עתידיים / لا توجد دروس قادمة</strong>}
            </div>
            <div className="portal-next-number">01</div>
          </section>

          <section className="portal-section">
            <div className="portal-section-head">
              <div>
                <span className="portal-section-kicker">LESSON TRACKING</span>
                <h2>מעקב שיעורים / متابعة الدروس</h2>
                <p>נוכחות, התקדמות, הערות מקצועיות וסיום שיעור.</p>
              </div>
            </div>

            <div className="portal-lesson-stack">
              {trackingLessons.map((lesson) => {
                const canComplete = lesson.status === 'SCHEDULED' && lesson.startsAt.getTime() <= now.getTime();
                return (
                  <article key={lesson.id} className="portal-lesson-card">
                    <div className="portal-lesson-head">
                      <div>
                        <span className="portal-lesson-date">{formatDateTime(lesson.startsAt, timeZone)}</span>
                        <p>{lesson.arena.nameHe} / {lesson.arena.nameAr}</p>
                      </div>
                      <div className="portal-lesson-actions">
                        <span className={`portal-status ${lesson.status === 'COMPLETED' ? 'is-completed' : 'is-scheduled'}`}>
                          {lesson.status === 'COMPLETED' ? 'הושלם / مكتمل' : 'מתוכנן / مجدول'}
                        </span>
                        {canComplete && (
                          <form action={completeLesson}>
                            <input type="hidden" name="lessonId" value={lesson.id} />
                            <button className="portal-primary-button">סמן כהושלם / إنهاء الدرس</button>
                          </form>
                        )}
                      </div>
                    </div>

                    {lesson.notes && <p className="portal-admin-note">הערת מנהל / ملاحظة الإدارة: {lesson.notes}</p>}

                    <div className="portal-participant-grid">
                      {lesson.participants.map((participant) => (
                        <div key={participant.id} className="portal-participant-card">
                          <div className="portal-participant-head">
                            <div><strong>{participant.rider.name}</strong><small>{participant.horse.name}</small></div>
                            <span className={`portal-attendance ${attendanceClass(participant.attendance)}`}>{attendanceLabel(participant.attendance)}</span>
                          </div>

                          <form action={setAttendance} className="portal-attendance-actions">
                            <input type="hidden" name="participantId" value={participant.id} />
                            <button name="attendance" value="PRESENT" className="is-present">נוכח / حاضر</button>
                            <button name="attendance" value="ABSENT" className="is-absent">נעדר / غائب</button>
                            <button name="attendance" value="UNMARKED" className="is-reset">איפוס / إعادة</button>
                          </form>

                          <form action={saveParticipantProgress} className="portal-progress-form">
                            <input type="hidden" name="participantId" value={participant.id} />
                            <label>התקדמות / التقدم</label>
                            <div className="portal-score-row">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <label key={score} className="portal-score-option">
                                  <input type="radio" name="progressScore" value={score} defaultChecked={participant.progressScore === score} />
                                  <span>{score}</span>
                                </label>
                              ))}
                            </div>
                            <small>1 = בתחילת הדרך · 5 = התקדמות מצוינת</small>
                            <label>הערה מקצועית / ملاحظة مهنية</label>
                            <textarea name="instructorNote" defaultValue={participant.instructorNote ?? ''} maxLength={2000} rows={3} placeholder="התקדמות, דגשים, תרגול... / تقدم، ملاحظات، تدريب..." />
                            <button className="portal-secondary-button">שמור התקדמות / حفظ التقدم</button>
                          </form>
                        </div>
                      ))}
                      {lesson.participants.length === 0 && <p className="portal-empty-line">אין משתתפים / لا يوجد مشاركون</p>}
                    </div>
                  </article>
                );
              })}
              {trackingLessons.length === 0 && <div className="portal-empty-line portal-empty-large">אין שיעורים למעקב / لا توجد دروس للمتابعة</div>}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
