import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { unreadNotificationCount } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });

  try {
    const count = await unreadNotificationCount(user);
    return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ count: 0 }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
