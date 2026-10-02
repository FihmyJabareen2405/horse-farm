import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HorseManager } from '@/components/horse-manager';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';

export default async function HorsesPage() {
  await connection();
  const admin = await requireRole('ADMIN');
  try {
    const horses = await prisma.horse.findMany({ where: { farmId: admin.farmId }, orderBy: { id: 'desc' }, select: { id: true, name: true, birthDate: true, breed: true, color: true, gender: true, notes: true, isActive: true } });
    return <AdminShell userName={admin.displayName} title="סוסים / الخيول" subtitle="ניהול סוסים וכרטיסי מידע"><HorseManager horses={horses.map(h => ({ ...h, birthDate: h.birthDate?.toISOString().slice(0,10) ?? '' }))} /></AdminShell>;
  } catch { return <AdminShell userName={admin.displayName} title="סוסים / الخيول" subtitle="ניהול סוסים וכרטיסי מידע"><HorseManager horses={[]} issue="save" /></AdminShell>; }
}
