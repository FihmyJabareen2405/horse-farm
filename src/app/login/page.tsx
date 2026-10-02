import { LoginForm } from '@/components/login-form';
import { FarmEntry } from '@/components/farm-entry';

type LoginRole = 'admin' | 'instructor' | 'rider';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[]; role?: string | string[] }>;
}) {
  const params = await searchParams;
  const lang = params.lang === 'ar' ? 'ar' : 'he';
  const role =
    typeof params.role === 'string' &&
    ['admin', 'instructor', 'rider'].includes(params.role)
      ? (params.role as LoginRole)
      : null;

  // Always show the profile picker at /login, even when another user
  // is already signed in. Choosing a role then authenticating replaces
  // the existing session with the selected account.
  if (!role) return <FarmEntry initialLanguage={lang} />;

  return <LoginForm lang={lang} role={role} />;
}
