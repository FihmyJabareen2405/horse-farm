export function parseInstructorInput(form: FormData) {
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
  const phone = text('phone', 30);
  const digits = phone.replace(/\D/g, '');
  if (phone && (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15)) throw new Error('invalid');
  return { id, data: { name, phone: phone || null, isActive: form.get('isActive') === 'on' } };
}
