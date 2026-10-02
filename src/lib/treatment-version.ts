import { createHash } from 'node:crypto';
type TreatmentData = { horseId: number; type: string; performedAt: Date; nextDueAt: Date | null; provider: string | null; notes: string | null };
export function treatmentVersion(row: TreatmentData): string {
  return createHash('sha256').update(JSON.stringify([row.horseId,row.type,row.performedAt.toISOString(),row.nextDueAt?.toISOString()??null,row.provider,row.notes])).digest('hex');
}
