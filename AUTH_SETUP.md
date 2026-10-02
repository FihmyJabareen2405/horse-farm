# Authentication setup

1. Copy `.env.example` values into your existing `.env` / `.env.local` and keep your real Neon URLs private.
2. Add `AUTH_SECRET` with at least 32 random characters.
3. Apply the database migration:
   `npx prisma migrate deploy`
4. Generate Prisma Client if needed:
   `npx prisma generate`
5. Run the app:
   `npm run dev`
6. Open `/setup` once to create the first administrator.
7. After login, open **Users / Permissions** (`/users`) to create instructor and rider accounts and link them to existing instructor/rider records.

Security notes:
- Passwords are stored as salted scrypt hashes, never as plaintext.
- The session cookie is HttpOnly, SameSite=Lax, signed with HMAC-SHA256, and Secure in production.
- Every protected page verifies the current user against the database.
- Management Server Actions independently require the ADMIN role.
