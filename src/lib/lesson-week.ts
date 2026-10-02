import { localStamp, moveDay, validDay } from './lesson-time';
export function weekDates(day: string): string[] {
  if (!validDay(day)) throw new Error('invalid');
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  const start = moveDay(day, -weekday);
  const dates = Array.from({length:7},(_,i)=>moveDay(start,i));
  if (!validDay(start) || !validDay(moveDay(start,7)) || dates[6] > '2100-12-30') throw new Error('invalid');
  return dates;
}
export function lessonTouchesDay(lesson: {startsAt:string;endsAt:string}, day:string, zone:string) {
  const first = localStamp(new Date(lesson.startsAt),zone).slice(0,10);
  const last = localStamp(new Date(new Date(lesson.endsAt).getTime()-1),zone).slice(0,10);
  return first <= day && last >= day;
}
