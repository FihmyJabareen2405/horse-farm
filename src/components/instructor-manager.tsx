'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveInstructor } from '@/app/instructors/actions';

type Instructor = { id: number; name: string; phone: string | null; isActive: boolean };
const words = {
  he: { title:'המדריכים בחווה', back:'לוח הניהול', add:'הוספת מדריך', edit:'עריכה', name:'שם המדריך', phone:'טלפון', active:'פעיל', inactive:'לא פעיל', saveButton:'שמירה', saving:'שומר…', cancel:'ביטול', search:'חיפוש לפי שם או טלפון', empty:'עדיין אין מדריכים בחווה. הוסף את המדריך הראשון.', noResults:'לא נמצאו מדריכים מתאימים.', all:'כל המדריכים', unknown:'לא צוין', success:'פרטי המדריך נשמרו בהצלחה.', invalid:'בדוק את השדות: נדרש שם. טלפון, אם הוזן, חייב להכיל 7–15 ספרות.', save:'לא ניתן לטעון או לשמור נתונים כרגע. בדוק את החיבור ונסה שוב.', farm:'נדרשת חווה אחת מוגדרת במערכת.', disabled:'הפעולה זמינה כרגע במצב פיתוח בלבד.', refresh:'רענון', count:'מדריכים', hint:'סימון כלא פעיל שומר את המדריך ואת ההיסטוריה שלו.' },
  ar: { title:'مدربو المزرعة', back:'لوحة الإدارة', add:'إضافة مدرب', edit:'تعديل', name:'اسم المدرب', phone:'رقم الهاتف', active:'نشط', inactive:'غير نشط', saveButton:'حفظ', saving:'جارٍ الحفظ…', cancel:'إلغاء', search:'البحث بالاسم أو رقم الهاتف', empty:'لا يوجد مدربون بعد. أضف المدرب الأول.', noResults:'لا يوجد مدربون مطابقون.', all:'جميع المدربين', unknown:'غير محدد', success:'تم حفظ بيانات المدرب بنجاح.', invalid:'تحقق من الحقول: الاسم مطلوب. رقم الهاتف اختياري ويجب أن يحتوي على 7–15 رقماً.', save:'تعذّر تحميل البيانات أو حفظها. تحقق من الاتصال وحاول مجدداً.', farm:'يجب إعداد مزرعة واحدة في النظام.', disabled:'هذه العملية متاحة حالياً في وضع التطوير فقط.', refresh:'تحديث', count:'مدربون', hint:'إلغاء حالة النشاط يحتفظ بالمدرب وسجله.' },
};
export function InstructorManager({ instructors, issue }: { instructors: Instructor[]; issue?: 'farm' | 'save' }) {
  const [lang,setLang] = useState<'he'|'ar'>('he');
  const [editing,setEditing] = useState<Instructor | null | undefined>(undefined);
  const [busy,setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message,setMessage] = useState<keyof typeof words.he | null>(null);
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('all');
  const formRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t=words[lang];
  const inputClass='mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base';
  function open(instructor: Instructor | null) {setEditing(instructor);setMessage(null);setTimeout(()=>{formRef.current?.scrollIntoView({behavior:'smooth',block:'start'});formRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus({preventScroll:true});},0);}
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busyRef.current) return;
    const form = new FormData(event.currentTarget);
    busyRef.current=true;setBusy(true);setMessage(null);
    try {const result=await saveInstructor(form);if(result.ok){setEditing(undefined);setMessage('success');router.refresh();}else{setMessage(result.error ?? 'save');}}
    catch {setMessage('save');} finally {busyRef.current=false;setBusy(false);}
  }
  const visible=instructors.filter(h=>(`${h.name} ${h.phone??''}`).toLowerCase().includes(query.trim().toLowerCase()) && (filter==='all'||h.isActive===(filter==='active')));
  return <main dir="rtl" lang={lang} className="min-h-screen bg-[#f5f3ee] px-5 py-8 text-[#243c32]">
    <div className="mx-auto max-w-6xl">
      <nav className="mb-8 flex items-center justify-between gap-4"><Link href="/admin" className="underline underline-offset-4">{t.back}</Link><button type="button" onClick={()=>setLang(lang==='he'?'ar':'he')} lang={lang==='he'?'ar':'he'} className="rounded-xl border border-stone-300 bg-white px-4 py-2">{lang==='he'?'العربية':'עברית'}</button></nav>
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-[#243c32] p-7 text-white"><div><h1 className="text-3xl font-bold">{t.title}</h1>{!issue&&<p className="mt-3 text-white/75">{instructors.length} {t.count}</p>}</div><button type="button" disabled={!!issue||busy} onClick={()=>open(null)} className="rounded-xl bg-[#d8bf8b] px-6 py-3 font-bold text-[#243c32] disabled:opacity-50">+ {t.add}</button></header>
      {issue && <div role="alert" className="mt-6 rounded-xl bg-amber-50 p-5">{t[issue]} <button type="button" onClick={()=>router.refresh()} className="underline">{t.refresh}</button></div>}
      {message && <p role="status" className={`mt-5 rounded-xl p-4 ${message==='success'?'bg-emerald-100':'bg-amber-100'}`}>{t[message]}</p>}
      {editing!==undefined && <div ref={formRef} className="mt-6 scroll-mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-5 text-xl font-bold">{editing?t.edit:t.add}</h2>
        <form key={editing?.id??'new'} onSubmit={submit}>
          <input type="hidden" name="id" value={editing?.id??''}/>
          <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
            <label>{t.name} *<input name="name" required maxLength={100} defaultValue={editing?.name??''} className={inputClass}/></label>
            <label>{t.phone}<input name="phone" type="tel" dir="ltr" maxLength={30} defaultValue={editing?.phone??''} className={inputClass}/></label>
            <label className="flex items-center gap-3"><input type="checkbox" name="isActive" defaultChecked={editing?.isActive??true} className="h-5 w-5"/>{t.active}</label>
            <p className="text-sm text-stone-500 sm:col-span-2">{t.hint}</p>
            <div className="flex gap-3 sm:col-span-2"><button type="submit" className="rounded-xl bg-[#243c32] px-6 py-3 text-white">{busy?t.saving:t.saveButton}</button><button type="button" onClick={()=>{setEditing(undefined);setMessage(null);}} className="rounded-xl border border-stone-300 px-6 py-3">{t.cancel}</button></div>
          </fieldset>
        </form>
      </div>}
      {!issue&&<>
        <div className="my-6 grid gap-3 sm:grid-cols-[1fr_auto]"><input aria-label={t.search} placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)} className={inputClass}/><select aria-label={t.all} value={filter} onChange={e=>setFilter(e.target.value)} className={inputClass}><option value="all">{t.all}</option><option value="active">{t.active}</option><option value="inactive">{t.inactive}</option></select></div>
        <section aria-label={t.title} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(h=><article key={h.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-6"><div className="flex items-start justify-between gap-3"><h2 className="break-words text-xl font-bold">{h.name}</h2><span className={`shrink-0 rounded-full px-3 py-1 text-xs ${h.isActive?'bg-emerald-50 text-emerald-800':'bg-stone-100 text-stone-600'}`}>{h.isActive?t.active:t.inactive}</span></div><dl className="mt-5 space-y-2 text-sm"><div><dt className="inline text-stone-500">{t.phone}: </dt><dd className="inline" dir="ltr">{h.phone||'—'}</dd></div></dl><button type="button" disabled={busy} onClick={()=>open(h)} className="mt-5 rounded-xl border border-stone-300 px-5 py-2 text-sm">{t.edit}</button></article>)}
        </section>
        {visible.length===0&&<p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-600">{instructors.length===0?t.empty:t.noResults}</p>}
      </>}
    </div>
  </main>;
}
