'use server';

import { revalidatePath } from 'next/cache';
import type { AttendanceStatus } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function positiveInt(value: FormDataEntryValue | null) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function setAttendance(formData: FormData) {
  const user = await requireRole('INSTRUCTOR');
  if (!user.instructorId) return;

  const participantId = positiveInt(formData.get('participantId'));
  const rawStatus = String(formData.get('attendance') ?? '');
  const allowed: AttendanceStatus[] = ['UNMARKED', 'PRESENT', 'ABSENT'];
  if (!participantId || !allowed.includes(rawStatus as AttendanceStatus)) return;

  const participant = await prisma.lessonParticipant.findFirst({
    where: {
      id: participantId,
      lesson: {
        farmId: user.farmId,
        instructorId: user.instructorId,
        status: { not: 'CANCELLED' },
      },
    },
    select: { id: true },
  });
  if (!participant) return;

  await prisma.lessonParticipant.update({
    where: { id: participant.id },
    data: { attendance: rawStatus as AttendanceStatus },
  });
  revalidatePath('/instructor');
}


export async function saveParticipantProgress(formData: FormData) {
  const user = await requireRole('INSTRUCTOR');
  if (!user.instructorId) return;

  const participantId = positiveInt(formData.get('participantId'));
  const rawScore = Number(formData.get('progressScore'));
  const note = String(formData.get('instructorNote') ?? '').trim();
  const progressScore = Number.isInteger(rawScore) && rawScore >= 1 && rawScore <= 5 ? rawScore : null;
  if (!participantId || note.length > 2000) return;

  const participant = await prisma.lessonParticipant.findFirst({
    where: {
      id: participantId,
      lesson: {
        farmId: user.farmId,
        instructorId: user.instructorId,
        status: { not: 'CANCELLED' },
      },
    },
    select: { id: true },
  });
  if (!participant) return;

  await prisma.lessonParticipant.update({
    where: { id: participant.id },
    data: {
      progressScore,
      instructorNote: note || null,
    },
  });
  revalidatePath('/instructor');
  revalidatePath('/rider');
}

export async function completeLesson(formData: FormData) {
  const user = await requireRole('INSTRUCTOR');
  const instructorId = user.instructorId;
  if (!instructorId) return;

  const lessonId = positiveInt(formData.get('lessonId'));
  if (!lessonId) return;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.lesson.updateMany({
      where: {
        id: lessonId,
        farmId: user.farmId,
        instructorId,
        status: 'SCHEDULED',
        startsAt: { lte: new Date() },
      },
      data: { status: 'COMPLETED' },
    });
    if (updated.count === 1) {
      await tx.lessonAudit.create({
        data: {
          lessonId,
          actorUserId: user.id,
          action: 'COMPLETED',
          descriptionHe: 'השיעור סומן כהושלם על ידי המדריך',
          descriptionAr: 'تم تحديد الدرس كمكتمل بواسطة المدرب',
        },
      });
    }
  });
  revalidatePath('/instructor');
  revalidatePath('/rider');
  revalidatePath('/lessons');
  revalidatePath('/lessons/week');
  revalidatePath('/admin');
}
