'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveHorse } from '@/app/horses/actions';

type Horse = { id: number; name: string; birthDate: string; breed: string | null; color: string | null; gender: string | null; notes: string | null; isActive: boolean };
const words = {
  he: { title:'הסוסים בחווה', back:'לוח הניהול', add:'הוספת סוס', edit:'עריכה', name:'שם הסוס', birthDate:'תאריך לידה', breed:'גזע', color:'צבע', gender:'מין', notes:'הערות', active:'פעיל', inactive:'לא פעיל', saveButton:'שמירה', saving:'שומר…', cancel:'ביטול', search:'חיפוש לפי שם או גזע', empty:'עדיין אין סוסים בחווה. הוסף את הסוס הראשון.', noResults:'לא נמצאו סוסים מתאימים.', all:'כל הסוסים', unknown:'לא צוין', MARE:'נקבה', STALLION:'זכר', GELDING:'מסורס', success:'פרטי הסוס נשמרו בהצלחה.', invalid:'בדוק את השדות: נדרש שם, ותאריך הלידה חייב להיות תקין ולא עתידי.', save:'לא ניתן לטעון או לשמור נתונים כרגע. בדוק את החיבור ונסה שוב.', farm:'נדרשת חווה אחת מוגדרת במערכת.', disabled:'הפעולה זמינה כרגע במצב פיתוח בלבד.', refresh:'רענון', count:'סוסים', hint:'סימון כלא פעיל שומר את הסוס ואת ההיסטוריה שלו.' },
  ar: { title:'خيول المزرعة', back:'لوحة الإدارة', add:'إضافة حصان', edit:'تعديل', name:'اسم الحصان', birthDate:'تاريخ الميلاد', breed:'السلالة', color:'اللون', gender:'الجنس', notes:'ملاحظات', active:'نشط', inactive:'غير نشط', saveButton:'حفظ', saving:'جارٍ الحفظ…', cancel:'إلغاء', search:'البحث بالاسم أو السلالة', empty:'لا توجد خيول بعد. أضف الحصان الأول.', noResults:'لا توجد خيول مطابقة.', all:'جميع الخيول', unknown:'غير محدد', MARE:'أنثى', STALLION:'ذكر', GELDING:'مخصي', success:'تم حفظ بيانات الحصان بنجاح.', invalid:'تحقق من الحقول: الاسم مطلوب وتاريخ الميلاد يجب أن يكون صحيحاً وغير مستقبلي.', save:'تعذّر تحميل البيانات أو حفظها. تحقق من الاتصال وحاول مجدداً.', farm:'يجب إعداد مزرعة واحدة في النظام.', disabled:'هذه العملية متاحة حالياً في وضع التطوير فقط.', refresh:'تحديث', count:'خيول', hint:'إلغاء حالة النشاط يحتفظ بالحصان وسجله.' },
};
export function HorseManager({ horses, issue }: { horses: Horse[]; issue?: 'farm' | 'save' }) {
  const [lang,setLang] = useState<'he'|'ar'>('he');
  const [editing,setEditing] = useState<Horse | null | undefined>(undefined);
  const [busy,setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message,setMessage] = useState<keyof typeof words.he | null>(null);
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('all');
  const formRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t=words[lang];
  const inputClass='mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base';
  function open(horse: Horse | null) {setEditing(horse);setMessage(null);setTimeout(()=>{formRef.current?.scrollIntoView({behavior:'smooth',block:'start'});formRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus({preventScroll:true});},0);}
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busyRef.current) return;
    const form = new FormData(event.currentTarget);
    busyRef.current=true;setBusy(true);setMessage(null);
    try {const result=await saveHorse(form);if(result.ok){setEditing(undefined);setMessage('success');router.refresh();}else{setMessage(result.error ?? 'save');}}
    catch {setMessage('save');} finally {busyRef.current=false;setBusy(false);}
  }
  const visible=horses.filter(h=>(`${h.name} ${h.breed??''}`).toLowerCase().includes(query.trim().toLowerCase()) && (filter==='all'||h.isActive===(filter==='active')));
  return <main dir="rtl" lang={lang} className="min-h-screen bg-[#f5f3ee] px-5 py-8 text-[#243c32]">
    <div className="mx-auto max-w-6xl">
      <nav className="mb-8 flex items-center justify-between gap-4"><Link href="/admin" className="underline underline-offset-4">{t.back}</Link><button type="button" onClick={()=>setLang(lang==='he'?'ar':'he')} lang={lang==='he'?'ar':'he'} className="rounded-xl border border-stone-300 bg-white px-4 py-2">{lang==='he'?'العربية':'עברית'}</button></nav>
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-[#243c32] p-7 text-white"><div><h1 className="text-3xl font-bold">{t.title}</h1>{!issue&&<p className="mt-3 text-white/75">{horses.length} {t.count}</p>}</div><button type="button" disabled={!!issue||busy} onClick={()=>open(null)} className="rounded-xl bg-[#d8bf8b] px-6 py-3 font-bold text-[#243c32] disabled:opacity-50">+ {t.add}</button></header>
      {issue && <div role="alert" className="mt-6 rounded-xl bg-amber-50 p-5">{t[issue]} <button type="button" onClick={()=>router.refresh()} className="underline">{t.refresh}</button></div>}
      {message && <p role="status" className={`mt-5 rounded-xl p-4 ${message==='success'?'bg-emerald-100':'bg-amber-100'}`}>{t[message]}</p>}
      {editing!==undefined && <div ref={formRef} className="mt-6 scroll-mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-5 text-xl font-bold">{editing?t.edit:t.add}</h2>
        <form key={editing?.id??'new'} onSubmit={submit}>
          <input type="hidden" name="id" value={editing?.id??''}/>
          <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
            <label>{t.name} *<input name="name" required maxLength={100} defaultValue={editing?.name??''} className={inputClass}/></label>
            <label>{t.birthDate}<input name="birthDate" type="date" defaultValue={editing?.birthDate??''} className={inputClass}/></label>
            <label>{t.breed}<input name="breed" maxLength={100} defaultValue={editing?.breed??''} className={inputClass}/></label>
            <label>{t.color}<input name="color" maxLength={100} defaultValue={editing?.color??''} className={inputClass}/></label>
            <label>{t.gender}<select name="gender" defaultValue={editing?.gender??''} className={inputClass}><option value="">{t.unknown}</option><option value="MARE">{t.MARE}</option><option value="STALLION">{t.STALLION}</option><option value="GELDING">{t.GELDING}</option></select></label>
            <label className="flex items-center gap-3"><input type="checkbox" name="isActive" defaultChecked={editing?.isActive??true} className="h-5 w-5"/>{t.active}</label>
            <label className="sm:col-span-2">{t.notes}<textarea name="notes" rows={3} maxLength={2000} defaultValue={editing?.notes??''} className={inputClass}/></label>
            <p className="text-sm text-stone-500 sm:col-span-2">{t.hint}</p>
            <div className="flex gap-3 sm:col-span-2"><button type="submit" className="rounded-xl bg-[#243c32] px-6 py-3 text-white">{busy?t.saving:t.saveButton}</button><button type="button" onClick={()=>{setEditing(undefined);setMessage(null);}} className="rounded-xl border border-stone-300 px-6 py-3">{t.cancel}</button></div>
          </fieldset>
        </form>
      </div>}
      {!issue&&<>
        <div className="my-6 grid gap-3 sm:grid-cols-[1fr_auto]"><input aria-label={t.search} placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)} className={inputClass}/><select aria-label={t.all} value={filter} onChange={e=>setFilter(e.target.value)} className={inputClass}><option value="all">{t.all}</option><option value="active">{t.active}</option><option value="inactive">{t.inactive}</option></select></div>
        <section aria-label={t.title} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(h=><article key={h.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-6"><div className="flex items-start justify-between gap-3"><h2 className="break-words text-xl font-bold">{h.name}</h2><span className={`shrink-0 rounded-full px-3 py-1 text-xs ${h.isActive?'bg-emerald-50 text-emerald-800':'bg-stone-100 text-stone-600'}`}>{h.isActive?t.active:t.inactive}</span></div><dl className="mt-5 space-y-2 text-sm"><div><dt className="inline text-stone-500">{t.breed}: </dt><dd className="inline">{h.breed||t.unknown}</dd></div><div><dt className="inline text-stone-500">{t.color}: </dt><dd className="inline">{h.color||t.unknown}</dd></div><div><dt className="inline text-stone-500">{t.birthDate}: </dt><dd className="inline" dir="ltr">{h.birthDate||'—'}</dd></div></dl>{h.notes&&<p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-stone-600">{h.notes}</p>}<button type="button" disabled={busy} onClick={()=>open(h)} className="mt-5 rounded-xl border border-stone-300 px-5 py-2 text-sm">{t.edit}</button></article>)}
        </section>
        {visible.length===0&&<p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-600">{horses.length===0?t.empty:t.noResults}</p>}
      </>}
    </div>
  </main>;
}
