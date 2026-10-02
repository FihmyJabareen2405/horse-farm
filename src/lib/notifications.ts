import 'server-only';

import type { NotificationType, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dispatchNotificationPushes } from '@/lib/web-push';

type NotificationUser = {
  id: number;
  farmId: number;
  role: UserRole;
  instructorId: number | null;
  riderId: number | null;
};

type NotificationInput = {
  type: NotificationType;
  titleHe: string;
  titleAr: string;
  bodyHe?: string | null;
  bodyAr?: string | null;
  href?: string | null;
  sourceKey: string;
  sourceVersion: string;
};

const DAY = 24 * 60 * 60 * 1000;

function formatDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone,
    dateStyle: 'medium',
  }).format(date);
}

async function upsertNotification(user: NotificationUser, input: NotificationInput) {
  const where = {
    userId_type_sourceKey: {
      userId: user.id,
      type: input.type,
      sourceKey: input.sourceKey,
    },
  } as const;

  const existing = await prisma.notification.findUnique({
    where,
    select: { id: true, sourceVersion: true },
  });

  if (!existing) {
    const created = await prisma.notification.create({
      data: {
        ...input,
        userId: user.id,
        farmId: user.farmId,
      },
      select: { id: true },
    });
    await dispatchNotificationPushes([created.id]);
    return;
  }

  if (existing.sourceVersion !== input.sourceVersion) {
    await prisma.notification.update({
      where: { id: existing.id },
      data: {
        titleHe: input.titleHe,
        titleAr: input.titleAr,
        bodyHe: input.bodyHe ?? null,
        bodyAr: input.bodyAr ?? null,
        href: input.href ?? null,
        sourceVersion: input.sourceVersion,
        readAt: null,
      },
    });
    await dispatchNotificationPushes([existing.id]);
  }
}

