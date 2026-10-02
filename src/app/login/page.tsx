import { redirect } from 'next/navigation';
import { currentUser, homeForRole } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { FarmEntry } from '@/components/farm-entry';

type LoginRole = 'admin' | 'instructor' | 'rider';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ lang?: string | string[]; role?: string | string[] }> }) {
  const user = await currentUser();
  if (user) redirect(homeForRole(user.role));

  const params = await searchParams;
  const lang = params.lang === 'ar' ? 'ar' : 'he';
  const role = typeof params.role === 'string' && ['admin', 'instructor', 'rider'].includes(params.role)
    ? params.role as LoginRole
    : null;

  if (!role) return <FarmEntry initialLanguage={lang} />;
  return <LoginForm lang={lang} role={role} />;
}
