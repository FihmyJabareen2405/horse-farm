'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  CalendarDays,
  Download,
  ExternalLink,
  PawPrint,
  RefreshCw,
  Settings,
  UserPlus,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { AdminShell } from '@/components/admin-shell';
import styles from './farm-dashboard-daily.module.css';

type Farm = {
  id: number;
  name: string;
  timezone: string;
  arenas: {
    id: number;
    code: string;
    nameHe: string;
    nameAr: string;
    isActive: boolean;
  }[];
  _count: {
    horses: number;
    riders: number;
    instructors: number;
    lessons: number;
  };
};

type TodayLesson = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  instructorName: string;
  arenaHe: string;
  arenaAr: string;
  participants: { riderName: string; horseName: string }[];
};

const copy = {
  he: {
    title: 'לוח ניהול החווה',
    subtitle: 'ניהול שוטף ותמונת מצב',
    eyebrow: 'HORSE FARM MANAGEMENT',
    intro: 'כל מה שקורה בחווה, במקום אחד.',
    refresh: 'רענון נתונים',
    refreshing: 'טוען…',
    horses: 'סוסים',
    riders: 'רוכבים',
    instructors: 'מדריכים',
    lessons: 'שיעורים',
    arenas: 'המגרשים בחווה',
    arenasSub: 'סטטוס המגרשים והאזורים הפעילים',
    active: 'פעיל',
    inactive: 'לא פעיל',
    connected: 'המערכת מחוברת והנתונים מעודכנים',
    quick: 'פעולות מהירות',
    quickSub: 'גישה מהירה לפעולות הנפוצות',
    addLesson: 'ניהול שיעורים',
    addLessonSub: 'יצירה, שינוי ושיבוץ',
    addHorse: 'ניהול סוסים',
    addHorseSub: 'כרטיסים, מצב והערות',
    addRider: 'ניהול רוכבים',
    addRiderSub: 'פרטים, נוכחות והתקדמות',
    reports: 'דוחות וסטטיסטיקות',
    reportsSub: 'נוכחות, עומסים ושימוש בסוסים',
    settings: 'הגדרות החווה',
    settingsSub: 'מגרשים, פרטים והגדרות',
    noArenas: 'עדיין לא נוספו מגרשים.',
    empty:
      'לא נמצאה חווה. הרץ את קובץ seed.sql במסד הנתונים של הפרויקט.',
    multiple: 'נמצאה יותר מחווה אחת.',
    connection:
      'לא הצלחנו לטעון את הנתונים. בדוק את DATABASE_URL ואת החיבור למסד הנתונים.',
    todayJournal: 'יומן פעילות היום',
    todayJournalSub: 'השיעורים והשיבוצים של היום במקום אחד',
    openJournal: 'פתיחת היומן המלא',
    downloadExcel: 'הורדת Excel',
    time: 'שעה',
    arena: 'מגרש',
    instructor: 'מדריך',
    rider: 'רוכב',
    horse: 'סוס',
    status: 'סטטוס',
    noActivity: 'אין פעילות מתוכננת להיום.',
    SCHEDULED: 'מתוכנן',
    COMPLETED: 'הושלם',
    CANCELLED: 'בוטל',
  },
  ar: {
    title: 'لوحة إدارة المزرعة',
    subtitle: 'إدارة يومية ونظرة شاملة',
    eyebrow: 'HORSE FARM MANAGEMENT',
    intro: 'كل ما يحدث في المزرعة، في مكان واحد.',
    refresh: 'تحديث البيانات',
    refreshing: 'جارٍ التحميل…',
    horses: 'الخيول',
    riders: 'الفرسان',
    instructors: 'المدربون',
    lessons: 'الدروس',
    arenas: 'ميادين المزرعة',
    arenasSub: 'حالة الميادين والمناطق النشطة',
    active: 'نشط',
    inactive: 'غير نشط',
    connected: 'النظام متصل والبيانات محدثة',
    quick: 'إجراءات سريعة',
    quickSub: 'وصول سريع للمهام الأكثر استخدامًا',
    addLesson: 'إدارة الدروس',
    addLessonSub: 'إنشاء وتعديل وجدولة',
    addHorse: 'إدارة الخيول',
    addHorseSub: 'بطاقات وحالة وملاحظات',
    addRider: 'إدارة الفرسان',
    addRiderSub: 'بيانات وحضور وتقدم',
    reports: 'التقارير والإحصائيات',
    reportsSub: 'الحضور والأحمال واستخدام الخيول',
    settings: 'إعدادات المزرعة',
    settingsSub: 'الميادين والبيانات والإعدادات',
    noArenas: 'لم تتم إضافة ميادين بعد.',
    empty:
      'لم يتم العثور على مزرعة. شغّل ملف seed.sql في قاعدة البيانات.',
    multiple: 'تم العثور على أكثر من مزرعة.',
    connection:
      'تعذّر تحميل البيانات. تحقق من DATABASE_URL والاتصال بقاعدة البيانات.',
    todayJournal: 'سجل نشاط اليوم',
    todayJournalSub: 'دروس وحجوزات اليوم في مكان واحد',
    openJournal: 'فتح الجدول الكامل',
    downloadExcel: 'تنزيل Excel',
    time: 'الساعة',
    arena: 'الميدان',
    instructor: 'المدرب',
    rider: 'الفارس',
    horse: 'الحصان',
    status: 'الحالة',
    noActivity: 'لا توجد أنشطة مجدولة اليوم.',
    SCHEDULED: 'مجدول',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغى',
  },
};

