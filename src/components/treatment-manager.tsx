'use client';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveTreatment } from '@/app/treatments/actions';
import type { TreatmentError } from '@/app/treatments/actions';
import { treatmentTypes } from '@/lib/treatment-input';
import { moveDay } from '@/lib/lesson-time';

type Horse = { id:number; name:string; isActive:boolean };
type Treatment = { id:number; horseId:number; horseName:string; type:string; performedAt:string; nextDueAt:string|null; provider:string|null; notes:string|null; version:string };
const copy = {
  he: {
    title:'טיפולים ומעקב לסוסים', intro:'היסטוריית טיפולים ומועדי מעקב לכל סוס', back:'לוח הניהול', add:'רישום טיפול', edit:'עריכת טיפול', horse:'סוס', type:'סוג הטיפול', performed:'תאריך ביצוע', next:'מועד הטיפול הבא', provider:'שם המטפל / המרפאה', notes:'הערות', choose:'בחרו…', saveButton:'שמירת הטיפול', saving:'שומר…', close:'סגירה', inactive:'לא פעיל', refresh:'רענון', search:'חיפוש לפי סוס, מטפל או הערות', allHorses:'כל הסוסים', all:'כל הרשומות', overdue:'מועד המעקב עבר', today:'מעקב להיום', soon:'מעקב ב־7 הימים הבאים', later:'מעקב עתידי', none:'ללא מועד מעקב', empty:'אין טיפולים להצגה.', missing:'הוסף סוס לפני רישום טיפול.', horses:'ניהול סוסים', total:'טיפולים רשומים', optional:'אופציונלי', hint:'רשום כאן טיפול שכבר בוצע. מועד הטיפול הבא הוא תזכורת במסך זה בלבד; לאחר השלמת המעקב, אפשר להסיר את התאריך בעריכת הרשומה ולרשום את הטיפול החדש בנפרד.', success:'הטיפול נשמר בהצלחה.', invalid:'בדוק את השדות: סוס, סוג ותאריך ביצוע נדרשים. תאריך הביצוע לא יכול להיות בעתיד, ומועד המעקב לא יכול להיות לפניו.', save:'לא הצלחנו לטעון או לשמור את הנתונים. בדוק את החיבור ונסה שוב.', farm:'נדרשת חווה אחת מוגדרת במערכת.', disabled:'הפעולה זמינה במצב פיתוח בלבד.', stale:'הרשומה השתנתה מאז שפתחת אותה. סגור את הטופס, רענן ופתח מחדש.', horseError:'הסוס שנבחר לא נמצא בחווה. רענן ובחר שוב.', removeDue:'להסרת התזכורת, נקה את שדה מועד הטיפול הבא ושמור.',
    VACCINATION:'חיסון', DEWORMING:'תילוע', FARRIER:'פרזול / טיפול בפרסות', DENTAL:'טיפול שיניים', VET:'בדיקה / טיפול וטרינרי', OTHER:'אחר',
  },
  ar: {
    title:'علاجات الخيول والمتابعة', intro:'سجل العلاجات ومواعيد المتابعة لكل حصان', back:'لوحة الإدارة', add:'تسجيل علاج', edit:'تعديل العلاج', horse:'الحصان', type:'نوع العلاج', performed:'تاريخ إجراء العلاج', next:'موعد العلاج القادم', provider:'اسم المعالج / العيادة', notes:'ملاحظات', choose:'اختر…', saveButton:'حفظ العلاج', saving:'جارٍ الحفظ…', close:'إغلاق', inactive:'غير نشط', refresh:'تحديث', search:'البحث بالحصان أو المعالج أو الملاحظات', allHorses:'جميع الخيول', all:'جميع السجلات', overdue:'موعد المتابعة فات', today:'متابعة اليوم', soon:'متابعة خلال الأيام الـ7 القادمة', later:'متابعة مستقبلية', none:'دون موعد متابعة', empty:'لا توجد علاجات للعرض.', missing:'أضف حصاناً قبل تسجيل العلاج.', horses:'إدارة الخيول', total:'علاجات مسجلة', optional:'اختياري', hint:'سجّل هنا علاجاً تم إجراؤه. موعد العلاج القادم تذكير في هذه الشاشة فقط؛ بعد إتمام المتابعة يمكنك إزالة التاريخ من السجل وتسجيل العلاج الجديد بشكل منفصل.', success:'تم حفظ العلاج بنجاح.', invalid:'تحقق من الحقول: الحصان والنوع وتاريخ العلاج مطلوبة. لا يمكن أن يكون تاريخ العلاج في المستقبل أو موعد المتابعة قبله.', save:'تعذّر تحميل البيانات أو حفظها. تحقق من الاتصال وحاول مجدداً.', farm:'يجب إعداد مزرعة واحدة في النظام.', disabled:'هذه العملية متاحة في وضع التطوير فقط.', stale:'تم تغيير السجل بعد فتحه. أغلق النموذج وحدّث الصفحة ثم افتحه مجدداً.', horseError:'الحصان المحدد غير موجود في المزرعة. حدّث الصفحة واختر مجدداً.', removeDue:'لإزالة التذكير، امسح حقل موعد العلاج القادم واحفظ.',
    VACCINATION:'تطعيم', DEWORMING:'علاج الديدان', FARRIER:'حدوة / العناية بالحوافر', DENTAL:'علاج الأسنان', VET:'فحص / علاج بيطري', OTHER:'آخر',
  },
};
export function TreatmentManager({horses,treatments,today,issue}:{horses:Horse[];treatments:Treatment[];today:string;issue?:'farm'|'save'}) {
  const [lang,setLang]=useState<'he'|'ar'>('he');
  const [editing,setEditing]=useState<Treatment|null|undefined>(undefined);
  const [message,setMessage]=useState<TreatmentError|'success'|null>(null);
  const [busy,setBusy]=useState(false),[pending,startTransition]=useTransition();
  const [search,setSearch]=useState(''),[horseFilter,setHorseFilter]=useState('all'),[dueFilter,setDueFilter]=useState('all');
  const formRef=useRef<HTMLDivElement>(null),noticeRef=useRef<HTMLParagraphElement>(null),busyRef=useRef(false);
  const router=useRouter(),t=copy[lang],locked=busy||pending,week=moveDay(today,7);
  const field='mt-2 w-full min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-3 text-base';
  const button='rounded-xl border border-stone-300 bg-white px-4 py-2 disabled:opacity-50';
  function typeName(type:string){return (treatmentTypes as readonly string[]).includes(type)?t[type as typeof treatmentTypes[number]]:type;}
  function due(row:Treatment){return !row.nextDueAt?'none':row.nextDueAt<today?'overdue':row.nextDueAt===today?'today':row.nextDueAt<=week?'soon':'later';}
  function date(value:string){return new Intl.DateTimeFormat(lang==='he'?'he-IL':'ar',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${value}T00:00:00Z`));}
  function open(row:Treatment|null){setEditing(row);setMessage(null);setTimeout(()=>{formRef.current?.scrollIntoView({behavior:'smooth',block:'start'});formRef.current?.querySelector<HTMLSelectElement>('select')?.focus({preventScroll:true});},0);}
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(busyRef.current)return;const data=new FormData(event.currentTarget);busyRef.current=true;setBusy(true);setMessage(null);
    try{const result=await saveTreatment(data);if(result.ok){setEditing(undefined);setMessage('success');startTransition(()=>router.refresh());}else setMessage(result.error);}
    catch{setMessage('save');}finally{busyRef.current=false;setBusy(false);setTimeout(()=>noticeRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'}),0);}
  }
  const visible=treatments.filter(row=>(horseFilter==='all'||String(row.horseId)===horseFilter)&&(dueFilter==='all'||due(row)===dueFilter)&&`${row.horseName} ${typeName(row.type)} ${row.provider??''} ${row.notes??''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const stats=[{key:'all',label:t.total,count:treatments.length},{key:'overdue',label:t.overdue,count:treatments.filter(r=>due(r)==='overdue').length},{key:'today',label:t.today,count:treatments.filter(r=>due(r)==='today').length},{key:'soon',label:t.soon,count:treatments.filter(r=>due(r)==='soon').length}];
  return <main dir="rtl" lang={lang} className="min-h-screen bg-[#f5f3ee] px-4 py-8 text-[#243c32] sm:px-5"><div className="mx-auto max-w-6xl">
    <nav className="mb-8 flex items-center justify-between gap-4"><Link href="/admin" className="underline underline-offset-4">{t.back}</Link><button type="button" className={button} lang={lang==='he'?'ar':'he'} onClick={()=>setLang(lang==='he'?'ar':'he')}>{lang==='he'?'العربية':'עברית'}</button></nav>
    <header className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-[#243c32] p-7 text-white"><div><h1 className="text-3xl font-bold">{t.title}</h1><p className="mt-3 text-sm text-white/75">{t.intro}</p></div><button type="button" disabled={!!issue||!horses.length||locked||editing!==undefined} onClick={()=>open(null)} className="rounded-xl bg-[#d8bf8b] px-6 py-3 font-bold text-[#243c32] disabled:opacity-50">+ {t.add}</button></header>
    {issue&&<p role="alert" className="mt-5 rounded-xl bg-amber-100 p-5">{t[issue]} <button type="button" className="underline" onClick={()=>startTransition(()=>router.refresh())}>{t.refresh}</button></p>}
    {!issue&&!horses.length&&<p className="mt-5 rounded-xl bg-amber-50 p-5">{t.missing} <Link href="/horses" className="underline">{t.horses}</Link></p>}
    {message&&<p ref={noticeRef} role={message==='success'?'status':'alert'} className={`mt-5 rounded-xl p-5 ${message==='success'?'bg-emerald-100':'bg-amber-100'}`}>{message==='horse'?t.horseError:t[message]}</p>}
    {editing!==undefined&&<div ref={formRef} className="mt-6 scroll-mt-5 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7"><h2 className="mb-5 text-xl font-bold">{editing?t.edit:t.add}</h2>
      <form key={editing?.id??'new'} onSubmit={submit}><input type="hidden" name="id" value={editing?.id??''}/><input type="hidden" name="version" value={editing?.version??''}/><fieldset disabled={locked} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <label>{t.horse} *<select name="horseId" required defaultValue={editing?.horseId??(horseFilter==='all'?'':horseFilter)} className={field}><option value="">{t.choose}</option>{horses.map(h=><option key={h.id} value={h.id}>{h.name}{!h.isActive?` (${t.inactive})`:''}</option>)}</select></label>
        <label>{t.type} *<select name="type" required defaultValue={editing?.type??''} className={field}><option value="">{t.choose}</option>{treatmentTypes.map(type=><option key={type} value={type}>{t[type]}</option>)}{editing&&!(treatmentTypes as readonly string[]).includes(editing.type)&&<option value={editing.type}>{editing.type}</option>}</select></label>
        <label>{t.performed} *<input name="performedAt" type="date" required min="1900-01-01" max={today} defaultValue={editing?.performedAt??today} className={field}/></label>
        <label>{t.next} ({t.optional})<input name="nextDueAt" type="date" min="1900-01-01" max="2100-12-31" defaultValue={editing?.nextDueAt??''} className={field}/></label>
        <label className="sm:col-span-2">{t.provider}<input name="provider" maxLength={100} defaultValue={editing?.provider??''} className={field}/></label>
        <label className="sm:col-span-2">{t.notes}<textarea name="notes" rows={3} maxLength={2000} defaultValue={editing?.notes??''} className={field}/></label>
        <p className="text-sm leading-7 text-stone-500 sm:col-span-2">{t.hint}</p>
        <div className="flex flex-wrap gap-3 sm:col-span-2"><button type="submit" className="rounded-xl bg-[#243c32] px-6 py-3 text-white">{busy?t.saving:t.saveButton}</button><button type="button" className={button} onClick={()=>{setEditing(undefined);setMessage(null);}}>{t.close}</button></div>
      </fieldset></form>
    </div>}
    {!issue&&<>
      <section aria-label={t.intro} className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(stat=><button type="button" key={stat.key} onClick={()=>{setDueFilter(stat.key);setHorseFilter('all');setSearch('');}} aria-pressed={dueFilter===stat.key} className={`rounded-2xl border bg-white p-5 text-start ${dueFilter===stat.key?'border-[#243c32]':'border-stone-200'}`}><span className="block text-sm text-stone-600">{stat.label}</span><span className="mt-3 block text-3xl font-bold">{stat.count}</span></button>)}</section>
      <div className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]"><input aria-label={t.search} placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)} className={field}/><select aria-label={t.allHorses} value={horseFilter} onChange={e=>setHorseFilter(e.target.value)} className={field}><option value="all">{t.allHorses}</option>{horses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select><select aria-label={t.all} value={dueFilter} onChange={e=>setDueFilter(e.target.value)} className={field}><option value="all">{t.all}</option>{(['overdue','today','soon','later','none'] as const).map(key=><option key={key} value={key}>{t[key]}</option>)}</select><button type="button" disabled={locked} onClick={()=>startTransition(()=>router.refresh())} className={`${button} mt-2`}>{t.refresh}</button></div>
      <section aria-label={t.title} aria-busy={locked} className="grid gap-4 md:grid-cols-2">{visible.map(row=><article key={row.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="break-words text-xl font-bold">{row.horseName}</h2><p className="mt-2 break-words text-sm">{typeName(row.type)}</p></div><span className={`rounded-full px-3 py-1 text-xs ${due(row)==='overdue'?'bg-red-50 text-red-800':due(row)==='today'?'bg-amber-50 text-amber-800':'bg-stone-100 text-stone-600'}`}>{t[due(row)]}</span></div>
        <dl className="mt-5 space-y-2 text-sm"><div><dt className="inline text-stone-500">{t.performed}: </dt><dd className="inline"><bdi>{date(row.performedAt)}</bdi></dd></div>{row.nextDueAt&&<div><dt className="inline text-stone-500">{t.next}: </dt><dd className="inline"><bdi>{date(row.nextDueAt)}</bdi></dd></div>}{row.provider&&<div className="break-words"><dt className="inline text-stone-500">{t.provider}: </dt><dd className="inline">{row.provider}</dd></div>}</dl>
        {row.notes&&<p className="mt-4 whitespace-pre-wrap break-words text-sm text-stone-600">{row.notes}</p>}<button type="button" disabled={locked||editing!==undefined} onClick={()=>open(row)} className={`${button} mt-5`}>{t.edit}</button>
      </article>)}</section>{!visible.length&&<p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-600">{t.empty}</p>}
    </>}
  </div></main>;
}
