import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildXlsx } from '@/lib/xlsx';
import { localStamp, moveDay, validDay, zonedTime } from '@/lib/lesson-time';

export const runtime = 'nodejs';

const statusText = {
  SCHEDULED: 'מתוכנן / مجدول',
  COMPLETED: 'הושלם / مكتمل',
  CANCELLED: 'בוטל / ملغى',
} as const;

function numberFilter(value: string | null) {
  if (!value || value === 'all') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: NextRequest) {
  const user = await currentUser();

  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  if (user.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const farm = await prisma.farm.findUnique({
    where: { id: user.farmId },
    select: { id: true, name: true, timezone: true },
  });

  if (!farm) return new NextResponse('Farm not found', { status: 404 });

  const farmId = farm.id;
  const farmName = farm.name;
  const timeZone = farm.timezone;

  const requestedDate = request.nextUrl.searchParams.get('date');
  const today = localStamp(new Date(), timeZone).slice(0, 10);
  const day = requestedDate && validDay(requestedDate) ? requestedDate : today;

  const instructorFilter = numberFilter(
    request.nextUrl.searchParams.get('instructor'),
  );
  const arenaFilter = numberFilter(request.nextUrl.searchParams.get('arena'));
  const statusFilter = request.nextUrl.searchParams.get('status') ?? 'active';

  const start = zonedTime(day, '00:00', timeZone);
  const end = zonedTime(moveDay(day, 1), '00:00', timeZone);

  const lessons = await prisma.lesson.findMany({
    where: {
      farmId,
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

  const filtered = lessons.filter((lesson) => {
    if (instructorFilter && lesson.instructorId !== instructorFilter) return false;
    if (arenaFilter && lesson.arenaId !== arenaFilter) return false;

    if (statusFilter === 'active' && lesson.status === 'CANCELLED') return false;

    if (
      ['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(statusFilter) &&
      lesson.status !== statusFilter
    ) {
      return false;
    }

    return true;
  });

  function time(value: Date) {
    return new Intl.DateTimeFormat('he-IL', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(value);
  }

  const dataRows = filtered.flatMap((lesson) => {
    const participants =
      lesson.participants.length > 0
        ? lesson.participants
        : [{ rider: { name: '' }, horse: { name: '' } }];

    return participants.map((participant) => [
      day,
      time(lesson.startsAt),
      time(lesson.endsAt),
      `${lesson.arena.nameHe} / ${lesson.arena.nameAr}`,
      lesson.instructor.name,
      participant.rider.name,
      participant.horse.name,
      statusText[lesson.status],
    ]);
  });

  const participantCount = filtered.reduce(
    (sum, lesson) => sum + lesson.participants.length,
    0,
  );

  const workbook = buildXlsx([
    {
      name: 'Daily Schedule',
      rows: [
        [
          'תאריך / التاريخ',
          'משעה / من',
          'עד שעה / إلى',
          'מגרש / الميدان',
          'מדריך / المدرب',
          'רוכב / الفارس',
          'סוס / الحصان',
          'סטטוס / الحالة',
        ],
        ...dataRows,
      ],
    },
    {
      name: 'Summary',
      rows: [
        ['מדד / البيان', 'ערך / القيمة'],
        ['חווה / المربط', farmName],
        ['תאריך / التاريخ', day],
        ['מספר שיעורים / عدد الدروس', filtered.length],
        ['מספר שיבוצי רוכבים / عدد الفرسان', participantCount],
        [
          'סינון מדריך / تصفية المدرب',
          instructorFilter ? String(instructorFilter) : 'הכול / الكل',
        ],
        [
          'סינון מגרש / تصفية الميدان',
          arenaFilter ? String(arenaFilter) : 'הכול / الكل',
        ],
        ['סינון סטטוס / تصفية الحالة', statusFilter],
      ],
    },
  ]);

  const filename = `horse-farm-daily-${day}.xlsx`;

  return new NextResponse(new Uint8Array(workbook), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
