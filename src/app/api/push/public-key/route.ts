import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { vapidPublicKey } from '@/lib/web-push';

export async function GET() {
  await requireUser();
  const publicKey = vapidPublicKey();
  return NextResponse.json({
    configured: Boolean(publicKey),
    publicKey,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
