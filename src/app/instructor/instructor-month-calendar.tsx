'use client';

import { useState } from 'react';
import styles from './instructor-calendar.module.css';

export type InstructorCalendarActivity = {
  id: number;
  time: string;
  status: string;
  arenaHe: string;
  arenaAr: string;
  notes: string | null;
  participants: Array<{
    id: number;
    riderName: string;
    horseName: string;
  }>;
};

type InstructorMonthCalendarProps = {
  monthTitleHe: string;
  monthTitleAr: string;
  daysInMonth: number;
  firstWeekDay: number;
  today: number;
  activitiesByDay: Record<string, InstructorCalendarActivity[]>;
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

export function InstructorMonthCalendar({
  monthTitleHe,
  monthTitleAr,
  daysInMonth,
  firstWeekDay,
  today,
  activitiesByDay,
}: InstructorMonthCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(today);

  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const selectedActivities = activitiesByDay[String(selectedDay)] ?? [];

  return (
    <section className={styles.calendarCard} aria-label="לוח ההדרכות החודשי">
      <div className={styles.calendarHeader}>
        <div>
          <span className={styles.kicker}>MONTHLY SCHEDULE</span>
          <h2>לוח ההדרכות החודשי / جدول التدريب الشهري</h2>
          <p className={styles.monthNames}>
            {monthTitleHe} · {monthTitleAr}
          </p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendDot} />
          <span>יום עם הדרכה / يوم فيه تدريب</span>
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
              פעילות ליום {selectedDay} / نشاط يوم {selectedDay}
            </h3>
            <p>
              {monthTitleHe} · {monthTitleAr}
            </p>
          </div>
          <strong className={styles.activityCount}>
            {selectedActivities.length}
            <small> שיעורים / دروس</small>
          </strong>
        </div>

        {selectedActivities.length === 0 ? (
          <div className={styles.emptyActivity}>
            אין פעילות מתוכננת ביום הזה · لا توجد أنشطة مجدولة في هذا اليوم
          </div>
        ) : (
          <div className={styles.activityList}>
            {selectedActivities.map((activity) => (
              <article key={activity.id} className={styles.activityCard}>
                <div className={styles.activityTop}>
                  <div>
                    <span className={styles.activityTime}>{activity.time}</span>
                    <strong>
                      {activity.arenaHe} / {activity.arenaAr}
                    </strong>
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

                <div className={styles.participants}>
                  {activity.participants.length > 0 ? (
                    activity.participants.map((participant) => (
                      <span key={participant.id}>
                        <b>{participant.riderName}</b>
                        <i>·</i>
                        {participant.horseName}
                      </span>
                    ))
                  ) : (
                    <span>אין משתתפים / لا يوجد مشاركون</span>
                  )}
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
