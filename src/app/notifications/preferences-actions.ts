'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function checked(form: FormData, key: string) {
  return form.get(key) === 'on';
}

export async function saveNotificationPreferences(form: FormData) {
  const user = await requireUser();

  const existing = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
  });

  const data = {
    lessonUpcoming: user.role === 'ADMIN' ? (existing?.lessonUpcoming ?? true) : checked(form, 'lessonUpcoming'),
    lessonCreated: user.role === 'ADMIN' ? (existing?.lessonCreated ?? true) : checked(form, 'lessonCreated'),
    lessonUpdated: user.role === 'ADMIN' ? (existing?.lessonUpdated ?? true) : checked(form, 'lessonUpdated'),
    lessonCancelled: user.role === 'ADMIN' ? (existing?.lessonCancelled ?? true) : checked(form, 'lessonCancelled'),
    treatmentDue: user.role === 'ADMIN' ? checked(form, 'treatmentDue') : (existing?.treatmentDue ?? true),
  };

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  revalidatePath('/notifications');
}
