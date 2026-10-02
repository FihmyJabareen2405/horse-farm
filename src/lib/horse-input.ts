export function parseHorseInput(form: FormData) {
  const text = (key: string, max: number) => {
    const raw = form.get(key);
    if (raw !== null && typeof raw !== 'string') throw new Error('invalid');
    const value = (raw ?? '').trim();
    if (value.length > max) throw new Error('invalid');
    return value;
  };
  const name = text('name', 100);
  if (!name) throw new Error('invalid');
  const rawId = text('id', 16);
  const id = rawId ? Number(rawId) : null;
  if (id !== null && (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1)) throw new Error('invalid');
  const date = text('birthDate', 10);
  let birthDate: Date | null = null;
  if (date) {
    birthDate = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(birthDate.getTime()) || birthDate.toISOString().slice(0,10) !== date || birthDate > new Date()) throw new Error('invalid');
  }
  const gender = text('gender', 20);
  if (!['', 'MARE', 'STALLION', 'GELDING'].includes(gender)) throw new Error('invalid');
  return { id, data: { name, birthDate, breed: text('breed',100) || null, color: text('color',100) || null, gender: gender || null, notes: text('notes',2000) || null, isActive: form.get('isActive') === 'on' } };
}
