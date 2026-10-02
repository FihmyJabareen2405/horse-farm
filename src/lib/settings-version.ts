import { createHash } from 'node:crypto';
const hash = (values: unknown[]) => createHash('sha256').update(JSON.stringify(values)).digest('hex');
export function farmSettingsVersion(farm: { id:number; name:string; timezone:string }) { return hash([farm.id,farm.name,farm.timezone]); }
export function arenaSettingsVersion(arena: { id:number; farmId:number; nameHe:string; nameAr:string; isActive:boolean }) { return hash([arena.id,arena.farmId,arena.nameHe,arena.nameAr,arena.isActive]); }
