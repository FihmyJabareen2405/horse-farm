import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TreatmentManager } from '@/components/treatment-manager';
import { treatmentVersion } from '@/lib/treatment-version';
import { localStamp } from '@/lib/lesson-time';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';
export default async function TreatmentsPage() {
  await connection();
  const admin = await requireRole('ADMIN');
  const fallback = localStamp(new Date(),'Asia/Jerusalem').slice(0,10);
  try {
    const farm = await prisma.farm.findUnique({ where: { id: admin.farmId }, select: { id: true, timezone: true } });
    if (!farm) return <AdminShell userName={admin.displayName} title="טיפולים / العلاجات" subtitle="מעקב טיפולים ותחזוקת סוסים"><TreatmentManager horses={[]} treatments={[]} today={fallback} issue="farm" /></AdminShell>;
    const [horses,rows] = await Promise.all([
      prisma.horse.findMany({ where: { farmId: farm.id }, orderBy: { name: 'asc' }, select: { id: true, name: true, isActive: true } }),
      prisma.treatment.findMany({ where: { horse: { farmId: farm.id } }, orderBy: [{ performedAt: 'desc' }, { id: 'desc' }], include: { horse: { select: { name: true } } } }),
    ]);
    const treatments = rows.map(r => ({ id:r.id,horseId:r.horseId,horseName:r.horse.name,type:r.type,performedAt:r.performedAt.toISOString().slice(0,10),nextDueAt:r.nextDueAt?.toISOString().slice(0,10)??null,provider:r.provider,notes:r.notes,version:treatmentVersion(r) }));
    return <AdminShell userName={admin.displayName} title="טיפולים / العلاجات" subtitle="מעקב טיפולים ותחזוקת סוסים"><TreatmentManager horses={horses} treatments={treatments} today={localStamp(new Date(),farm.timezone).slice(0,10)} /></AdminShell>;
  } catch { return <AdminShell userName={admin.displayName} title="טיפולים / العلاجات" subtitle="מעקב טיפולים ותחזוקת סוסים"><TreatmentManager horses={[]} treatments={[]} today={fallback} issue="save" /></AdminShell>; }
}
