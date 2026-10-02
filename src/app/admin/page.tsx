import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FarmDashboard } from '@/components/farm-dashboard';
import { requireRole } from '@/lib/auth';
import { localStamp, moveDay, zonedTime } from '@/lib/lesson-time';

export default async function AdminPage() {
  await connection();
  const admin = await requireRole('ADMIN');

  try {
    const farm = await prisma.farm.findUnique({
      where: { id: admin.farmId },
      select: {
        id: true,
        name: true,
        timezone: true,
        arenas: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            code: true,
            nameHe: true,
            nameAr: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            horses: true,
            riders: true,
            instructors: true,
            lessons: true,
          },
        },
      },
    });

    if (!farm) {
      return <FarmDashboard issue="empty" userName={admin.displayName} />;
    }

    const today = localStamp(new Date(), farm.timezone).slice(0, 10);
    const start = zonedTime(today, '00:00', farm.timezone);
    const end = zonedTime(moveDay(today, 1), '00:00', farm.timezone);

    const rows = await prisma.lesson.findMany({
      where: {
        farmId: farm.id,
        status: { not: 'CANCELLED' },
        startsAt: { lt: end },
        endsAt: { gt: start },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      include: {
        instructor: { select: { name: true } },
        arena: { select: { nameHe: true, nameAr: true } },
        participants: {
          orderBy: { id: 'asc' },
          include: {
            rider: { select: { name: true } },
            horse: { select: { name: true } },
          },
        },
      },
    });

    const todayLessons = rows.map((row) => ({
      id: row.id,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      status: row.status,
      instructorName: row.instructor.name,
      arenaHe: row.arena.nameHe,
      arenaAr: row.arena.nameAr,
      participants: row.participants.map((participant) => ({
        riderName: participant.rider.name,
        horseName: participant.horse.name,
      })),
    }));

    return (
      <FarmDashboard
        farm={farm}
        userName={admin.displayName}
        today={today}
        zone={farm.timezone}
        todayLessons={todayLessons}
      />
    );
  } catch {
    return <FarmDashboard issue="connection" userName={admin.displayName} />;
  }
}
