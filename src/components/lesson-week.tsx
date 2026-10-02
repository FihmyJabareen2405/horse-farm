'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { localStamp, moveDay } from '@/lib/lesson-time';
import { lessonTouchesDay, weekDates } from '@/lib/lesson-week';
import styles from './lesson-week-calendar.module.css';

type Lesson = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  instructorId: number;
  instructorName: string;
  arenaId: number;
  arenaHe: string;
  arenaAr: string;
  participants: { riderName: string; horseName: string }[];
};

const words = {
  he: {
    title: 'יומן שבועי',
    intro: 'כל השבוע — ראשון עד שבת',
    back: 'לוח הניהול',
    daily: 'ניהול שיעורים',
    previous: 'שבוע קודם',
    next: 'שבוע הבא',
    current: 'השבוע הנוכחי',
    date: 'בחירת תאריך בשבוע',
    refresh: 'רענון',
    instructors: 'כל המדריכים',
    arenas: 'כל המגרשים',
    statuses: 'כל המצבים',
    active: 'ללא שיעורים שבוטלו',
    SCHEDULED: 'מתוכנן',
    COMPLETED: 'הושלם',
    CANCELLED: 'בוטל',
    empty: 'אין שיעורים להצגה',
    open: 'פתיחת היום / שיבוץ',
    today: 'היום',
    count: 'שיעורים לפי הסינון',
    riders: 'שיבוצי משתתפים',
    hint: 'לחץ על יום ב־Calendar כדי לראות את הפעילות היומית. היומן השבועי נשאר זמין מתחת לטבלה.',
    farm: 'נדרשת חווה אחת מוגדרת במערכת.',
    save: 'לא הצלחנו לטעון את היומן. בדוק את החיבור ונסה לרענן.',
    horse: 'סוס',
    instructor: 'מדריך',
    arena: 'מגרש',
    from: 'התחיל בתאריך',
    reset: 'איפוס סינון',
    zone: 'אזור זמן',
    monthCalendar: 'Calendar חודשי',
    activityDay: 'יום עם פעילות',
    selected: 'היום שנבחר',
    daySchedule: 'טבלת פעילות יומית',
    noDaily: 'אין פעילות להצגה ביום שנבחר לפי הסינון הנוכחי.',
    time: 'שעה',
    rider: 'רוכב',
    status: 'סטטוס',
    dailyCount: 'שיעורים',
    participantCount: 'רוכבים',
    previousMonth: 'חודש קודם',
    nextMonth: 'חודש הבא',
    exportExcel: 'הורדת Excel',
  },
  ar: {
    title: 'الجدول الأسبوعي',
    intro: 'الأسبوع كاملاً — من الأحد إلى السبت',
    back: 'لوحة الإدارة',
    daily: 'إدارة الدروس',
    previous: 'الأسبوع السابق',
    next: 'الأسبوع التالي',
    current: 'الأسبوع الحالي',
    date: 'اختيار تاريخ ضمن الأسبوع',
    refresh: 'تحديث',
    instructors: 'جميع المدربين',
    arenas: 'جميع الميادين',
    statuses: 'جميع الحالات',
    active: 'دون الدروس الملغاة',
    SCHEDULED: 'مجدول',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغى',
    empty: 'لا توجد دروس للعرض',
    open: 'فتح اليوم / إضافة درس',
    today: 'اليوم',
    count: 'دروس حسب التصفية',
    riders: 'حجوزات المشاركين',
    hint: 'اضغط على يوم في التقويم لعرض النشاط اليومي. يبقى الجدول الأسبوعي متاحاً أسفل الجدول.',
    farm: 'يجب إعداد مزرعة واحدة في النظام.',
    save: 'تعذّر تحميل الجدول. تحقق من الاتصال وحاول التحديث.',
    horse: 'الحصان',
    instructor: 'المدرب',
    arena: 'الميدان',
    from: 'بدأ بتاريخ',
    reset: 'إعادة ضبط التصفية',
    zone: 'المنطقة الزمنية',
    monthCalendar: 'التقويم الشهري',
    activityDay: 'يوم فيه نشاط',
    selected: 'اليوم المختار',
    daySchedule: 'جدول النشاط اليومي',
    noDaily: 'لا توجد أنشطة في اليوم المختار حسب التصفية الحالية.',
    time: 'الساعة',
    rider: 'الفارس',
    status: 'الحالة',
    dailyCount: 'دروس',
    participantCount: 'فرسان',
    previousMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    exportExcel: 'تنزيل Excel',
  },
};

