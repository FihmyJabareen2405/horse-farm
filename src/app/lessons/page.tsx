import {connection} from 'next/server';
import {prisma} from '@/lib/prisma';
import {LessonManager} from '@/components/lesson-manager';
import {localStamp,validDay,moveDay,zonedTime} from '@/lib/lesson-time';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';
export default async function LessonsPage({searchParams}:{searchParams:Promise<{date?:string|string[]}>}){
 await connection();const admin=await requireRole('ADMIN');const params=await searchParams;
 const empty={lessons:[],instructors:[],riders:[],horses:[],arenas:[],day:localStamp(new Date(),'Asia/Jerusalem').slice(0,10),zone:'Asia/Jerusalem'};
 try{
 const farm=await prisma.farm.findUnique({where:{id:admin.farmId},select:{id:true,timezone:true}});if(!farm)return <AdminShell userName={admin.displayName} title="שיעורים / الدروس" subtitle="ניהול, עריכה והיסטוריית שיעורים"><LessonManager {...empty} issue="farm"/></AdminShell>;
 const day=typeof params.date==='string'&&validDay(params.date)&&params.date<='2100-12-30'?params.date:localStamp(new Date(),farm.timezone).slice(0,10);
 const start=zonedTime(day,'00:00',farm.timezone),end=zonedTime(moveDay(day,1),'00:00',farm.timezone),where={farmId:farm.id};
 const [rows,instructors,riders,horses,arenas]=await Promise.all([
 prisma.lesson.findMany({where:{...where,startsAt:{lt:end},endsAt:{gt:start}},orderBy:[{startsAt:'asc'},{id:'asc'}],include:{instructor:true,arena:true,participants:{orderBy:{id:'asc'},include:{rider:true,horse:true}},audits:{orderBy:{createdAt:'desc'},take:20,include:{actor:{select:{displayName:true}}}}}}),
 prisma.instructor.findMany({where,orderBy:{name:'asc'},select:{id:true,name:true,isActive:true}}),prisma.rider.findMany({where,orderBy:{name:'asc'},select:{id:true,name:true,isActive:true}}),prisma.horse.findMany({where,orderBy:{name:'asc'},select:{id:true,name:true,isActive:true}}),prisma.arena.findMany({where,orderBy:{id:'asc'},select:{id:true,nameHe:true,nameAr:true,isActive:true}})]);
 const lessons=rows.map(r=>({id:r.id,startsAt:r.startsAt.toISOString(),endsAt:r.endsAt.toISOString(),updatedAt:r.updatedAt.toISOString(),status:r.status,notes:r.notes,instructorId:r.instructorId,arenaId:r.arenaId,instructorName:r.instructor.name,arenaHe:r.arena.nameHe,arenaAr:r.arena.nameAr,participants:r.participants.map(p=>({riderId:p.riderId,horseId:p.horseId,riderName:p.rider.name,horseName:p.horse.name})),audits:r.audits.map(a=>({id:a.id,action:a.action,descriptionHe:a.descriptionHe,descriptionAr:a.descriptionAr,createdAt:a.createdAt.toISOString(),actorName:a.actor?.displayName??null}))}));
 return <AdminShell userName={admin.displayName} title="שיעורים / الدروس" subtitle="ניהול, עריכה והיסטוריית שיעורים"><LessonManager lessons={lessons} instructors={instructors} riders={riders} horses={horses} arenas={arenas} day={day} zone={farm.timezone}/></AdminShell>;
 }catch{return <AdminShell userName={admin.displayName} title="שיעורים / الدروس" subtitle="ניהול, עריכה והיסטוריית שיעורים"><LessonManager {...empty} issue="save"/></AdminShell>;}
}
