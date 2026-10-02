import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

const COOKIE_NAME = 'abu_majed_session';
const MAX_AGE = 60 * 60 * 24 * 7;

type SessionPayload = { userId: number; issuedAt: number };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters.');
  return value;
}
function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}
function decode(token: string): SessionPayload | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    const expected = createHmac('sha256', secret()).update(body).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!Number.isInteger(parsed.userId) || !Number.isFinite(parsed.issuedAt)) return null;
    if (Date.now() - parsed.issuedAt > MAX_AGE * 1000) return null;
    return parsed;
  } catch { return null; }
}
export async function createSession(userId: number) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encode({ userId, issuedAt: Date.now() }), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE,
  });
}
export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}
export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decode(token);
  if (!payload) return null;
  return prisma.user.findFirst({
    where: { id: payload.userId, isActive: true },
    select: { id: true, username: true, displayName: true, role: true, farmId: true, instructorId: true, riderId: true },
  });
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}
export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/unauthorized');
  return user;
}
export function homeForRole(role: UserRole) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'INSTRUCTOR') return '/instructor';
  return '/rider';
}
