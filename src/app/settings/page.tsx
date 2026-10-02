import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FarmSettings } from '@/components/farm-settings';
import { farmSettingsVersion, arenaSettingsVersion } from '@/lib/settings-version';
import { requireRole } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';
export default async function SettingsPage() {
  await connection();
  const admin = await requireRole('ADMIN');
  try {
    const farm=await prisma.farm.findUnique({where:{id:admin.farmId},select:{id:true,name:true,timezone:true}});
    if(!farm)return <AdminShell userName={admin.displayName} title="הגדרות / الإعدادات" subtitle="פרטי החווה והמגרשים"><FarmSettings issue="farm"/></AdminShell>;
    const arenas=await prisma.arena.findMany({where:{farmId:farm.id},orderBy:{id:'asc'},include:{_count:{select:{lessons:{where:{status:'SCHEDULED',endsAt:{gt:new Date()}}}}}}});
    return <AdminShell userName={admin.displayName} title="הגדרות / الإعدادات" subtitle="פרטי החווה והמגרשים"><FarmSettings farm={{name:farm.name,timezone:farm.timezone,version:farmSettingsVersion(farm)}} arenas={arenas.map(a=>({id:a.id,code:a.code,nameHe:a.nameHe,nameAr:a.nameAr,isActive:a.isActive,scheduled:a._count.lessons,version:arenaSettingsVersion(a)}))}/></AdminShell>;
  }catch{return <AdminShell userName={admin.displayName} title="הגדרות / الإعدادات" subtitle="פרטי החווה והמגרשים"><FarmSettings issue="save"/></AdminShell>;}
}
