'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseRiderInput } from '@/lib/rider-input';

export async function saveRider(form: FormData): Promise<{ ok: boolean; error?: 'invalid' | 'save' | 'farm' | 'disabled' }> {
  const admin = await requireRole('ADMIN');
  let parsed: ReturnType<typeof parseRiderInput>;
  try { parsed = parseRiderInput(form); } catch { return { ok: false, error: 'invalid' }; }
  try {
    const farm = await prisma.farm.findUnique({ where: { id: admin.farmId }, select: { id: true } });
    if (!farm) return { ok: false, error: 'farm' };
    if (parsed.id !== null) {
      const result = await prisma.rider.updateMany({ where: { id: parsed.id, farmId: farm.id }, data: parsed.data });
      if (result.count !== 1) return { ok: false, error: 'save' };
    } else {
      await prisma.rider.create({ data: { ...parsed.data, farmId: farm.id } });
    }
  } catch { return { ok: false, error: 'save' }; }
  revalidatePath('/riders');
  revalidatePath('/admin');
  return { ok: true };
}
