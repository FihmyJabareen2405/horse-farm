'use client';

import { BellRing, BellOff, LoaderCircle, ShieldAlert, Smartphone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import styles from './push-notification-settings.module.css';

type State = 'loading' | 'unsupported' | 'server-off' | 'blocked' | 'off' | 'on' | 'error';

function toApplicationServerKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export function PushNotificationSettings() {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const secureSupported = useMemo(() => typeof window !== 'undefined'
    && window.isSecureContext
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!secureSupported) {
        if (active) setState('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        if (active) setState('blocked');
        return;
      }
      try {
        const configResponse = await fetch('/api/push/public-key', { cache: 'no-store' });
        const config = await configResponse.json() as { configured?: boolean };
        if (!config.configured) {
          if (active) setState('server-off');
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (active) setState(subscription ? 'on' : 'off');
      } catch {
        if (active) setState('error');
      }
    }
    void load();
    return () => { active = false; };
  }, [secureSupported]);

  async function enable() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!secureSupported) throw new Error('unsupported');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return;
      }

      const keyResponse = await fetch('/api/push/public-key', { cache: 'no-store' });
      if (!keyResponse.ok) throw new Error('config');
      const data = await keyResponse.json() as { publicKey?: string | null; configured?: boolean };
      if (!data.configured || !data.publicKey) {
        setState('server-off');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toApplicationServerKey(data.publicKey),
        });
      }

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error('save');
      setState('on');
      setMessage('התראות Push הופעלו במכשיר הזה / تم تفعيل إشعارات Push على هذا الجهاز');
    } catch {
      setState('error');
      setMessage('לא הצלחנו להפעיל Push כרגע / تعذّر تفعيل Push حالياً');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (busy || !secureSupported) return;
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setState('off');
      setMessage('התראות Push כובו במכשיר הזה / تم إيقاف إشعارات Push على هذا الجهاز');
    } catch {
      setState('error');
      setMessage('לא הצלחנו לכבות Push כרגע / تعذّر إيقاف Push حالياً');
    } finally {
      setBusy(false);
    }
  }

  const copy = {
    loading: ['בודק תמיכה בהתראות…', 'جارٍ فحص دعم الإشعارات…'],
    unsupported: ['Push זמין ב־HTTPS או localhost ובדפדפן תומך.', 'يتطلب Push اتصال HTTPS أو localhost ومتصفحاً داعماً.'],
    'server-off': ['צריך להשלים את הגדרת VAPID בשרת.', 'يجب إكمال إعداد VAPID على الخادم.'],
    blocked: ['הדפדפן חסם התראות. יש לאפשר אותן בהגדרות האתר.', 'المتصفح حظر الإشعارات. فعّلها من إعدادات الموقع.'],
    off: ['Push כבוי במכשיר הזה.', 'إشعارات Push متوقفة على هذا الجهاز.'],
    on: ['Push פעיל במכשיר הזה.', 'إشعارات Push مفعّلة على هذا الجهاز.'],
    error: ['אירעה תקלה בהגדרת Push.', 'حدث خطأ أثناء إعداد Push.'],
  }[state];

  return (
    <section className={styles.card} aria-label="Push notifications">
      <div className={styles.icon}>
        {state === 'on' ? <BellRing size={22} /> : state === 'blocked' ? <ShieldAlert size={22} /> : <Smartphone size={22} />}
      </div>
      <div className={styles.copy}>
        <span className={styles.kicker}>PUSH NOTIFICATIONS</span>
        <h3 className={styles.title}>התראות לטלפון / إشعارات للهاتف</h3>
        <p className={styles.text}>{copy[0]}</p>
        <p className={styles.text} lang="ar">{copy[1]}</p>
        {message && <div className={styles.message} role="status">{message}</div>}
      </div>
      <div className={styles.action}>
        {state === 'on' ? (
          <button type="button" onClick={() => void disable()} disabled={busy} className={styles.disableButton}>
            {busy ? <LoaderCircle className={styles.spin} size={17} /> : <BellOff size={17} />}
            כיבוי / إيقاف
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void enable()}
            disabled={busy || state === 'loading' || state === 'unsupported' || state === 'server-off' || state === 'blocked'}
            className={styles.enableButton}
          >
            {busy ? <LoaderCircle className={styles.spin} size={17} /> : <BellRing size={17} />}
            הפעלה / تفعيل
          </button>
        )}
      </div>
    </section>
  );
}
