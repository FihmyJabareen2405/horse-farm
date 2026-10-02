import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getReportsData } from '@/lib/reports';
import { buildXlsx } from '@/lib/xlsx';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  if (user.role !== 'ADMIN') return new NextResponse('Forbidden', { status: 403 });

  const from = request.nextUrl.searchParams.get('from') ?? undefined;
  const to = request.nextUrl.searchParams.get('to') ?? undefined;
  const result = await getReportsData(user.farmId, { from, to });
  if (!result) return new NextResponse('Farm not found', { status: 404 });

  const { data, farm } = result;
  const workbook = buildXlsx([
    {
      name: 'Summary',
      rows: [
        ['מדד', 'ערך'],
        ['חווה', farm.name],
        ['מתאריך', data.from],
        ['עד תאריך', data.to],
        ['סה״כ שיעורים', data.summary.totalLessons],
        ['שיעורים שהושלמו', data.summary.completedLessons],
        ['שיעורים מתוכננים', data.summary.scheduledLessons],
        ['שיעורים שבוטלו', data.summary.cancelledLessons],
        ['שעות פעילות', data.summary.lessonHours],
        ['שיבוצי רוכבים', data.summary.participantAssignments],
        ['אחוז נוכחות', data.summary.attendanceRate],
        ['נוכחים', data.summary.present],
        ['נעדרים', data.summary.absent],
        ['לא סומן', data.summary.unmarked],
        ['התקדמות ממוצעת', data.summary.progressAverage],
      ],
    },
    {
      name: 'Monthly Trends',
      rows: [
        ['חודש', 'שיעורים', 'הושלמו', 'מתוכננים', 'בוטלו', 'נוכחים', 'נעדרים', 'לא סומן', 'אחוז נוכחות'],
        ...data.months.map((row) => [row.label, row.lessons, row.completed, row.scheduled, row.cancelled, row.present, row.absent, row.unmarked, row.attendanceRate]),
      ],
    },
    {
      name: 'Riders',
      rows: [
        ['רוכב', 'רמה', 'פעיל', 'שיעורים', 'נוכח', 'נעדר', 'לא סומן', 'אחוז נוכחות', 'התקדמות ממוצעת'],
        ...data.riders.map((row) => [row.name, row.level ?? '', row.active ? 'כן' : 'לא', row.lessons, row.present, row.absent, row.unmarked, row.attendanceRate, row.progressAverage]),
      ],
    },
    {
      name: 'Instructors',
      rows: [
        ['מדריך', 'פעיל', 'שיעורים', 'הושלמו', 'שיבוצי רוכבים', 'שעות'],
        ...data.instructors.map((row) => [row.name, row.active ? 'כן' : 'לא', row.lessons, row.completed, row.riders, row.hours]),
      ],
    },
    {
      name: 'Horses',
      rows: [
        ['סוס', 'פעיל', 'שיבוצים', 'שימושים שהושלמו', 'שעות', 'שימוש אחרון'],
        ...data.horses.map((row) => [row.name, row.active ? 'כן' : 'לא', row.lessons, row.completed, row.hours, row.lastUsedAt ? row.lastUsedAt.slice(0, 10) : '']),
      ],
    },
    {
      name: 'Treatments',
      rows: [
        ['סוס', 'טיפול', 'מועד הבא', 'ימים מהמועד'],
        ...data.treatments.map((row) => [row.horseName, row.type, row.dueAt, row.dayDiff]),
      ],
    },
  ]);

  const filename = `horse-farm-report-${data.from}-to-${data.to}.xlsx`;
  return new NextResponse(new Uint8Array(workbook), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
