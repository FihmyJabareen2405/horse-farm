import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SetupForm } from '@/components/setup-form';
export default async function SetupPage({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  if (await prisma.user.count()) redirect('/login');
  const params = await searchParams;
  return <SetupForm lang={params.lang === 'ar' ? 'ar' : 'he'} />;
}