function shiftMonth(day: string, delta: number) {
  const [year, month] = day.slice(0, 7).split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1 + delta, 1, 12, 0, 0));
  return value.toISOString().slice(0, 10);
}

function monthInfo(day: string) {
  const [year, month] = day.slice(0, 7).split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return { year, month, daysInMonth, firstWeekDay };
}

export function LessonWeek({
  lessons,
  days,
  today,
  zone,
  selectedDay,
  activityDays,
  issue,
}: {
  lessons: Lesson[];
  days: string[];
  today: string;
  zone: string;
  selectedDay: string;
  activityDays: string[];
  issue?: 'farm' | 'save';
}) {
  const [lang, setLang] = useState<'he' | 'ar'>('he');
  const [instructor, setInstructor] = useState('all');
  const [arena, setArena] = useState('all');
  const [status, setStatus] = useState('active');
  const [pending, startTransition] = useTransition();

  const router = useRouter();
  const t = words[lang];
  const button =
    'rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm disabled:opacity-50';

  const instructorOptions = [
    ...new Map(
      lessons.map((lesson) => [
        String(lesson.instructorId),
        lesson.instructorName,
      ]),
    ).entries(),
  ];

  const arenaOptions = [
    ...new Map(
      lessons.map((lesson) => [
        String(lesson.arenaId),
        lang === 'he' ? lesson.arenaHe : lesson.arenaAr,
      ]),
    ).entries(),
  ];

  const filtered = lessons.filter(
    (lesson) =>
      (instructor === 'all' ||
        String(lesson.instructorId) === instructor) &&
      (arena === 'all' || String(lesson.arenaId) === arena) &&
      (status === 'all' ||
        (status === 'active'
          ? lesson.status !== 'CANCELLED'
          : lesson.status === status)),
  );

  const dailyLessons = filtered.filter((lesson) =>
    lessonTouchesDay(lesson, selectedDay, zone),
  );

  const dailyParticipantCount = dailyLessons.reduce(
    (sum, lesson) => sum + lesson.participants.length,
    0,
  );

  const exportParams = new URLSearchParams({
    date: selectedDay,
    instructor,
    arena,
    status,
  });
  const exportHref = `/api/lessons/day/export/xlsx?${exportParams.toString()}`;

  function canGo(day: string) {
    try {
      weekDates(day);
      return true;
    } catch {
      return false;
    }
  }

  function go(day: string) {
    if (!canGo(day)) return;
    startTransition(() =>
      router.push(`/lessons/week?date=${day}`, { scroll: false }),
    );
  }

  function date(day: string, weekday = false) {
    return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'ar', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      ...(weekday
        ? { weekday: 'long' as const }
        : { year: 'numeric' as const }),
    }).format(new Date(`${day}T12:00:00Z`));
  }

  function fullDate(day: string) {
    return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'ar', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(`${day}T12:00:00Z`));
  }

  function monthTitle(day: string) {
    return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'ar', {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${day.slice(0, 7)}-01T12:00:00Z`));
  }

  function time(iso: string) {
    return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'ar', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(iso));
  }

  const { year, month, daysInMonth, firstWeekDay } = monthInfo(selectedDay);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
  const activitySet = new Set(activityDays);
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const weekDayLabels =
    lang === 'he'
      ? ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
      : ['أ', 'إ', 'ث', 'أ', 'خ', 'ج', 'س'];

  return (
    <main
      dir="rtl"
      lang={lang}
      className="min-h-screen bg-[#f5f3ee] px-4 py-8 text-[#243c32] sm:px-6"
    >
      <div className="mx-auto max-w-[1700px]">
        <nav className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-5">
            <Link href="/admin" className="underline underline-offset-4">
              {t.back}
            </Link>
            <Link
              href={`/lessons?date=${selectedDay}`}
              className="underline underline-offset-4"
            >
              {t.daily}
            </Link>
          </div>

          <button
            type="button"
            className={button}
            lang={lang === 'he' ? 'ar' : 'he'}
            onClick={() => setLang(lang === 'he' ? 'ar' : 'he')}
          >
            {lang === 'he' ? 'العربية' : 'עברית'}
          </button>
        </nav>

        <header className="rounded-3xl bg-[#243c32] p-7 text-white">
          <p className="text-sm text-[#d8bf8b]">{t.intro}</p>
          <h1 className="mt-3 text-3xl font-bold">{t.title}</h1>
          <p className="mt-3 text-lg">
            <bdi>
              {date(days[0])} – {date(days[6])}
            </bdi>
          </p>
          <p className="mt-3 text-xs text-white/70">
            {t.zone}: <bdi>{zone}</bdi>
          </p>
        </header>

        {issue ? (
          <p role="alert" className="mt-6 rounded-xl bg-amber-100 p-5">
            {t[issue]}{' '}
            <button
              type="button"
              onClick={() => startTransition(() => router.refresh())}
              className="underline"
            >
              {t.refresh}
            </button>
          </p>
        ) : (
          <>
            <section className={styles.calendarCard}>
              <div className={styles.calendarHead}>
                <div>
                  <span className={styles.kicker}>
                    <CalendarDays size={16} /> {t.monthCalendar}
                  </span>
                  <h2>{monthTitle(selectedDay)}</h2>
                  <p>{t.hint}</p>
                </div>

                <div className={styles.calendarNav}>
                  <button
                    type="button"
                    onClick={() => go(shiftMonth(selectedDay, -1))}
                    disabled={pending}
                    aria-label={t.previousMonth}
                  >
                    <ChevronRight size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(today)}
                    disabled={pending}
                  >
                    {t.today}
                  </button>
                  <button
                    type="button"
                    onClick={() => go(shiftMonth(selectedDay, 1))}
                    disabled={pending}
                    aria-label={t.nextMonth}
                  >
                    <ChevronLeft size={17} />
                  </button>
                </div>
              </div>

              <div className={styles.calendarLegend}>
                <span>
                  <i className={styles.activityDot} /> {t.activityDay}
                </span>
                <span>
                  <i className={styles.selectedDot} /> {t.selected}
                </span>
              </div>

              <div className={styles.weekLabels}>
                {weekDayLabels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>

              <div className={styles.monthGrid}>
                {calendarCells.map((day, index) => {
                  if (day === null) {
                    return (
                      <span
                        key={`empty-${index}`}
                        className={styles.emptyCalendarCell}
                      />
                    );
                  }

                  const dayValue = `${monthPrefix}${String(day).padStart(
                    2,
                    '0',
                  )}`;
                  const hasActivity = activitySet.has(dayValue);
                  const isSelected = dayValue === selectedDay;
                  const isToday = dayValue === today;

                  return (
                    <button
                      key={dayValue}
                      type="button"
                      className={[
                        styles.calendarDay,
                        hasActivity ? styles.hasActivity : '',
                        isSelected ? styles.isSelected : '',
                        isToday ? styles.isToday : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => go(dayValue)}
                      disabled={pending}
                      aria-pressed={isSelected}
                    >
                      <strong>{day}</strong>
                      {hasActivity && (
                        <span className={styles.activityMarker}>
                          {lang === 'he' ? 'פעילות' : 'نشاط'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="my-5 flex flex-wrap items-end gap-3">
              <label className="text-sm">
                {t.date}
                <input
                  type="date"
                  min="2000-01-02"
                  max="2100-12-25"
                  value={selectedDay}
                  disabled={pending}
                  onChange={(event) => go(event.target.value)}
                  className="mt-2 block min-w-0 rounded-xl border border-stone-300 bg-white px-4 py-2 text-base"
                />
              </label>
              <button
                type="button"
                disabled={pending || !canGo(moveDay(days[0], -7))}
                onClick={() => go(moveDay(days[0], -7))}
                className={button}
              >
                {t.previous}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => go(today)}
                className={button}
              >
                {t.current}
              </button>
              <button
                type="button"
                disabled={pending || !canGo(moveDay(days[0], 7))}
                onClick={() => go(moveDay(days[0], 7))}
                className={button}
              >
                {t.next}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => router.refresh())}
                className={button}
              >
                {t.refresh}
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-3">
              <select
                aria-label={t.instructors}
                value={instructor}
                onChange={(event) => setInstructor(event.target.value)}
                className={button}
              >
                <option value="all">{t.instructors}</option>
                {instructor !== 'all' &&
                  !instructorOptions.some(([id]) => id === instructor) && (
                    <option value={instructor}>#{instructor}</option>
                  )}
                {instructorOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                aria-label={t.arenas}
                value={arena}
                onChange={(event) => setArena(event.target.value)}
                className={button}
              >
                <option value="all">{t.arenas}</option>
                {arena !== 'all' &&
                  !arenaOptions.some(([id]) => id === arena) && (
                    <option value={arena}>#{arena}</option>
                  )}
                {arenaOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                aria-label={t.statuses}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={button}
              >
                <option value="active">{t.active}</option>
                <option value="all">{t.statuses}</option>
                {(['SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t[value]}
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                className={button}
                onClick={() => {
                  setInstructor('all');
                  setArena('all');
                  setStatus('active');
                }}
              >
                {t.reset}
              </button>
            </div>

            <section className={styles.dailyCard}>
              <div className={styles.dailyHead}>
                <div>
                  <span className={styles.kicker}>{t.daySchedule}</span>
                  <h2>{fullDate(selectedDay)}</h2>
                </div>

                <div className={styles.dailyActions}>
                  <a
                    href={exportHref}
                    className={styles.exportButton}
                    title={t.exportExcel}
                  >
                    <Download size={16} />
                    <span>{t.exportExcel}</span>
                  </a>

                  <div className={styles.dailyStats}>
                    <span>
                      <strong>{dailyLessons.length}</strong>
                      {t.dailyCount}
                    </span>
                    <span>
                      <strong>{dailyParticipantCount}</strong>
                      {t.participantCount}
                    </span>
                  </div>
                </div>
              </div>

              {dailyLessons.length === 0 ? (
                <div className={styles.dailyEmpty}>{t.noDaily}</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.dailyTable}>
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
                      {dailyLessons.flatMap((lesson) => {
                        const participants =
                          lesson.participants.length > 0
                            ? lesson.participants
                            : [{ riderName: '—', horseName: '—' }];

                        return participants.map((participant, index) => (
                          <tr
                            key={`${lesson.id}-${index}`}
                            className={
                              lesson.status === 'CANCELLED'
                                ? styles.cancelledRow
                                : undefined
                            }
                          >
                            {index === 0 && (
                              <>
                                <td rowSpan={participants.length}>
                                  <strong>
                                    {time(lesson.startsAt)}–
                                    {time(lesson.endsAt)}
                                  </strong>
                                </td>
                                <td rowSpan={participants.length}>
                                  {lang === 'he'
                                    ? lesson.arenaHe
                                    : lesson.arenaAr}
                                </td>
                                <td rowSpan={participants.length}>
                                  {lesson.instructorName}
                                </td>
                              </>
                            )}
                            <td>{participant.riderName}</td>
                            <td>{participant.horseName}</td>
                            {index === 0 && (
                              <td rowSpan={participants.length}>
                                <span
                                  className={[
                                    styles.statusBadge,
                                    lesson.status === 'SCHEDULED'
                                      ? styles.scheduled
                                      : lesson.status === 'COMPLETED'
                                        ? styles.completed
                                        : styles.cancelled,
                                  ].join(' ')}
                                >
                                  {t[lesson.status]}
                                </span>
                              </td>
                            )}
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="mb-4 mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <p>
                <strong>{filtered.length}</strong> {t.count}
              </p>
              <p>
                <strong>
                  {filtered.reduce(
                    (sum, lesson) => sum + lesson.participants.length,
                    0,
                  )}
                </strong>{' '}
                {t.riders}
              </p>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-label={t.title}
              aria-busy={pending}
              className={`overflow-x-auto rounded-2xl border border-stone-200 focus-visible:outline-2 focus-visible:outline-[#243c32] ${
                pending ? 'opacity-60' : ''
              }`}
            >
              <div className="grid min-w-[1470px] grid-cols-7 items-stretch gap-px bg-stone-200">
                {days.map((day) => (
                  <section
                    key={day}
                    aria-label={date(day, true)}
                    className="min-w-0 bg-[#f9f8f4]"
                  >
                    <header
                      className={`min-h-36 border-b p-4 ${
                        day === today
                          ? 'border-[#d8bf8b] bg-[#f0e5cb]'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <h2 className="text-base font-bold">
                        {date(day, true)}{' '}
                        {day === today && (
                          <span className="ms-1 text-xs">● {t.today}</span>
                        )}
                      </h2>
                      <button
                        type="button"
                        onClick={() => go(day)}
                        className="mt-3 text-sm underline underline-offset-4"
                      >
                        {t.open}
                      </button>
                    </header>

                    <div className="space-y-3 p-3">
                      {filtered
                        .filter((lesson) =>
                          lessonTouchesDay(lesson, day, zone),
                        )
                        .map((lesson) => (
                          <Link
                            key={lesson.id}
                            href={`/lessons?date=${day}`}
                            className={`block rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition hover:border-[#243c32] focus-visible:outline-2 ${
                              lesson.status === 'CANCELLED' ? 'opacity-60' : ''
                            }`}
                          >
                            <p className="text-lg font-bold">
                              <bdi>
                                {time(lesson.startsAt)} – {time(lesson.endsAt)}
                              </bdi>
                            </p>
                            <span
                              className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${
                                lesson.status === 'SCHEDULED'
                                  ? 'bg-amber-50'
                                  : lesson.status === 'COMPLETED'
                                    ? 'bg-emerald-50'
                                    : 'bg-stone-100'
                              }`}
                            >
                              {t[lesson.status]}
                            </span>

                            {localStamp(
                              new Date(lesson.startsAt),
                              zone,
                            ).slice(0, 10) !== day && (
                              <p className="mt-2 text-xs">
                                {t.from}:{' '}
                                {date(
                                  localStamp(
                                    new Date(lesson.startsAt),
                                    zone,
                                  ).slice(0, 10),
                                )}
                              </p>
                            )}

                            <p className="mt-3 break-words text-sm font-semibold">
                              {t.instructor}: {lesson.instructorName}
                            </p>
                            <p className="mt-1 break-words text-xs text-stone-600">
                              {t.arena}:{' '}
                              {lang === 'he'
                                ? lesson.arenaHe
                                : lesson.arenaAr}
                            </p>

                            <ul className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                              {lesson.participants.map((participant, index) => (
                                <li
                                  key={index}
                                  className="break-words text-xs leading-5"
                                >
                                  {participant.riderName}
                                  <br />
                                  <span className="text-stone-500">
                                    {t.horse}: {participant.horseName}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </Link>
                        ))}

                      {!filtered.some((lesson) =>
                        lessonTouchesDay(lesson, day, zone),
                      ) && (
                        <p className="py-8 text-center text-sm text-stone-500">
                          {t.empty}
                        </p>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
