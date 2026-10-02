import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pushIsConfigured } from '@/lib/web-push';

const PUSH_DEVICE_COOKIE = 'abu_majed_push_device';

type SubscriptionBody = {
  endpoint?: unknown;
  expirationTime?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

function validString(value: unknown, max = 4096) {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;
}

function setDeviceCookie(response: NextResponse, deviceKey: string) {
  response.cookies.set(PUSH_DEVICE_COOKIE, deviceKey, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function GET() {
  const user = await requireUser();
  const count = await prisma.pushSubscription.count({ where: { userId: user.id } });
  return NextResponse.json({ configured: pushIsConfigured(), subscribed: count > 0, devices: count }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!pushIsConfigured()) {
    return NextResponse.json({ error: 'Push is not configured on the server.' }, { status: 503 });
  }

  let body: SubscriptionBody;
  try { body = await request.json() as SubscriptionBody; } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const endpoint = validString(body.endpoint, 8192);
  const p256dh = validString(body.keys?.p256dh, 512);
  const auth = validString(body.keys?.auth, 512);
  let endpointIsValid = false;
  try { endpointIsValid = Boolean(endpoint && new URL(endpoint).protocol === 'https:'); } catch { endpointIsValid = false; }
  let keysAreValid = false;
  try {
    keysAreValid = Boolean(
      p256dh
      && auth
      && Buffer.from(p256dh, 'base64url').length === 65
      && Buffer.from(p256dh, 'base64url')[0] === 4
      && Buffer.from(auth, 'base64url').length >= 16,
    );
  } catch { keysAreValid = false; }
  if (!endpoint || !p256dh || !auth || !endpointIsValid || !keysAreValid) {
    return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 });
  }

  const expiration = body.expirationTime === null || body.expirationTime === undefined
    ? null
    : Number(body.expirationTime);
  const expirationTime = expiration !== null && Number.isFinite(expiration) && expiration >= 0
    ? BigInt(Math.floor(expiration))
    : null;

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      deviceKey: randomUUID(),
      endpoint,
      p256dh,
      auth,
      expirationTime,
      userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
      userId: user.id,
      farmId: user.farmId,
    },
    update: {
      p256dh,
      auth,
      expirationTime,
      userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
      userId: user.id,
      farmId: user.farmId,
    },
    select: { deviceKey: true },
  });

  const response = NextResponse.json({ ok: true });
  setDeviceCookie(response, subscription.deviceKey);
  return response;
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  let endpoint: string | null = null;
  try {
    const body = await request.json() as { endpoint?: unknown };
    endpoint = validString(body.endpoint, 8192);
  } catch {
    // A missing body means remove all subscriptions belonging to this user.
  }

  await prisma.pushSubscription.deleteMany({
    where: endpoint ? { userId: user.id, endpoint } : { userId: user.id },
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PUSH_DEVICE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
