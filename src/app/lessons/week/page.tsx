import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LessonWeek } from '@/components/lesson-week';
import { localStamp, moveDay, validDay, zonedTime } from '@/lib/lesson-time';
import { weekDates } from '@/lib/lesson-week';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';

function nextMonthStart(day: string) {
  const [year, month] = day.slice(0, 7).split('-').map(Number);
  const value = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  return value.toISOString().slice(0, 10);
}

export default async function LessonWeekPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  await connection();

  const admin = await requireRole('ADMIN');
  const params = await searchParams;
  const fallback = localStamp(new Date(), 'Asia/Jerusalem').slice(0, 10);

  const requestedDay =
    typeof params.date === 'string' &&
    validDay(params.date) &&
    params.date >= '2000-01-02' &&
    params.date <= '2100-12-25'
      ? params.date
      : fallback;

  const empty = {
    lessons: [],
    days: weekDates(requestedDay),
    today: fallback,
    zone: 'Asia/Jerusalem',
    selectedDay: requestedDay,
    activityDays: [],
  };

  try {
    const farm = await prisma.farm.findUnique({
      where: { id: admin.farmId },
      select: { id: true, timezone: true },
    });

    if (!farm) {
      return (
        <AdminShell
          userName={admin.displayName}
          title="יומן שבועי / الجدول الأسبوعي"
          subtitle="תצוגת שבוע, Calendar יומי ושיבוץ שיעורים"
        >
          <LessonWeek {...empty} issue="farm" />
        </AdminShell>
      );
    }

    const today = localStamp(new Date(), farm.timezone).slice(0, 10);
    const selectedDay =
      typeof params.date === 'string' &&
      validDay(params.date) &&
      params.date >= '2000-01-02' &&
      params.date <= '2100-12-25'
        ? params.date
        : today;

    const days = weekDates(selectedDay);

    const weekStart = zonedTime(days[0], '00:00', farm.timezone);
    const weekEnd = zonedTime(moveDay(days[0], 7), '00:00', farm.timezone);

    const monthStartDay = `${selectedDay.slice(0, 7)}-01`;
    const monthEndDay = nextMonthStart(selectedDay);
    const monthStart = zonedTime(monthStartDay, '00:00', farm.timezone);
    const monthEnd = zonedTime(monthEndDay, '00:00', farm.timezone);

    const [rows, monthRows] = await Promise.all([
      prisma.lesson.findMany({
        where: {
          farmId: farm.id,
          startsAt: { lt: weekEnd },
          endsAt: { gt: weekStart },
        },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        include: {
          instructor: { select: { name: true } },
          arena: { select: { nameHe: true, nameAr: true } },
          participants: {
            orderBy: { id: 'asc' },
            include: {
              rider: { select: { name: true } },
              horse: { select: { name: true } },
            },
          },
        },
      }),
      prisma.lesson.findMany({
        where: {
          farmId: farm.id,
          status: { not: 'CANCELLED' },
          startsAt: { gte: monthStart, lt: monthEnd },
        },
        orderBy: { startsAt: 'asc' },
        select: { startsAt: true },
      }),
    ]);

    const lessons = rows.map((row) => ({
      id: row.id,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      status: row.status,
      instructorId: row.instructorId,
      instructorName: row.instructor.name,
      arenaId: row.arenaId,
      arenaHe: row.arena.nameHe,
      arenaAr: row.arena.nameAr,
      participants: row.participants.map((participant) => ({
        riderName: participant.rider.name,
        horseName: participant.horse.name,
      })),
    }));

    const activityDays = [
      ...new Set(
        monthRows.map((row) =>
          localStamp(row.startsAt, farm.timezone).slice(0, 10),
        ),
      ),
    ];

    return (
      <AdminShell
        userName={admin.displayName}
        title="יומן שבועי / الجدول الأسبوعי"
        subtitle="תצוגת שבוע, Calendar יומי ושיבוץ שיעורים"
      >
        <LessonWeek
          lessons={lessons}
          days={days}
          today={today}
          zone={farm.timezone}
          selectedDay={selectedDay}
          activityDays={activityDays}
        />
      </AdminShell>
    );
  } catch {
    return (
      <AdminShell
        userName={admin.displayName}
        title="יומן שבועי / الجدول الأسبوعי"
        subtitle="תצוגת שבוע, Calendar יומי ושיבוץ שיעורים"
      >
        <LessonWeek {...empty} issue="save" />
      </AdminShell>
    );
  }
}
