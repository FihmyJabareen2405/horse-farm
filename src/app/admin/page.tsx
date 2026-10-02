import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FarmDashboard } from '@/components/farm-dashboard';
import { requireRole } from '@/lib/auth';

export default async function AdminPage() {
  await connection();
  const admin = await requireRole('ADMIN');
  try {
    const farm = await prisma.farm.findUnique({
      where: { id: admin.farmId },
      select: {
        id: true,
        name: true,
        arenas: { orderBy: { id: 'asc' }, select: { id: true, code: true, nameHe: true, nameAr: true, isActive: true } },
        _count: { select: { horses: true, riders: true, instructors: true, lessons: true } },
      },
    });
    if (!farm) return <FarmDashboard issue="empty" userName={admin.displayName} />;
    return <FarmDashboard farm={farm} userName={admin.displayName} />;
  } catch {
    return <FarmDashboard issue="connection" userName={admin.displayName} />;
  }
}
