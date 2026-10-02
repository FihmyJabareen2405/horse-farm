'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function safeHref(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/notifications';
  return value;
}

export async function openNotification(form: FormData) {
  const user = await requireUser();
  const id = Number(form.get('id'));
  const href = safeHref(form.get('href'));
  if (!Number.isInteger(id) || id <= 0) redirect('/notifications');

  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/notifications');
  redirect(href);
}

export async function markNotificationRead(form: FormData) {
  const user = await requireUser();
  const id = Number(form.get('id'));
  if (!Number.isInteger(id) || id <= 0) return;

  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/notifications');
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/notifications');
}
