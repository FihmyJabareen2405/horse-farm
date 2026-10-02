'use server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createSession, homeForRole } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

export type LoginState = { error?: 'invalid' | 'setup' | 'config' };

const roleMap = {
  admin: 'ADMIN',
  instructor: 'INSTRUCTOR',
  rider: 'RIDER',
} as const;

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get('username') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const selectedRole = String(form.get('role') ?? '') as keyof typeof roleMap;
  const expectedRole = roleMap[selectedRole];

  if (!username || !password || !expectedRole) return { error: 'invalid' };
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) return { error: 'config' };

  const count = await prisma.user.count();
  if (count === 0) return { error: 'setup' };

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user?.isActive || user.role !== expectedRole || !verifyPassword(password, user.passwordHash)) {
    return { error: 'invalid' };
  }

  await createSession(user.id);
  redirect(homeForRole(user.role));
}
