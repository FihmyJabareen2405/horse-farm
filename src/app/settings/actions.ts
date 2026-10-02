'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseFarmSettings, parseArenaSettings } from '@/lib/settings-input';
import { farmSettingsVersion, arenaSettingsVersion } from '@/lib/settings-version';
export type SettingsError = 'invalid' | 'save' | 'farm' | 'disabled' | 'stale';
export type SettingsResult = { ok:true } | { ok:false; error:SettingsError };
function refreshSettings() {
  for (const path of ['/settings','/admin','/lessons','/lessons/week','/']) revalidatePath(path);
}
export async function saveFarmSettings(form:FormData):Promise<SettingsResult> {
  const admin = await requireRole('ADMIN');
  let input:ReturnType<typeof parseFarmSettings>;
  try { input = parseFarmSettings(form); } catch { return {ok:false,error:'invalid'}; }
  try {
    const farm=await prisma.farm.findUnique({where:{id:admin.farmId},select:{id:true,name:true,timezone:true}});
    if (!farm) return {ok:false,error:'farm'};
    if (farmSettingsVersion(farm)!==input.version) return {ok:false,error:'stale'};
    const result=await prisma.farm.updateMany({where:{id:farm.id,name:farm.name,timezone:farm.timezone},data:{name:input.name}});
    if(result.count!==1)return {ok:false,error:'stale'};
  } catch { return {ok:false,error:'save'}; }
  refreshSettings();return {ok:true};
}
export async function saveArenaSettings(form:FormData):Promise<SettingsResult> {
  const admin = await requireRole('ADMIN');
  let input:ReturnType<typeof parseArenaSettings>;
  try {input=parseArenaSettings(form);} catch {return {ok:false,error:'invalid'};}
  try {
    const farmId=admin.farmId;
    if(!(await prisma.farm.findUnique({where:{id:farmId},select:{id:true}})))return {ok:false,error:'farm'};
    const arena=await prisma.arena.findFirst({where:{id:input.id,farmId}});
    if(!arena||arenaSettingsVersion(arena)!==input.version)return {ok:false,error:'stale'};
    const result=await prisma.arena.updateMany({where:{id:arena.id,farmId,nameHe:arena.nameHe,nameAr:arena.nameAr,isActive:arena.isActive},data:input.data});
    if(result.count!==1)return {ok:false,error:'stale'};
  }catch{return {ok:false,error:'save'};}
  refreshSettings();return {ok:true};
}
