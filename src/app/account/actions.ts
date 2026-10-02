'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';

export type ProfileState = { ok?: boolean; error?: 'invalid' | 'save' };
export type PasswordState = { ok?: boolean; error?: 'invalid' | 'current' | 'same' | 'save' };

export async function updateProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const displayName = String(form.get('displayName') ?? '').trim();
  if (displayName.length < 2 || displayName.length > 80) return { error: 'invalid' };
  try {
    await prisma.user.update({ where: { id: user.id }, data: { displayName } });
    revalidatePath('/account');
    revalidatePath('/admin');
    revalidatePath('/instructor');
    revalidatePath('/rider');
    return { ok: true };
  } catch {
    return { error: 'save' };
  }
}

export async function changePassword(_: PasswordState, form: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const currentPassword = String(form.get('currentPassword') ?? '');
  const newPassword = String(form.get('newPassword') ?? '');
  const confirmPassword = String(form.get('confirmPassword') ?? '');

  if (!currentPassword || newPassword.length < 8 || newPassword.length > 128 || newPassword !== confirmPassword) {
    return { error: 'invalid' };
  }

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !verifyPassword(currentPassword, record.passwordHash)) return { error: 'current' };
  if (verifyPassword(newPassword, record.passwordHash)) return { error: 'same' };

  try {
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } });
    return { ok: true };
  } catch {
    return { error: 'save' };
  }
}
