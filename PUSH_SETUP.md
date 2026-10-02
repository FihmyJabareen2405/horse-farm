# Push Notifications setup

Push works only on **HTTPS** (or `localhost`) and only after each user taps the Push enable button on `/notifications`.

## 1. Generate VAPID keys

Run once:

```powershell
node scripts/generate-vapid.cjs
```

Copy the three values into `.env` locally and into the hosting environment variables:

```env
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:your-email@example.com"
CRON_SECRET="use-a-long-random-secret-here"
```

Keep `VAPID_PRIVATE_KEY` and `CRON_SECRET` private. Do not commit `.env`.

## 2. Apply the database migration

```powershell
npx prisma migrate deploy
npx prisma generate
```

## 3. Local test

```powershell
npm run dev
```

Log in, open `/notifications`, press **הפעלה / تفعيل**, and approve browser notifications.

`localhost` supports Push registration, but background delivery depends on the browser/OS. Production should use HTTPS.

## 4. Scheduled reminders

`vercel.json` calls `/api/cron/notifications` every hour. The route accepts only:

```http
Authorization: Bearer <CRON_SECRET>
```

If your hosting plan does not run hourly cron jobs, call the same route from another scheduler at the cadence you want.

Scheduled reminders currently generate Push for:
- instructor lessons within 24 hours;
- rider lessons within 24 hours;
- admin horse treatments due within 7 days or overdue.

Lesson creation, update, and cancellation Push messages are sent immediately after the database transaction commits.
