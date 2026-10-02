import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminShell } from '@/components/admin-shell';
import { SessionBar } from '@/components/session-bar';
import { AccountSettings } from '@/components/account-settings';

export default async function AccountPage() {
  const user = await requireUser();
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      username: true,
      displayName: true,
      role: true,
      farm: { select: { name: true } },
      instructor: { select: { name: true } },
      rider: { select: { name: true } },
    },
  });

  if (!record) return null;
  const content = (
    <AccountSettings
      username={record.username}
      displayName={record.displayName}
      role={record.role}
      farmName={record.farm.name}
      linkedName={record.instructor?.name ?? record.rider?.name ?? null}
    />
  );

  if (record.role === 'ADMIN') {
    return (
      <AdminShell
        userName={record.displayName}
        farmName={record.farm.name}
        title="החשבון שלי / حسابي"
        subtitle="פרטי משתמש ואבטחת חשבון"
      >
        {content}
      </AdminShell>
    );
  }

  return (
    <>
      <SessionBar name={record.displayName} role={record.role === 'INSTRUCTOR' ? 'מדריך / مدرب' : 'רוכב / فارس'} />
      <main className="portal-page">
        <div className="portal-container">{content}</div>
      </main>
    </>
  );
}
