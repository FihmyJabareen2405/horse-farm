import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RiderManager } from '@/components/rider-manager';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';

export default async function RidersPage() {
  await connection();
  const admin = await requireRole('ADMIN');
  try {
    const riders = await prisma.rider.findMany({ where: { farmId: admin.farmId }, orderBy: { id: 'desc' }, select: { id: true, name: true, phone: true, level: true, notes: true, isActive: true } });
    return <AdminShell userName={admin.displayName} title="רוכבים / الفرسان" subtitle="רוכבים, רמות והערות"><RiderManager riders={riders} /></AdminShell>;
  } catch { return <AdminShell userName={admin.displayName} title="רוכבים / الفرسان" subtitle="רוכבים, רמות והערות"><RiderManager riders={[]} issue="save" /></AdminShell>; }
}
