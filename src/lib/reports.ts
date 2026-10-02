import 'server-only';
import { prisma } from '@/lib/prisma';
import { localStamp, moveDay, validDay, zonedTime } from '@/lib/lesson-time';

const DAY = 24 * 60 * 60 * 1000;

export type ReportsData = {
  from: string;
  to: string;
  today: string;
  timeZone: string;
  summary: {
    totalLessons: number;
    completedLessons: number;
    scheduledLessons: number;
    cancelledLessons: number;
    lessonHours: number;
    participantAssignments: number;
    attendanceRate: number | null;
    present: number;
    absent: number;
    unmarked: number;
    progressAverage: number | null;
  };
  months: {
    key: string;
    label: string;
    lessons: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    present: number;
    absent: number;
    unmarked: number;
    attendanceRate: number | null;
  }[];
  instructorTrend: { id: number; name: string; values: number[] }[];
  horseTrend: { id: number; name: string; values: number[] }[];
  instructors: { id: number; name: string; active: boolean; lessons: number; completed: number; riders: number; hours: number }[];
  horses: { id: number; name: string; active: boolean; lessons: number; completed: number; hours: number; lastUsedAt: string | null }[];
  riders: { id: number; name: string; level: string | null; active: boolean; lessons: number; present: number; absent: number; unmarked: number; attendanceRate: number | null; progressAverage: number | null }[];
  treatments: { id: number; horseName: string; type: string; dueAt: string; dayDiff: number }[];
};

export type ReportsResult = {
  farm: { id: number; name: string; timezone: string };
  data: ReportsData;
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clampRange(from: string, to: string) {
  if (from > to) return { from: to, to };
  const start = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  if ((end.getTime() - start.getTime()) / DAY > 366) return { from: moveDay(to, -366), to };
  return { from, to };
}

function monthKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('he-IL', { month: 'short', year: '2-digit' }).format(new Date(Date.UTC(year, month - 1, 15)));
}

function monthKeysBetween(from: string, to: string) {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  const keys: string[] = [];
  let year = fromYear;
  let month = fromMonth;
  while (year < toYear || (year === toYear && month <= toMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month === 13) { month = 1; year += 1; }
  }
  return keys;
}