export function FarmDashboard({
  farm,
  issue,
  userName,
  today,
  zone = 'Asia/Jerusalem',
  todayLessons = [],
}: {
  farm?: Farm;
  issue?: 'empty' | 'multiple' | 'connection';
  userName?: string;
  today?: string;
  zone?: string;
  todayLessons?: TodayLesson[];
}) {
  const [language, setLanguage] = useState<'he' | 'ar'>('he');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = copy[language];

  const stats = farm
    ? [
        { label: t.horses, value: farm._count.horses, icon: PawPrint },
        { label: t.riders, value: farm._count.riders, icon: Users },
        {
          label: t.instructors,
          value: farm._count.instructors,
          icon: UserRoundCheck,
        },
        { label: t.lessons, value: farm._count.lessons, icon: CalendarDays },
      ]
    : [];

  function time(iso: string) {
    return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'ar', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(iso));
  }

  function fullDate(day: string) {
    return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'ar', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(`${day}T12:00:00Z`));
  }

  const dailyRows = todayLessons.flatMap((lesson) => {
    const participants =
      lesson.participants.length > 0
        ? lesson.participants
        : [{ riderName: '—', horseName: '—' }];

    return participants.map((participant, index) => ({
      key: `${lesson.id}-${index}`,
      start: time(lesson.startsAt),
      end: time(lesson.endsAt),
      arena: language === 'he' ? lesson.arenaHe : lesson.arenaAr,
      instructor: lesson.instructorName,
      rider: participant.riderName,
      horse: participant.horseName,
      status: lesson.status,
    }));
  });

  const actions = (
    <>
      <button
        type="button"
        title={t.refresh}
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
        className="dashboard-refresh-button"
      >
        <RefreshCw size={17} className={pending ? 'animate-spin' : ''} />
      </button>
      <button
        type="button"
        lang={language === 'he' ? 'ar' : 'he'}
        onClick={() => setLanguage(language === 'he' ? 'ar' : 'he')}
        className="dashboard-language-button"
      >
        {language === 'he' ? 'العربية' : 'עברית'}
      </button>
    </>
  );

  return (
    <AdminShell
      title={t.title}
      subtitle={t.subtitle}
      farmName={farm?.name}
      userName={userName}
      actions={actions}
    >
      <div lang={language} dir="rtl" aria-busy={pending}>
        {issue && <div role="alert" className="dashboard-alert">{t[issue]}</div>}

        <section className="dashboard-hero">
          <div className="dashboard-eyebrow">{t.eyebrow}</div>
          <h2>{farm?.name ?? t.title}</h2>
          <p>{t.intro}</p>
          {farm && (
            <span className="dashboard-status">
              <span className="dashboard-status-dot" />
              {t.connected}
            </span>
          )}
        </section>

        {farm && (
          <>
            <section className="dashboard-stat-grid" aria-label={t.title}>
              {stats.map(({ label, value, icon: Icon }) => (
                <article className="dashboard-stat" key={label}>
                  <div className="dashboard-stat-head">
                    <span>{label}</span>
                    <span className="dashboard-stat-icon">
                      <Icon size={19} />
                    </span>
                  </div>
                  <div className="dashboard-stat-value">{value}</div>
                </article>
              ))}
            </section>

            {today && (
              <section className={styles.dailyPanel}>
                <div className={styles.dailyHead}>
                  <div>
                    <span className={styles.kicker}>DAILY ACTIVITY</span>
                    <h3>{t.todayJournal}</h3>
                    <p>
                      {fullDate(today)} · {t.todayJournalSub}
                    </p>
                  </div>

                  <div className={styles.dailyActions}>
                    <Link
                      href={`/lessons/week?date=${today}`}
                      className={styles.openButton}
                    >
                      <ExternalLink size={15} />
                      <span>{t.openJournal}</span>
                    </Link>
                    <a
                      href={`/api/lessons/day/export/xlsx?date=${today}&status=active`}
                      className={styles.excelButton}
                    >
                      <Download size={15} />
                      <span>{t.downloadExcel}</span>
                    </a>
                  </div>
                </div>

                {dailyRows.length === 0 ? (
                  <div className={styles.empty}>{t.noActivity}</div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>{t.time}</th>
                          <th>{t.arena}</th>
                          <th>{t.instructor}</th>
                          <th>{t.rider}</th>
                          <th>{t.horse}</th>
                          <th>{t.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyRows.map((row) => (
                          <tr key={row.key}>
                            <td>
                              <strong>
                                {row.start}–{row.end}
                              </strong>
                            </td>
                            <td>{row.arena}</td>
                            <td>{row.instructor}</td>
                            <td>{row.rider}</td>
                            <td>{row.horse}</td>
                            <td>
                              <span
                                className={`${styles.status} ${
                                  row.status === 'COMPLETED'
                                    ? styles.completed
                                    : styles.scheduled
                                }`}
                              >
                                {t[row.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            <section className="dashboard-section-grid">
              <article className="dashboard-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <h3>{t.arenas}</h3>
                    <p>{t.arenasSub}</p>
                  </div>
                </div>
                <div className="dashboard-arena-list">
                  {farm.arenas.map((arena) => (
                    <div className="dashboard-arena" key={arena.id}>
                      <span className="dashboard-arena-code">{arena.code}</span>
                      <span>
                        <strong>
                          {language === 'he' ? arena.nameHe : arena.nameAr}
                        </strong>
                        <small>{arena.isActive ? t.active : t.inactive}</small>
                      </span>
                    </div>
                  ))}
                </div>
                {farm.arenas.length === 0 && (
                  <p className="text-sm text-stone-500">{t.noArenas}</p>
                )}
              </article>

              <article className="dashboard-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <h3>{t.quick}</h3>
                    <p>{t.quickSub}</p>
                  </div>
                </div>
                <div className="dashboard-quick-grid">
                  <Link href="/lessons" className="dashboard-quick">
                    <span className="dashboard-quick-icon">
                      <CalendarDays size={18} />
                    </span>
                    <span>
                      <strong>{t.addLesson}</strong>
                      <small>{t.addLessonSub}</small>
                    </span>
                  </Link>
                  <Link href="/horses" className="dashboard-quick">
                    <span className="dashboard-quick-icon">
                      <PawPrint size={18} />
                    </span>
                    <span>
                      <strong>{t.addHorse}</strong>
                      <small>{t.addHorseSub}</small>
                    </span>
                  </Link>
                  <Link href="/riders" className="dashboard-quick">
                    <span className="dashboard-quick-icon">
                      <UserPlus size={18} />
                    </span>
                    <span>
                      <strong>{t.addRider}</strong>
                      <small>{t.addRiderSub}</small>
                    </span>
                  </Link>
                  <Link href="/reports" className="dashboard-quick">
                    <span className="dashboard-quick-icon">
                      <Activity size={18} />
                    </span>
                    <span>
                      <strong>{t.reports}</strong>
                      <small>{t.reportsSub}</small>
                    </span>
                  </Link>
                  <Link href="/settings" className="dashboard-quick">
                    <span className="dashboard-quick-icon">
                      <Settings size={18} />
                    </span>
                    <span>
                      <strong>{t.settings}</strong>
                      <small>{t.settingsSub}</small>
                    </span>
                  </Link>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}
