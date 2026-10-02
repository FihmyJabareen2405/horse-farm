export const treatmentTypes = ['VACCINATION', 'DEWORMING', 'FARRIER', 'DENTAL', 'VET', 'OTHER'] as const;
export function validTreatmentDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '2100-12-31') return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function parseTreatmentInput(form: FormData, today: string) {
  function text(key: string, max: number) {
    const raw = form.get(key);
    if (raw !== null && typeof raw !== 'string') throw new Error('invalid');
    const value = (raw ?? '').trim();
    if (value.length > max) throw new Error('invalid');
    return value;
  }
  function id(value: string) {
    if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) throw new Error('invalid');
    return Number(value);
  }
  const rawId = text('id', 10), recordId = rawId ? id(rawId) : null;
  const version = text('version', 64);
  if (recordId && !/^[a-f0-9]{64}$/.test(version)) throw new Error('invalid');
  const horseId = id(text('horseId', 10)), type = text('type', 80);
  // Existing custom types can be preserved when editing; new records use the listed types.
  if (!type || (recordId === null && !(treatmentTypes as readonly string[]).includes(type))) throw new Error('invalid');
  const performed = text('performedAt', 10), next = text('nextDueAt', 10);
  if (!validTreatmentDate(performed) || performed > today || (next && (!validTreatmentDate(next) || next < performed))) throw new Error('invalid');
  return { id: recordId, version, data: { horseId, type, performedAt: new Date(`${performed}T00:00:00Z`), nextDueAt: next ? new Date(`${next}T00:00:00Z`) : null, provider: text('provider', 100) || null, notes: text('notes', 2000) || null } };
}