async function syncAdminNotifications(user: NotificationUser, timeZone: string) {
  const windowEnd = new Date(Date.now() + 7 * DAY);
  const rows = await prisma.treatment.findMany({
    where: { horse: { farmId: user.farmId } },
    orderBy: [{ performedAt: 'desc' }, { id: 'desc' }],
    include: { horse: { select: { name: true } } },
    take: 1000,
  });

  // Only the newest treatment of each horse/type can create a due reminder.
  const seen = new Set<string>();
  const activeKeys: string[] = [];
  for (const treatment of rows) {
    const key = `${treatment.horseId}:${treatment.type.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!treatment.nextDueAt || treatment.nextDueAt.getTime() > windowEnd.getTime()) continue;

    const due = treatment.nextDueAt;
    const dayDiff = Math.ceil((due.getTime() - Date.now()) / DAY);
    const bodyHe = dayDiff < 0
      ? `${treatment.horse.name} · ${treatment.type} · באיחור של ${Math.abs(dayDiff)} ימים (${formatDate(due, timeZone)})`
      : dayDiff === 0
        ? `${treatment.horse.name} · ${treatment.type} · הטיפול מתוכנן להיום`
        : `${treatment.horse.name} · ${treatment.type} · בעוד ${dayDiff} ימים (${formatDate(due, timeZone)})`;
    const bodyAr = dayDiff < 0
      ? `${treatment.horse.name} · ${treatment.type} · متأخر ${Math.abs(dayDiff)} أيام (${formatDate(due, timeZone)})`
      : dayDiff === 0
        ? `${treatment.horse.name} · ${treatment.type} · موعد العلاج اليوم`
        : `${treatment.horse.name} · ${treatment.type} · بعد ${dayDiff} أيام (${formatDate(due, timeZone)})`;

    activeKeys.push(`treatment:${treatment.id}`);
    await upsertNotification(user, {
      type: 'TREATMENT_DUE',
      titleHe: dayDiff < 0 ? 'טיפול לסוס באיחור' : 'טיפול לסוס מתקרב',
      titleAr: dayDiff < 0 ? 'علاج حصان متأخر' : 'موعد علاج حصان قريب',
      bodyHe,
      bodyAr,
      href: '/treatments',
      sourceKey: `treatment:${treatment.id}`,
      sourceVersion: due.toISOString().slice(0, 10),
    });
  }

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      type: 'TREATMENT_DUE',
      readAt: null,
      ...(activeKeys.length ? { sourceKey: { notIn: activeKeys } } : {}),
    },
    data: { readAt: new Date() },
  });
}

async function syncInstructorNotifications(user: NotificationUser, timeZone: string) {
  if (!user.instructorId) return;
  const now = new Date();
  const in24Hours = new Date(now.getTime() + DAY);
  const lessons = await prisma.lesson.findMany({
    where: {
      farmId: user.farmId,
      instructorId: user.instructorId,
      status: 'SCHEDULED',
      startsAt: { gte: now, lte: in24Hours },
    },
    orderBy: { startsAt: 'asc' },
    include: { arena: { select: { nameHe: true, nameAr: true } } },
  });

  const activeKeys: string[] = [];
  for (const lesson of lessons) {
    activeKeys.push(`lesson:${lesson.id}`);
    await upsertNotification(user, {
      type: 'LESSON_UPCOMING',
      titleHe: 'שיעור קרוב',
      titleAr: 'درس قريب',
      bodyHe: `${formatDateTime(lesson.startsAt, timeZone)} · ${lesson.arena.nameHe}`,
      bodyAr: `${formatDateTime(lesson.startsAt, timeZone)} · ${lesson.arena.nameAr}`,
      href: '/instructor',
      sourceKey: `lesson:${lesson.id}`,
      sourceVersion: lesson.startsAt.toISOString(),
    });
  }

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      type: 'LESSON_UPCOMING',
      readAt: null,
      ...(activeKeys.length ? { sourceKey: { notIn: activeKeys } } : {}),
    },
    data: { readAt: new Date() },
  });
}

async function syncRiderNotifications(user: NotificationUser, timeZone: string) {
  if (!user.riderId) return;
  const now = new Date();
  const in24Hours = new Date(now.getTime() + DAY);
  const participants = await prisma.lessonParticipant.findMany({
    where: {
      riderId: user.riderId,
      lesson: {
        farmId: user.farmId,
        status: 'SCHEDULED',
        startsAt: { gte: now, lte: in24Hours },
      },
    },
    orderBy: { lesson: { startsAt: 'asc' } },
    include: {
      horse: { select: { name: true } },
      lesson: {
        include: {
          instructor: { select: { name: true } },
          arena: { select: { nameHe: true, nameAr: true } },
        },
      },
    },
  });

  const activeKeys: string[] = [];
  for (const participant of participants) {
    const lesson = participant.lesson;
    activeKeys.push(`lesson:${lesson.id}`);
    await upsertNotification(user, {
      type: 'LESSON_UPCOMING',
      titleHe: 'השיעור שלך מתקרב',
      titleAr: 'درسك يقترب',
      bodyHe: `${formatDateTime(lesson.startsAt, timeZone)} · ${lesson.instructor.name} · ${participant.horse.name}`,
      bodyAr: `${formatDateTime(lesson.startsAt, timeZone)} · ${lesson.instructor.name} · ${participant.horse.name}`,
      href: '/rider',
      sourceKey: `lesson:${lesson.id}`,
      sourceVersion: lesson.startsAt.toISOString(),
    });
  }

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      type: 'LESSON_UPCOMING',
      readAt: null,
      ...(activeKeys.length ? { sourceKey: { notIn: activeKeys } } : {}),
    },
    data: { readAt: new Date() },
  });
}

export async function syncNotificationsForUser(user: NotificationUser) {
  const farm = await prisma.farm.findUnique({
    where: { id: user.farmId },
    select: { timezone: true },
  });
  const timeZone = farm?.timezone ?? 'Asia/Jerusalem';

  if (user.role === 'ADMIN') await syncAdminNotifications(user, timeZone);
  if (user.role === 'INSTRUCTOR') await syncInstructorNotifications(user, timeZone);
  if (user.role === 'RIDER') await syncRiderNotifications(user, timeZone);
}

export async function unreadNotificationCount(user: NotificationUser) {
  await syncNotificationsForUser(user);
  return prisma.notification.count({ where: { userId: user.id, readAt: null } });
}
