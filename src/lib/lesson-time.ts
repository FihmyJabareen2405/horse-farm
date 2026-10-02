export function localStamp(date: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
export function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < '2000-01-01' || day > '2100-12-31') return false;
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === day;
}
export function moveDay(day: string, delta: number): string {
  const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate()+delta);return date.toISOString().slice(0,10);
}
export function zonedTime(day: string, time: string, zone: string): Date {
  if (!validDay(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('invalid');
  const target = `${day}T${time}`, nominal = Date.parse(`${target}:00Z`), offsets = new Set<number>();
  for (const hours of [-36,0,36]) {const sample=nominal+hours*3600000;offsets.add(Date.parse(`${localStamp(new Date(sample),zone)}:00Z`)-sample);}
  const matches=[...offsets].map(offset=>new Date(nominal-offset)).filter(date=>localStamp(date,zone)===target);
  // Reject missing and repeated local times during daylight saving transitions.
  if(matches.length!==1)throw new Error('time');return matches[0];
}
