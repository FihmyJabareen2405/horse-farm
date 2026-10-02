'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseTreatmentInput, treatmentTypes } from '@/lib/treatment-input';
import { treatmentVersion } from '@/lib/treatment-version';
import { localStamp } from '@/lib/lesson-time';
export type TreatmentError = 'invalid' | 'save' | 'farm' | 'disabled' | 'stale' | 'horse';
export async function saveTreatment(form: FormData): Promise<{ ok: true } | { ok: false; error: TreatmentError }> {
  const admin = await requireRole('ADMIN');
  try {
    const farm = await prisma.farm.findUnique({ where: { id: admin.farmId }, select: { id: true, timezone: true } });
    if (!farm) return { ok: false, error: 'farm' };
    let input: ReturnType<typeof parseTreatmentInput>;
    try { input = parseTreatmentInput(form, localStamp(new Date(),farm.timezone).slice(0,10)); }
    catch { return { ok: false, error: 'invalid' }; }
    const outcome = await prisma.$transaction(async tx => {
      const horse = await tx.horse.findFirst({ where: { id: input.data.horseId, farmId: farm.id }, select: { id: true } });
      if (!horse) return 'horse' as const;
      if (input.id !== null) {
        const old = await tx.treatment.findFirst({ where: { id: input.id, horse: { farmId: farm.id } } });
        if (!old || treatmentVersion(old) !== input.version) return 'stale' as const;
        if (!(treatmentTypes as readonly string[]).includes(input.data.type) && input.data.type !== old.type) return 'invalid' as const;
        // Compare every editable value again in the write, so a concurrent edit is not overwritten.
        const result = await tx.treatment.updateMany({ where: { id: old.id, horse: { farmId: farm.id }, horseId: old.horseId, type: old.type, performedAt: old.performedAt, nextDueAt: old.nextDueAt, provider: old.provider, notes: old.notes }, data: input.data });
        if (result.count !== 1) return 'stale' as const;
      } else await tx.treatment.create({ data: input.data });
      return null;
    }, { maxWait: 10000, timeout: 15000 });
    if (outcome) return { ok: false, error: outcome };
  } catch { return { ok: false, error: 'save' }; }
  revalidatePath('/treatments');
  revalidatePath('/horses');
  return { ok: true };
}
