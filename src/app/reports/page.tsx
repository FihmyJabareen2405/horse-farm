import { connection } from 'next/server';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';
import { ReportsDashboard } from '@/components/reports-dashboard';
import { getReportsData } from '@/lib/reports';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  await connection();
  const admin = await requireRole('ADMIN');
  const params = await searchParams;

  try {
    const result = await getReportsData(admin.farmId, params);
    if (!result) {
      return (
        <AdminShell userName={admin.displayName} title="דוחות וסטטיסטיקות / التقارير والإحصائيات" subtitle="תמונת מצב תפעולית של החווה">
          <ReportsDashboard issue="farm" />
        </AdminShell>
      );
    }

    return (
      <AdminShell userName={admin.displayName} farmName={result.farm.name} title="דוחות וסטטיסטיקות / التقارير والإحصائيات" subtitle="נוכחות, עומסים, שימוש בסוסים וטיפולים">
        <ReportsDashboard data={result.data} />
      </AdminShell>
    );
  } catch (error) {
    console.error('ReportsPage failed', error);
    return (
      <AdminShell userName={admin.displayName} title="דוחות וסטטיסטיקות / التقارير والإحصائيات" subtitle="נוכחות, עומסים, שימוש בסוסים וטיפולים">
        <ReportsDashboard issue="connection" />
      </AdminShell>
    );
  }
}
