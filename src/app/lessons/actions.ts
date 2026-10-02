'use server';

import { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { parseLessonInput, positiveId, lessonVersion } from '@/lib/lesson-input';
import { localStamp, zonedTime } from '@/lib/lesson-time';
import type { LessonError, LessonResult } from '@/lib/lesson-types';
import { dispatchNotificationPushes } from '@/lib/web-push';

class BookingError extends Error {
  constructor(public reason: LessonError) { super(reason); }
}

type Snapshot = {
  startsAt: Date;
  instructorId: number;
  notes: string | null;
  instructor: { name: string };
  arena: { nameHe: string; nameAr: string };
  participants: { riderId: number; horseId: number }[];
};

function refreshLessonViews() {
  revalidatePath('/lessons');
  revalidatePath('/lessons/week');
  revalidatePath('/admin');
  revalidatePath('/instructor');
  revalidatePath('/rider');
  revalidatePath('/notifications');
}

async function transaction(work: (tx: Prisma.TransactionClient) => Promise<void>): Promise<LessonResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 15000,
      });
      refreshLessonViews();
      return { ok: true };
    } catch (error) {
      if (error instanceof BookingError) return { ok: false, error: error.reason };
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') continue;
      return { ok: false, error: 'save' };
    }
  }
  return { ok: false, error: 'conflict' };
}

async function farmById(tx: Prisma.TransactionClient, farmId: number) {
  const farm = await tx.farm.findUnique({ where: { id: farmId }, select: { id: true, timezone: true } });
  if (!farm) throw new BookingError('farm');
  return farm;
}

async function lessonSnapshot(tx: Prisma.TransactionClient, lessonId: number, farmId: number): Promise<Snapshot | null> {
  return tx.lesson.findFirst({
    where: { id: lessonId, farmId },
    select: {
      startsAt: true,
      instructorId: true,
      notes: true,
      instructor: { select: { name: true } },
      arena: { select: { nameHe: true, nameAr: true } },
      participants: { select: { riderId: true, horseId: true }, orderBy: { id: 'asc' } },
    },
  });
}


async function notifyLessonAudience(
  tx: Prisma.TransactionClient,
  options: {
    farmId: number;
    lessonId: number;
    actorUserId: number;
    type: 'LESSON_CREATED' | 'LESSON_UPDATED' | 'LESSON_CANCELLED';
    sourceVersion: string;
    titleHe: string;
    titleAr: string;
    bodyHe: string;
    bodyAr: string;
    instructorIds: number[];
    riderIds: number[];
  },
) {
  const or: Prisma.UserWhereInput[] = [];
  if (options.instructorIds.length) or.push({ instructorId: { in: options.instructorIds } });
  if (options.riderIds.length) or.push({ riderId: { in: options.riderIds } });
  if (!or.length) return [] as number[];

  const recipients = await tx.user.findMany({
    where: {
      farmId: options.farmId,
      isActive: true,
      id: { not: options.actorUserId },
      OR: or,
    },
    select: { id: true, role: true },
  });

  const notificationIds: number[] = [];
  for (const recipient of recipients) {
    const notification = await tx.notification.upsert({
      where: {
        userId_type_sourceKey: {
          userId: recipient.id,
          type: options.type,
          sourceKey: `lesson:${options.lessonId}`,
        },
      },
      create: {
        userId: recipient.id,
        farmId: options.farmId,
        type: options.type,
        titleHe: options.titleHe,
        titleAr: options.titleAr,
        bodyHe: options.bodyHe,
        bodyAr: options.bodyAr,
        href: recipient.role === 'INSTRUCTOR' ? '/instructor' : recipient.role === 'RIDER' ? '/rider' : '/notifications',
        sourceKey: `lesson:${options.lessonId}`,
        sourceVersion: options.sourceVersion,
      },
      update: {
        titleHe: options.titleHe,
        titleAr: options.titleAr,
        bodyHe: options.bodyHe,
        bodyAr: options.bodyAr,
        href: recipient.role === 'INSTRUCTOR' ? '/instructor' : recipient.role === 'RIDER' ? '/rider' : '/notifications',
        sourceVersion: options.sourceVersion,
        readAt: null,
      },
      select: { id: true },
    });
    notificationIds.push(notification.id);
  }
  return notificationIds;
}

function participantKey(items: Snapshot['participants']) {
  return items.map((item) => `${item.riderId}:${item.horseId}`).sort().join('|');
}

