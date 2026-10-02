import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { UserManager } from '@/components/user-manager';
import { AdminShell } from '@/components/admin-shell';
export default async function UsersPage(){const admin=await requireRole('ADMIN');const [users,instructors,riders]=await Promise.all([
 prisma.user.findMany({where:{farmId:admin.farmId},orderBy:{id:'asc'},select:{id:true,username:true,displayName:true,role:true,isActive:true,instructor:{select:{name:true}},rider:{select:{name:true}}}}),
 prisma.instructor.findMany({where:{farmId:admin.farmId,isActive:true,user:null},orderBy:{name:'asc'},select:{id:true,name:true}}),
 prisma.rider.findMany({where:{farmId:admin.farmId,isActive:true,user:null},orderBy:{name:'asc'},select:{id:true,name:true}})
]);return <AdminShell userName={admin.displayName} title="משתמשים / المستخدمون" subtitle="חשבונות, תפקידים והרשאות"><UserManager users={users} instructors={instructors} riders={riders}/></AdminShell>}
