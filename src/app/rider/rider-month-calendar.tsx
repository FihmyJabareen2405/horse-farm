'use client';

import { useState } from 'react';
import styles from './rider-calendar.module.css';

export type RiderCalendarActivity = {
  id: number;
  time: string;
  status: string;
  arenaHe: string;
  arenaAr: string;
  instructorName: string;
  horseName: string;
  notes: string | null;
  attendance: 'UNMARKED' | 'PRESENT' | 'ABSENT';
};

type RiderMonthCalendarProps = {
  monthTitleHe: string;
  monthTitleAr: string;
  daysInMonth: number;
  firstWeekDay: number;
  today: number;
  activitiesByDay: Record<string, RiderCalendarActivity[]>;
};

const weekDays = [
  'א׳ / أ',
  'ב׳ / إ',
  'ג׳ / ث',
  'ד׳ / أ',
  'ה׳ / خ',
  'ו׳ / ج',
  'ש׳ / س',
];

function statusLabel(status: string) {
  if (status === 'COMPLETED') return 'הושלם / مكتمل';
  if (status === 'SCHEDULED') return 'מתוכנן / مجدول';
  return status;
}

function attendanceLabel(attendance: RiderCalendarActivity['attendance']) {
  if (attendance === 'PRESENT') return 'נוכח / حاضر';
  if (attendance === 'ABSENT') return 'נעדר / غائب';
  return 'לא סומן / غير محدد';
}

export function RiderMonthCalendar({
  monthTitleHe,
  monthTitleAr,
  daysInMonth,
  firstWeekDay,
  today,
  activitiesByDay,
}: RiderMonthCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(today);

  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const selectedActivities = activitiesByDay[String(selectedDay)] ?? [];

  return (
    <section className={styles.calendarCard} aria-label="לוח השיעורים החודשי">
      <div className={styles.calendarHeader}>
        <div>
          <span className={styles.kicker}>MONTHLY SCHEDULE</span>
          <h2>לוח השיעורים החודשי / جدول الدروس الشهري</h2>
          <p className={styles.monthNames}>
            {monthTitleHe} · {monthTitleAr}
          </p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendDot} />
          <span>יום עם שיעור / يوم فيه درس</span>
        </div>
      </div>

      <div className={styles.weekHeader} aria-hidden="true">
        {weekDays.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      <div className={styles.monthGrid}>
        {calendarCells.map((day, index) => {
          if (day === null) {
            return (
              <span
                key={`empty-${index}`}
                className={styles.emptyDay}
                aria-hidden="true"
              />
            );
          }

          const lessonCount = (activitiesByDay[String(day)] ?? []).length;
          const isToday = day === today;
          const isSelected = day === selectedDay;

          return (
            <button
              key={day}
              type="button"
              className={[
                styles.day,
                lessonCount > 0 ? styles.lessonDay : '',
                isToday ? styles.today : '',
                isSelected ? styles.selectedDay : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={isSelected}
              aria-label={
                lessonCount > 0
                  ? `${day}: ${lessonCount} שיעורים`
                  : `${day}: אין פעילות`
              }
              onClick={() => setSelectedDay(day)}
            >
              <span className={styles.dayNumber}>{day}</span>
              {isToday && (
                <span className={styles.todayBadge}>היום / اليوم</span>
              )}
              {lessonCount > 0 && (
                <span className={styles.lessonBadge}>
                  {lessonCount} {lessonCount === 1 ? 'שיעור' : 'שיעורים'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.dayDetails} aria-live="polite">
        <div className={styles.dayDetailsHeader}>
          <div>
            <span className={styles.detailsKicker}>DAILY ACTIVITY</span>
            <h3>
              הפעילות שלי ביום {selectedDay} / نشاطي يوم {selectedDay}
            </h3>
            <p>{monthTitleHe} · {monthTitleAr}</p>
          </div>
          <strong className={styles.activityCount}>
            {selectedActivities.length}
            <small> שיעורים / دروس</small>
          </strong>
        </div>

        {selectedActivities.length === 0 ? (
          <div className={styles.emptyActivity}>
            אין לך שיעור מתוכנן ביום הזה · لا يوجد لديك درس مجدول في هذا اليوم
          </div>
        ) : (
          <div className={styles.activityList}>
            {selectedActivities.map((activity) => (
              <article key={activity.id} className={styles.activityCard}>
                <div className={styles.activityTop}>
                  <div>
                    <span className={styles.activityTime}>{activity.time}</span>
                    <strong>{activity.arenaHe} / {activity.arenaAr}</strong>
                  </div>
                  <span
                    className={[
                      styles.status,
                      activity.status === 'COMPLETED'
                        ? styles.statusCompleted
                        : styles.statusScheduled,
                    ].join(' ')}
                  >
                    {statusLabel(activity.status)}
                  </span>
                </div>

                <div className={styles.detailsGrid}>
                  <div>
                    <small>מדריך / المدرب</small>
                    <strong>{activity.instructorName}</strong>
                  </div>
                  <div>
                    <small>סוס / الحصان</small>
                    <strong>{activity.horseName}</strong>
                  </div>
                  <div>
                    <small>נוכחות / الحضور</small>
                    <strong>{attendanceLabel(activity.attendance)}</strong>
                  </div>
                </div>

                {activity.notes && (
                  <p className={styles.activityNote}>
                    <strong>הערה / ملاحظة:</strong> {activity.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
