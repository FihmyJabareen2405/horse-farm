import 'server-only';

import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign,
} from 'crypto';
import { prisma } from '@/lib/prisma';

type StoredSubscription = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushPayload = {
  title: string;
  body?: string;
  href?: string | null;
  tag?: string;
};

function base64UrlEncode(value: Buffer | string) {
  const buffer = typeof value === 'string' ? Buffer.from(value) : value;
  return buffer.toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url');
}

function hmac(key: Buffer, data: Buffer) {
  return createHmac('sha256', key).update(data).digest();
}

function hkdfExtract(salt: Buffer, inputKeyMaterial: Buffer) {
  return hmac(salt, inputKeyMaterial);
}

function hkdfExpand(pseudoRandomKey: Buffer, info: Buffer, length: number) {
  const blocks: Buffer[] = [];
  let previous = Buffer.alloc(0);
  let generated = 0;
  let counter = 1;

  while (generated < length) {
    previous = hmac(
      pseudoRandomKey,
      Buffer.concat([previous, info, Buffer.from([counter])]),
    );
    blocks.push(previous);
    generated += previous.length;
    counter += 1;
  }

  return Buffer.concat(blocks).subarray(0, length);
}

function pushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;

  const publicBytes = base64UrlDecode(publicKey);
  const privateBytes = base64UrlDecode(privateKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 4 || privateBytes.length !== 32) return null;
  if (!subject.startsWith('mailto:') && !subject.startsWith('https://')) return null;
  return { publicKey, privateKey, subject, publicBytes };
}

export function vapidPublicKey() {
  return pushConfig()?.publicKey ?? null;
}

export function pushIsConfigured() {
  return pushConfig() !== null;
}

function vapidAuthorization(endpoint: string, config: NonNullable<ReturnType<typeof pushConfig>>) {
  const audience = new URL(endpoint).origin;
  const header = base64UrlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = base64UrlEncode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: config.subject,
  }));
  const signingInput = `${header}.${payload}`;

  const x = base64UrlEncode(config.publicBytes.subarray(1, 33));
  const y = base64UrlEncode(config.publicBytes.subarray(33, 65));
  const key = createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x,
      y,
      d: config.privateKey,
    },
    format: 'jwk',
  });
  const signature = sign('sha256', Buffer.from(signingInput), {
    key,
    dsaEncoding: 'ieee-p1363',
  });
  const token = `${signingInput}.${base64UrlEncode(signature)}`;
  return `vapid t=${token}, k=${config.publicKey}`;
}

function encryptPayload(subscription: StoredSubscription, payload: Buffer) {
  // RFC 8291 / RFC 8188, aes128gcm content encoding. One record is plenty for our short alerts.
  if (payload.length > 3500) throw new Error('Push payload is too large.');

  const userPublicKey = base64UrlDecode(subscription.p256dh);
  const authSecret = base64UrlDecode(subscription.auth);
  if (userPublicKey.length !== 65 || userPublicKey[0] !== 4 || authSecret.length < 16) {
    throw new Error('Invalid push subscription keys.');
  }

  const sender = createECDH('prime256v1');
  sender.generateKeys();
  const senderPublicKey = sender.getPublicKey();
  const sharedSecret = sender.computeSecret(userPublicKey);

  const authPrk = hkdfExtract(authSecret, sharedSecret);
  const keyInfo = Buffer.concat([
    Buffer.from('WebPush: info\0', 'utf8'),
    userPublicKey,
    senderPublicKey,
  ]);
  const inputKeyMaterial = hkdfExpand(authPrk, keyInfo, 32);

  const salt = randomBytes(16);
  const contentPrk = hkdfExtract(salt, inputKeyMaterial);
  const contentEncryptionKey = hkdfExpand(
    contentPrk,
    Buffer.from('Content-Encoding: aes128gcm\0', 'utf8'),
    16,
  );
  const nonce = hkdfExpand(
    contentPrk,
    Buffer.from('Content-Encoding: nonce\0', 'utf8'),
    12,
  );

  const plaintext = Buffer.concat([payload, Buffer.from([2])]);
  const cipher = createCipheriv('aes-128-gcm', contentEncryptionKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  const header = Buffer.alloc(16 + 4 + 1 + senderPublicKey.length);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16);
  header.writeUInt8(senderPublicKey.length, 20);
  senderPublicKey.copy(header, 21);
  return Buffer.concat([header, ciphertext]);
}

async function deliver(subscription: StoredSubscription, payload: PushPayload) {
  const config = pushConfig();
  if (!config) return { ok: false as const, stale: false as const };

  try {
    const encrypted = encryptPayload(subscription, Buffer.from(JSON.stringify(payload), 'utf8'));
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        Authorization: vapidAuthorization(subscription.endpoint, config),
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: '86400',
        Urgency: 'normal',
      },
      body: new Uint8Array(encrypted),
      cache: 'no-store',
    });

    if (response.status === 404 || response.status === 410) {
      return { ok: false as const, stale: true as const };
    }
    return { ok: response.ok, stale: false as const };
  } catch {
    return { ok: false as const, stale: false as const };
  }
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!pushIsConfigured()) return;
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  if (!subscriptions.length) return;

  const staleIds: number[] = [];
  await Promise.all(subscriptions.map(async (subscription) => {
    const result = await deliver(subscription, payload);
    if (result.stale) staleIds.push(subscription.id);
  }));

  if (staleIds.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } });
  }
}

export async function dispatchNotificationPushes(notificationIds: number[]) {
  if (!notificationIds.length || !pushIsConfigured()) return;
  const notifications = await prisma.notification.findMany({
    where: { id: { in: Array.from(new Set(notificationIds)) } },
    select: {
      id: true,
      type: true,
      userId: true,
      titleHe: true,
      titleAr: true,
      bodyHe: true,
      bodyAr: true,
      href: true,
      sourceKey: true,
      user: {
        select: {
          notificationPreference: {
            select: {
              lessonUpcoming: true,
              lessonCreated: true,
              lessonUpdated: true,
              lessonCancelled: true,
              treatmentDue: true,
            },
          },
        },
      },
    },
  });

  function allowed(notification: (typeof notifications)[number]) {
    const preference = notification.user.notificationPreference;
    if (!preference) return true;
    if (notification.type === 'LESSON_UPCOMING') return preference.lessonUpcoming;
    if (notification.type === 'LESSON_CREATED') return preference.lessonCreated;
    if (notification.type === 'LESSON_UPDATED') return preference.lessonUpdated;
    if (notification.type === 'LESSON_CANCELLED') return preference.lessonCancelled;
    if (notification.type === 'TREATMENT_DUE') return preference.treatmentDue;
    return true;
  }

  await Promise.all(notifications.filter(allowed).map((notification) => sendPushToUser(notification.userId, {
    title: `${notification.titleHe} · ${notification.titleAr}`,
    body: [notification.bodyHe, notification.bodyAr].filter(Boolean).join(' · '),
    href: notification.href ?? '/notifications',
    tag: notification.sourceKey,
  })));
}
