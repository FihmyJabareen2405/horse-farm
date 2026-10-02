'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseInstructorInput } from '@/lib/instructor-input';

export async function saveInstructor(form: FormData): Promise<{ ok: boolean; error?: 'invalid' | 'save' | 'farm' | 'disabled' }> {
  const admin = await requireRole('ADMIN');
  let parsed: ReturnType<typeof parseInstructorInput>;
  try { parsed = parseInstructorInput(form); } catch { return { ok: false, error: 'invalid' }; }
  try {
    const farm = await prisma.farm.findUnique({ where: { id: admin.farmId }, select: { id: true } });
    if (!farm) return { ok: false, error: 'farm' };
    if (parsed.id !== null) {
      const result = await prisma.instructor.updateMany({ where: { id: parsed.id, farmId: farm.id }, data: parsed.data });
      if (result.count !== 1) return { ok: false, error: 'save' };
    } else {
      await prisma.instructor.create({ data: { ...parsed.data, farmId: farm.id } });
    }
  } catch { return { ok: false, error: 'save' }; }
  revalidatePath('/instructors');
  revalidatePath('/admin');
  return { ok: true };
}
