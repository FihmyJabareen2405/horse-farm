'use server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';

export type SetupState = { error?: 'exists' | 'invalid' | 'password' | 'farm' | 'config' | 'save' };
export async function createFirstAdmin(_: SetupState, form: FormData): Promise<SetupState> {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) return { error: 'config' };
  const username = String(form.get('username') ?? '').trim().toLowerCase();
  const displayName = String(form.get('displayName') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  if (!/^[a-z0-9._-]{3,40}$/.test(username) || displayName.length < 2) return { error: 'invalid' };
  if (password.length < 8 || password !== confirm) return { error: 'password' };
  try {
    if (await prisma.user.count() !== 0) return { error: 'exists' };
    const farms = await prisma.farm.findMany({ take: 2, select: { id: true } });
    if (farms.length !== 1) return { error: 'farm' };
    const user = await prisma.user.create({ data: { username, displayName, passwordHash: hashPassword(password), role: 'ADMIN', farmId: farms[0].id } });
    await createSession(user.id);
  } catch { return { error: 'save' }; }
  redirect('/admin');
}
