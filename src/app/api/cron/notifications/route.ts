import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncNotificationsForUser } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, farmId: true, role: true, instructorId: true, riderId: true },
  });

  let synced = 0;
  const failures: number[] = [];
  for (const user of users) {
    try {
      await syncNotificationsForUser(user);
      synced += 1;
    } catch {
      failures.push(user.id);
    }
  }

  return NextResponse.json({ ok: failures.length === 0, synced, failed: failures.length });
}
