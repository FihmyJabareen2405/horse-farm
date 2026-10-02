import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LessonWeek } from '@/components/lesson-week';
import { localStamp, moveDay, zonedTime } from '@/lib/lesson-time';
import { weekDates } from '@/lib/lesson-week';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';
export default async function LessonWeekPage({searchParams}:{searchParams:Promise<{date?:string|string[]}>}) {
  await connection();
  const admin = await requireRole('ADMIN');
  const params=await searchParams;
  const fallback=localStamp(new Date(),'Asia/Jerusalem').slice(0,10);
  const empty={lessons:[],days:weekDates(fallback),today:fallback,zone:'Asia/Jerusalem'};
  try {
    const farm=await prisma.farm.findUnique({where:{id:admin.farmId},select:{id:true,timezone:true}});
    if(!farm)return <AdminShell userName={admin.displayName} title="יומן שבועי / الجدول الأسبوعي" subtitle="תצוגת שבוע ושיבוץ שיעורים"><LessonWeek {...empty} issue="farm"/></AdminShell>;
    const today=localStamp(new Date(),farm.timezone).slice(0,10);
    let days=weekDates(today);
    if(typeof params.date==='string'){try{days=weekDates(params.date);}catch{/* use current week for invalid query */}}
    const start=zonedTime(days[0],'00:00',farm.timezone),end=zonedTime(moveDay(days[0],7),'00:00',farm.timezone);
    const rows=await prisma.lesson.findMany({where:{farmId:farm.id,startsAt:{lt:end},endsAt:{gt:start}},orderBy:[{startsAt:'asc'},{id:'asc'}],include:{instructor:{select:{name:true}},arena:{select:{nameHe:true,nameAr:true}},participants:{orderBy:{id:'asc'},include:{rider:{select:{name:true}},horse:{select:{name:true}}}}}});
    const lessons=rows.map(r=>({id:r.id,startsAt:r.startsAt.toISOString(),endsAt:r.endsAt.toISOString(),status:r.status,instructorId:r.instructorId,instructorName:r.instructor.name,arenaId:r.arenaId,arenaHe:r.arena.nameHe,arenaAr:r.arena.nameAr,participants:r.participants.map(p=>({riderName:p.rider.name,horseName:p.horse.name}))}));
    return <AdminShell userName={admin.displayName} title="יומן שבועי / الجدول الأسبوعي" subtitle="תצוגת שבוע ושיבוץ שיעורים"><LessonWeek lessons={lessons} days={days} today={today} zone={farm.timezone}/></AdminShell>;
  }catch{return <AdminShell userName={admin.displayName} title="יומן שבועי / الجدول الأسبوعي" subtitle="תצוגת שבוע ושיבוץ שיעורים"><LessonWeek {...empty} issue="save"/></AdminShell>;}
}
