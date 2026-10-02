'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { requireRole } from '@/lib/auth';

export type UserActionState = { ok?: boolean; error?: 'invalid'|'exists'|'farm'|'link'|'save' };
export async function createUser(_: UserActionState, form: FormData): Promise<UserActionState> {
  const admin = await requireRole('ADMIN');
  const username = String(form.get('username') ?? '').trim().toLowerCase();
  const displayName = String(form.get('displayName') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const role = String(form.get('role') ?? '');
  const targetId = Number(form.get('targetId'));
  if (!/^[a-z0-9._-]{3,40}$/.test(username) || displayName.length < 2 || password.length < 8 || !['ADMIN','INSTRUCTOR','RIDER'].includes(role)) return { error:'invalid' };
  try {
    if (await prisma.user.findUnique({where:{username}})) return {error:'exists'};
    const farm = await prisma.farm.findUnique({where:{id:admin.farmId},select:{id:true}});
    if (!farm) return {error:'farm'};
    let instructorId: number|undefined, riderId: number|undefined;
    if (role === 'INSTRUCTOR') {
      if (!Number.isInteger(targetId) || targetId <= 0 || !(await prisma.instructor.findFirst({where:{id:targetId,farmId:farm.id,isActive:true}}))) return {error:'link'};
      if (await prisma.user.findFirst({where:{instructorId:targetId}})) return {error:'link'};
      instructorId = targetId;
    }
    if (role === 'RIDER') {
      if (!Number.isInteger(targetId) || targetId <= 0 || !(await prisma.rider.findFirst({where:{id:targetId,farmId:farm.id,isActive:true}}))) return {error:'link'};
      if (await prisma.user.findFirst({where:{riderId:targetId}})) return {error:'link'};
      riderId = targetId;
    }
    await prisma.user.create({data:{username,displayName,passwordHash:hashPassword(password),role:role as 'ADMIN'|'INSTRUCTOR'|'RIDER',farmId:farm.id,instructorId,riderId}});
  } catch { return {error:'save'}; }
  revalidatePath('/users');
  return {ok:true};
}
export async function toggleUser(form: FormData) {
  const admin = await requireRole('ADMIN');
  const id = Number(form.get('id'));
  if (!Number.isInteger(id) || id <= 0 || id === admin.id) return;
  const user = await prisma.user.findFirst({where:{id,farmId:admin.farmId},select:{id:true,isActive:true}});
  if (!user) return;
  await prisma.user.update({where:{id:user.id},data:{isActive:!user.isActive}});
  revalidatePath('/users');
}