export async function getReportsData(
  farmId: number,
  params: { from?: string | string[]; to?: string | string[] } = {},
): Promise<ReportsResult | null> {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { id: true, name: true, timezone: true },
  });
  if (!farm) return null;

  const today = localStamp(new Date(), farm.timezone).slice(0, 10);
  const rawTo = typeof params.to === 'string' && validDay(params.to) ? params.to : today;
  const rawFrom = typeof params.from === 'string' && validDay(params.from) ? params.from : moveDay(rawTo, -29);
  const { from, to } = clampRange(rawFrom, rawTo);
  const rangeStart = zonedTime(from, '00:00', farm.timezone);
  const rangeEnd = zonedTime(moveDay(to, 1), '00:00', farm.timezone);

  const [lessons, instructors, horses, riders, treatmentRows] = await Promise.all([
    prisma.lesson.findMany({
      where: { farmId: farm.id, startsAt: { gte: rangeStart, lt: rangeEnd } },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true, startsAt: true, endsAt: true, status: true, instructorId: true,
        instructor: { select: { name: true } },
        participants: { select: { riderId: true, horseId: true, attendance: true, progressScore: true } },
      },
    }),
    prisma.instructor.findMany({ where: { farmId: farm.id }, orderBy: { name: 'asc' }, select: { id: true, name: true, isActive: true } }),
    prisma.horse.findMany({ where: { farmId: farm.id }, orderBy: { name: 'asc' }, select: { id: true, name: true, isActive: true } }),
    prisma.rider.findMany({ where: { farmId: farm.id }, orderBy: { name: 'asc' }, select: { id: true, name: true, isActive: true, level: true } }),
    prisma.treatment.findMany({
      where: { horse: { farmId: farm.id } },
      orderBy: [{ performedAt: 'desc' }, { id: 'desc' }],
      select: { id: true, horseId: true, type: true, nextDueAt: true, performedAt: true, horse: { select: { name: true } } },
      take: 1500,
    }),
  ]);

  const nonCancelled = lessons.filter((lesson) => lesson.status !== 'CANCELLED');
  const completed = lessons.filter((lesson) => lesson.status === 'COMPLETED');
  const scheduled = lessons.filter((lesson) => lesson.status === 'SCHEDULED');
  const cancelled = lessons.filter((lesson) => lesson.status === 'CANCELLED');
  const activeParticipants = nonCancelled.flatMap((lesson) => lesson.participants);
  const present = activeParticipants.filter((participant) => participant.attendance === 'PRESENT').length;
  const absent = activeParticipants.filter((participant) => participant.attendance === 'ABSENT').length;
  const unmarked = activeParticipants.filter((participant) => participant.attendance === 'UNMARKED').length;
  const marked = present + absent;
  const scored = activeParticipants.map((participant) => participant.progressScore).filter((score): score is number => score !== null);
  const lessonHours = nonCancelled.reduce((sum, lesson) => sum + Math.max(0, lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 3600000, 0);

  const instructorStats = instructors.map((instructor) => {
    const rows = lessons.filter((lesson) => lesson.instructorId === instructor.id && lesson.status !== 'CANCELLED');
    const done = rows.filter((lesson) => lesson.status === 'COMPLETED').length;
    const participantCount = rows.reduce((sum, lesson) => sum + lesson.participants.length, 0);
    const hours = rows.reduce((sum, lesson) => sum + Math.max(0, lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 3600000, 0);
    return { id: instructor.id, name: instructor.name, active: instructor.isActive, lessons: rows.length, completed: done, riders: participantCount, hours: round(hours) };
  }).sort((a, b) => b.lessons - a.lessons || a.name.localeCompare(b.name));

  const participantRows = nonCancelled.flatMap((lesson) => lesson.participants.map((participant) => ({ lesson, participant })));
  const horseStats = horses.map((horse) => {
    const rows = participantRows.filter((row) => row.participant.horseId === horse.id);
    const completedUses = rows.filter((row) => row.lesson.status === 'COMPLETED').length;
    const hours = rows.reduce((sum, row) => sum + Math.max(0, row.lesson.endsAt.getTime() - row.lesson.startsAt.getTime()) / 3600000, 0);
    const lastUsed = rows.length ? rows.reduce((latest, row) => row.lesson.startsAt > latest ? row.lesson.startsAt : latest, rows[0].lesson.startsAt) : null;
    return { id: horse.id, name: horse.name, active: horse.isActive, lessons: rows.length, completed: completedUses, hours: round(hours), lastUsedAt: lastUsed?.toISOString() ?? null };
  }).sort((a, b) => b.lessons - a.lessons || a.name.localeCompare(b.name));

  const riderStats = riders.map((rider) => {
    const rows = participantRows.filter((row) => row.participant.riderId === rider.id);
    const riderPresent = rows.filter((row) => row.participant.attendance === 'PRESENT').length;
    const riderAbsent = rows.filter((row) => row.participant.attendance === 'ABSENT').length;
    const riderUnmarked = rows.filter((row) => row.participant.attendance === 'UNMARKED').length;
    const riderMarked = riderPresent + riderAbsent;
    const scores = rows.map((row) => row.participant.progressScore).filter((score): score is number => score !== null);
    return {
      id: rider.id, name: rider.name, level: rider.level, active: rider.isActive, lessons: rows.length,
      present: riderPresent, absent: riderAbsent, unmarked: riderUnmarked,
      attendanceRate: riderMarked ? round((riderPresent / riderMarked) * 100) : null,
      progressAverage: scores.length ? round(scores.reduce((sum, score) => sum + score, 0) / scores.length, 1) : null,
    };
  }).sort((a, b) => (b.attendanceRate ?? -1) - (a.attendanceRate ?? -1) || b.lessons - a.lessons || a.name.localeCompare(b.name));

  const monthKeys = monthKeysBetween(from, to);
  const months = monthKeys.map((key) => {
    const monthLessons = lessons.filter((lesson) => monthKey(lesson.startsAt, farm.timezone) === key);
    const monthActive = monthLessons.filter((lesson) => lesson.status !== 'CANCELLED').flatMap((lesson) => lesson.participants);
    const monthPresent = monthActive.filter((participant) => participant.attendance === 'PRESENT').length;
    const monthAbsent = monthActive.filter((participant) => participant.attendance === 'ABSENT').length;
    const monthUnmarked = monthActive.filter((participant) => participant.attendance === 'UNMARKED').length;
    const monthMarked = monthPresent + monthAbsent;
    return {
      key,
      label: monthLabel(key),
      lessons: monthLessons.length,
      completed: monthLessons.filter((lesson) => lesson.status === 'COMPLETED').length,
      scheduled: monthLessons.filter((lesson) => lesson.status === 'SCHEDULED').length,
      cancelled: monthLessons.filter((lesson) => lesson.status === 'CANCELLED').length,
      present: monthPresent,
      absent: monthAbsent,
      unmarked: monthUnmarked,
      attendanceRate: monthMarked ? round((monthPresent / monthMarked) * 100) : null,
    };
  });

  const topInstructorIds = new Set(instructorStats.slice(0, 4).map((row) => row.id));
  const instructorTrend = instructorStats.filter((row) => topInstructorIds.has(row.id)).map((row) => ({
    id: row.id,
    name: row.name,
    values: monthKeys.map((key) => lessons.filter((lesson) => lesson.instructorId === row.id && lesson.status !== 'CANCELLED' && monthKey(lesson.startsAt, farm.timezone) === key).length),
  }));

  const topHorseIds = new Set(horseStats.slice(0, 4).map((row) => row.id));
  const horseTrend = horseStats.filter((row) => topHorseIds.has(row.id)).map((row) => ({
    id: row.id,
    name: row.name,
    values: monthKeys.map((key) => participantRows.filter((item) => item.participant.horseId === row.id && monthKey(item.lesson.startsAt, farm.timezone) === key).length),
  }));

  const seenTreatments = new Set<string>();
  const todayDate = zonedTime(today, '00:00', farm.timezone);
  const dueWindowEnd = new Date(todayDate.getTime() + 30 * DAY);
  const treatmentDue: ReportsData['treatments'] = [];
  for (const row of treatmentRows) {
    const key = `${row.horseId}:${row.type.trim().toLowerCase()}`;
    if (seenTreatments.has(key)) continue;
    seenTreatments.add(key);
    if (!row.nextDueAt || row.nextDueAt.getTime() > dueWindowEnd.getTime()) continue;
    const diff = Math.floor((row.nextDueAt.getTime() - todayDate.getTime()) / DAY);
    treatmentDue.push({ id: row.id, horseName: row.horse.name, type: row.type, dueAt: row.nextDueAt.toISOString().slice(0, 10), dayDiff: diff });
  }
  treatmentDue.sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return {
    farm,
    data: {
      from, to, today, timeZone: farm.timezone,
      summary: {
        totalLessons: lessons.length, completedLessons: completed.length, scheduledLessons: scheduled.length, cancelledLessons: cancelled.length,
        lessonHours: round(lessonHours), participantAssignments: activeParticipants.length,
        attendanceRate: marked ? round((present / marked) * 100) : null,
        present, absent, unmarked,
        progressAverage: scored.length ? round(scored.reduce((sum, score) => sum + score, 0) / scored.length, 1) : null,
      },
      months, instructorTrend, horseTrend,
      instructors: instructorStats, horses: horseStats, riders: riderStats, treatments: treatmentDue,
    },
  };
}