function updateDescription(before: Snapshot, after: Snapshot, timezone: string) {
  const he: string[] = [];
  const ar: string[] = [];
  const beforeTime = localStamp(before.startsAt, timezone).slice(0, 16).replace('T', ' ');
  const afterTime = localStamp(after.startsAt, timezone).slice(0, 16).replace('T', ' ');

  if (beforeTime !== afterTime) {
    he.push(`מועד: ${beforeTime} ← ${afterTime}`);
    ar.push(`الموعد: ${beforeTime} ← ${afterTime}`);
  }
  if (before.instructor.name !== after.instructor.name) {
    he.push(`מדריך: ${before.instructor.name} ← ${after.instructor.name}`);
    ar.push(`المدرب: ${before.instructor.name} ← ${after.instructor.name}`);
  }
  if (before.arena.nameHe !== after.arena.nameHe || before.arena.nameAr !== after.arena.nameAr) {
    he.push(`מגרש: ${before.arena.nameHe} ← ${after.arena.nameHe}`);
    ar.push(`الميدان: ${before.arena.nameAr} ← ${after.arena.nameAr}`);
  }
  if (participantKey(before.participants) !== participantKey(after.participants)) {
    he.push('שיבוץ הרוכבים/הסוסים עודכן');
    ar.push('تم تحديث توزيع الفرسان/الخيول');
  }
  if ((before.notes ?? '') !== (after.notes ?? '')) {
    he.push('הערות השיעור עודכנו');
    ar.push('تم تحديث ملاحظات الدرس');
  }

  return {
    he: he.length ? he.join(' · ') : 'השיעור נשמר ללא שינוי מהותי',
    ar: ar.length ? ar.join(' · ') : 'تم حفظ الدرس دون تغيير جوهري',
  };
}

export async function saveLesson(form: FormData): Promise<LessonResult> {
  const admin = await requireRole('ADMIN');
  let input: ReturnType<typeof parseLessonInput>;
  try { input = parseLessonInput(form); } catch { return { ok: false, error: 'invalid' }; }

  const pushNotificationIds: number[] = [];
  const result = await transaction(async (tx) => {
    const farm = await farmById(tx, admin.farmId);
    let startsAt: Date;
    try { startsAt = zonedTime(input.day, input.time, farm.timezone); } catch { throw new BookingError('time'); }
    const endsAt = new Date(startsAt.getTime() + 1800000);

    let before: Snapshot | null = null;
    if (input.id !== null) {
      const old = await tx.lesson.findFirst({ where: { id: input.id, farmId: farm.id } });
      if (!old || old.status !== 'SCHEDULED' || old.updatedAt.getTime() !== input.version!.getTime()) throw new BookingError('stale');
      before = await lessonSnapshot(tx, input.id, farm.id);
      if (!before) throw new BookingError('stale');
    }

    const where = { farmId: farm.id, isActive: true };
    const [instructor, arena, riders, horses] = await Promise.all([
      tx.instructor.count({ where: { ...where, id: input.instructorId } }),
      tx.arena.count({ where: { ...where, id: input.arenaId } }),
      tx.rider.count({ where: { ...where, id: { in: input.riders } } }),
      tx.horse.count({ where: { ...where, id: { in: input.horses } } }),
    ]);
    if (instructor !== 1 || arena !== 1 || riders !== input.riders.length || horses !== input.horses.length) throw new BookingError('inactive');

    const conflict = await tx.lesson.findFirst({
      where: {
        farmId: farm.id,
        ...(input.id !== null ? { id: { not: input.id } } : {}),
        status: { not: 'CANCELLED' },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        OR: [
          { arenaId: input.arenaId },
          { instructorId: input.instructorId },
          { participants: { some: { OR: [{ riderId: { in: input.riders } }, { horseId: { in: input.horses } }] } } },
        ],
      },
      select: { id: true },
    });
    if (conflict) throw new BookingError('conflict');

    const data = { startsAt, endsAt, notes: input.notes, instructorId: input.instructorId, arenaId: input.arenaId };
    if (input.id !== null) {
      await tx.lessonParticipant.deleteMany({ where: { lessonId: input.id } });
      await tx.lesson.update({ where: { id: input.id }, data: { ...data, participants: { create: input.participants } } });
      const after = await lessonSnapshot(tx, input.id, farm.id);
      if (!after || !before) throw new BookingError('save');
      const description = updateDescription(before, after, farm.timezone);
      await tx.lessonAudit.create({ data: { lessonId: input.id, actorUserId: admin.id, action: 'UPDATED', descriptionHe: description.he, descriptionAr: description.ar } });
      const instructorIds = Array.from(new Set([before.instructorId, after.instructorId]));
      const riderIds = Array.from(new Set([...before.participants.map((item) => item.riderId), ...after.participants.map((item) => item.riderId)]));
      pushNotificationIds.push(...await notifyLessonAudience(tx, {
        farmId: farm.id,
        lessonId: input.id,
        actorUserId: admin.id,
        type: 'LESSON_UPDATED',
        sourceVersion: `${Date.now()}`,
        titleHe: 'השיעור שלך עודכן',
        titleAr: 'تم تحديث درسك',
        bodyHe: description.he,
        bodyAr: description.ar,
        instructorIds,
        riderIds,
      }));
    } else {
      const lesson = await tx.lesson.create({ data: { ...data, farmId: farm.id, participants: { create: input.participants } }, select: { id: true } });
      await tx.lessonAudit.create({ data: { lessonId: lesson.id, actorUserId: admin.id, action: 'CREATED', descriptionHe: 'השיעור נוצר', descriptionAr: 'تم إنشاء الدرس' } });
      const created = await lessonSnapshot(tx, lesson.id, farm.id);
      if (created) {
        const stamp = localStamp(created.startsAt, farm.timezone).slice(0, 16).replace('T', ' ');
        pushNotificationIds.push(...await notifyLessonAudience(tx, {
          farmId: farm.id,
          lessonId: lesson.id,
          actorUserId: admin.id,
          type: 'LESSON_CREATED',
          sourceVersion: created.startsAt.toISOString(),
          titleHe: 'שיעור חדש שובץ',
          titleAr: 'تم تعيين درس جديد',
          bodyHe: `${stamp} · ${created.arena.nameHe}`,
          bodyAr: `${stamp} · ${created.arena.nameAr}`,
          instructorIds: [created.instructorId],
          riderIds: created.participants.map((item) => item.riderId),
        }));
      }
    }
  });

  if (result.ok) await dispatchNotificationPushes(pushNotificationIds);
  return result.ok ? { ok: true, day: input.day } : result;
}

