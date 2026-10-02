function text(form: FormData, key: string, max: number) {
  const raw = form.get(key);
  if (typeof raw !== 'string') throw new Error('invalid');
  const value = raw.trim();
  if (!value || value.length > max) throw new Error('invalid');
  return value;
}
function version(form: FormData) {
  const value = text(form, 'version', 64);
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error('invalid');
  return value;
}
export function parseFarmSettings(form: FormData) {
  return { name: text(form,'name',100), version: version(form) };
}
export function parseArenaSettings(form: FormData) {
  const rawId = text(form,'id',10);
  if (!/^[1-9]\d*$/.test(rawId) || Number(rawId) > 2147483647) throw new Error('invalid');
  const active = form.get('isActive');
  if (active !== null && active !== 'on') throw new Error('invalid');
  return { id: Number(rawId), version: version(form), data: { nameHe: text(form,'nameHe',100), nameAr: text(form,'nameAr',100), isActive: active === 'on' } };
}
