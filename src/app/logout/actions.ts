'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { clearSession, currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PUSH_DEVICE_COOKIE = 'abu_majed_push_device';

export async function logout() {
  const [user, jar] = await Promise.all([currentUser(), cookies()]);
  const deviceKey = jar.get(PUSH_DEVICE_COOKIE)?.value;
  if (user && deviceKey) {
    // Stop private alerts on the device that is logging out, without disabling the user's other devices.
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id, deviceKey } });
    jar.set(PUSH_DEVICE_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  }
  await clearSession();
  redirect('/login');
}