export async function changeLessonStatus(form: FormData): Promise<LessonResult> {
  const admin = await requireRole('ADMIN');
  let id: number, version: Date;
  const status = form.get('status');
  try { id = positiveId(form.get('id')); version = lessonVersion(form.get('version')); } catch { return { ok: false, error: 'invalid' }; }
  if (status !== 'CANCELLED' && status !== 'COMPLETED') return { ok: false, error: 'invalid' };

  const pushNotificationIds: number[] = [];
  const result = await transaction(async (tx) => {
    const farm = await farmById(tx, admin.farmId);
    const lesson = await tx.lesson.findFirst({ where: { id, farmId: farm.id } });
    if (!lesson || lesson.status !== 'SCHEDULED' || lesson.updatedAt.getTime() !== version.getTime()) throw new BookingError('stale');
    if (status === 'COMPLETED' && lesson.endsAt.getTime() > Date.now()) throw new BookingError('future');
    const before = await lessonSnapshot(tx, id, farm.id);
    await tx.lesson.update({ where: { id }, data: { status } });
    await tx.lessonAudit.create({
      data: {
        lessonId: id,
        actorUserId: admin.id,
        action: status,
        descriptionHe: status === 'CANCELLED' ? 'השיעור בוטל' : 'השיעור סומן כהושלם',
        descriptionAr: status === 'CANCELLED' ? 'تم إلغاء الدرس' : 'تم تحديد الدرس كمكتمل',
      },
    });
    if (status === 'CANCELLED' && before) {
      const stamp = localStamp(before.startsAt, farm.timezone).slice(0, 16).replace('T', ' ');
      pushNotificationIds.push(...await notifyLessonAudience(tx, {
        farmId: farm.id,
        lessonId: id,
        actorUserId: admin.id,
        type: 'LESSON_CANCELLED',
        sourceVersion: `${Date.now()}`,
        titleHe: 'השיעור בוטל',
        titleAr: 'تم إلغاء الدرس',
        bodyHe: `${stamp} · ${before.arena.nameHe}`,
        bodyAr: `${stamp} · ${before.arena.nameAr}`,
        instructorIds: [before.instructorId],
        riderIds: before.participants.map((item) => item.riderId),
      }));
    }
  });
  if (result.ok) await dispatchNotificationPushes(pushNotificationIds);
  return result;
}
