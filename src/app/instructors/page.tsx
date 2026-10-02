import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InstructorManager } from '@/components/instructor-manager';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';

export default async function InstructorsPage() {
  await connection();
  const admin = await requireRole('ADMIN');
  try {
    const instructors = await prisma.instructor.findMany({ where: { farmId: admin.farmId }, orderBy: { id: 'desc' }, select: { id: true, name: true, phone: true, isActive: true } });
    return <AdminShell userName={admin.displayName} title="מדריכים / المدربون" subtitle="צוות ההדרכה של החווה"><InstructorManager instructors={instructors} /></AdminShell>;
  } catch { return <AdminShell userName={admin.displayName} title="מדריכים / المدربون" subtitle="צוות ההדרכה של החווה"><InstructorManager instructors={[]} issue="save" /></AdminShell>; }
}
