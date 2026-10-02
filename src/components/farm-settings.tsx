'use client';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveFarmSettings, saveArenaSettings } from '@/app/settings/actions';
import type { SettingsError, SettingsResult } from '@/app/settings/actions';
type Farm={name:string;timezone:string;version:string};
type Arena={id:number;code:string;nameHe:string;nameAr:string;isActive:boolean;scheduled:number;version:string};
const copy={
  he:{title:'הגדרות החווה',intro:'פרטי החווה והמגרשים',back:'לוח הניהול',farmDetails:'פרטי החווה',name:'שם החווה',timezone:'אזור זמן',duration:'משך שיעור',minutes:'30 דקות',saveFarm:'שמירת שם החווה',arenas:'המגרשים בחווה',nameHe:'שם בעברית',nameAr:'שם בערבית',active:'פעיל לשיבוץ שיעורים',activeBadge:'פעיל',inactiveBadge:'לא פעיל',saveArena:'שמירת המגרש',saving:'שומר…',success:'השינויים נשמרו בהצלחה.',invalid:'יש למלא שם חווה או את שני שמות המגרש, עד 100 תווים בכל שדה.',save:'לא הצלחנו לטעון או לשמור נתונים. בדוק את החיבור ונסה שוב.',farm:'נדרשת חווה אחת מוגדרת במערכת.',disabled:'הפעולה זמינה במצב פיתוח בלבד.',stale:'הנתונים השתנו מאז פתיחת הדף. רענן לפני עריכה נוספת.',refresh:'רענון',arenaHint:'מגרש לא פעיל לא יהיה זמין לשיבוצים חדשים. שיעורים שכבר נקבעו בו יישארו ביומן; ניתן לערוך או לבטל אותם דרך היומן.',scheduled:'שיעורים מתוכננים שטרם הסתיימו',calendar:'פתיחת היומן',empty:'עדיין לא הוגדרו מגרשים.',nameHint:'שם זה מופיע בלוח הניהול בשתי השפות.',code:'קוד',fixed:'משך השיעור ואזור הזמן מוצגים לעיון בלבד בשלב זה.'},
  ar:{title:'إعدادات المزرعة',intro:'بيانات المزرعة والميادين',back:'لوحة الإدارة',farmDetails:'بيانات المزرعة',name:'اسم المزرعة',timezone:'المنطقة الزمنية',duration:'مدة الدرس',minutes:'30 دقيقة',saveFarm:'حفظ اسم المزرعة',arenas:'ميادين المزرعة',nameHe:'الاسم بالعبرية',nameAr:'الاسم بالعربية',active:'متاح لجدولة الدروس',activeBadge:'نشط',inactiveBadge:'غير نشط',saveArena:'حفظ الميدان',saving:'جارٍ الحفظ…',success:'تم حفظ التغييرات بنجاح.',invalid:'أدخل اسم المزرعة أو اسمي الميدان، بحد أقصى 100 حرف لكل حقل.',save:'تعذّر تحميل البيانات أو حفظها. تحقق من الاتصال وحاول مجدداً.',farm:'يجب إعداد مزرعة واحدة في النظام.',disabled:'هذه العملية متاحة في وضع التطوير فقط.',stale:'تغيرت البيانات منذ فتح الصفحة. حدّثها قبل إجراء تعديل آخر.',refresh:'تحديث',arenaHint:'الميدان غير النشط لن يكون متاحاً لدروس جديدة. تبقى الدروس المجدولة فيه في الجدول، ويمكن تعديلها أو إلغاؤها من هناك.',scheduled:'دروس مجدولة لم تنتهِ بعد',calendar:'فتح الجدول',empty:'لم تتم إضافة ميادين بعد.',nameHint:'يظهر هذا الاسم في لوحة الإدارة باللغتين.',code:'الرمز',fixed:'مدة الدرس والمنطقة الزمنية للعرض فقط في هذه المرحلة.'}
};
export function FarmSettings({farm,arenas=[],issue}:{farm?:Farm;arenas?:Arena[];issue?:'farm'|'save'}){
 const [lang,setLang]=useState<'he'|'ar'>('he'),[message,setMessage]=useState<SettingsError|'success'|null>(null),[saving,setSaving]=useState<string|null>(null),[pending,startTransition]=useTransition();
 const busyRef=useRef(false),noticeRef=useRef<HTMLParagraphElement>(null),router=useRouter(),t=copy[lang],locked=saving!==null||pending;
 const field='mt-2 w-full min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-3 text-base',button='rounded-xl border border-stone-300 bg-white px-4 py-2 disabled:opacity-50';
 async function submit(event:React.FormEvent<HTMLFormElement>,kind:string,action:(data:FormData)=>Promise<SettingsResult>){
  event.preventDefault();if(busyRef.current)return;const data=new FormData(event.currentTarget);busyRef.current=true;setSaving(kind);setMessage(null);
  try{const result=await action(data);if(result.ok){setMessage('success');startTransition(()=>router.refresh());}else setMessage(result.error);}
  catch{setMessage('save');}finally{busyRef.current=false;setSaving(null);setTimeout(()=>noticeRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'}),0);}
 }
 return <main dir="rtl" lang={lang} className="min-h-screen bg-[#f5f3ee] px-4 py-8 text-[#243c32] sm:px-5"><div className="mx-auto max-w-6xl">
  <nav className="mb-8 flex items-center justify-between gap-4"><Link href="/admin" className="underline underline-offset-4">{t.back}</Link><button type="button" className={button} lang={lang==='he'?'ar':'he'} onClick={()=>setLang(lang==='he'?'ar':'he')}>{lang==='he'?'العربية':'עברית'}</button></nav>
  <header className="rounded-3xl bg-[#243c32] p-7 text-white"><h1 className="text-3xl font-bold">{t.title}</h1><p className="mt-3 text-sm text-white/75">{t.intro}</p></header>
  {(issue||message)&&<p ref={noticeRef} role={message==='success'&&!issue?'status':'alert'} className={`mt-5 rounded-xl p-5 ${message==='success'&&!issue?'bg-emerald-100':'bg-amber-100'}`}>{t[issue??message!]} <button type="button" disabled={locked} onClick={()=>startTransition(()=>router.refresh())} className="underline disabled:opacity-50">{t.refresh}</button></p>}
  {farm&&<>
   <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6"><h2 className="mb-5 text-xl font-bold">{t.farmDetails}</h2>
    <form key={farm.version} onSubmit={e=>submit(e,'farm',saveFarmSettings)}><input type="hidden" name="version" value={farm.version}/><fieldset disabled={locked} className="grid min-w-0 gap-4 sm:grid-cols-2">
     <label className="sm:col-span-2">{t.name} *<input name="name" required maxLength={100} defaultValue={farm.name} className={field}/></label><p className="text-sm text-stone-500 sm:col-span-2">{t.nameHint}</p>
     <div className="rounded-xl bg-stone-50 p-4"><p className="text-sm text-stone-500">{t.timezone}</p><p className="mt-2"><bdi>{farm.timezone}</bdi></p></div><div className="rounded-xl bg-stone-50 p-4"><p className="text-sm text-stone-500">{t.duration}</p><p className="mt-2">{t.minutes}</p></div>
     <p className="text-sm text-stone-500 sm:col-span-2">{t.fixed}</p><div className="sm:col-span-2"><button type="submit" className="rounded-xl bg-[#243c32] px-6 py-3 text-white">{saving==='farm'?t.saving:t.saveFarm}</button></div>
    </fieldset></form>
   </section>
   <section className="mt-8"><h2 className="text-2xl font-bold">{t.arenas}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">{t.arenaHint}</p><Link href="/lessons" className="mt-3 inline-block underline underline-offset-4">{t.calendar}</Link>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{arenas.map(arena=><article key={arena.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-6">
     <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">{t.code}: {arena.code}</h3><span className={`rounded-full px-3 py-1 text-xs ${arena.isActive?'bg-emerald-50 text-emerald-800':'bg-stone-100 text-stone-600'}`}>{arena.isActive?t.activeBadge:t.inactiveBadge}</span></div>
     <form key={arena.version} onSubmit={e=>submit(e,String(arena.id),saveArenaSettings)}><input type="hidden" name="id" value={arena.id}/><input type="hidden" name="version" value={arena.version}/><fieldset disabled={locked} className="grid min-w-0 gap-4">
      <label>{t.nameHe} *<input name="nameHe" lang="he" dir="rtl" required maxLength={100} defaultValue={arena.nameHe} className={field}/></label>
      <label>{t.nameAr} *<input name="nameAr" lang="ar" dir="rtl" required maxLength={100} defaultValue={arena.nameAr} className={field}/></label>
      <label className="flex items-center gap-3"><input type="checkbox" name="isActive" defaultChecked={arena.isActive} className="h-5 w-5"/>{t.active}</label><p className="text-sm text-stone-500">{t.scheduled}: {arena.scheduled}</p>
      <div><button type="submit" className="rounded-xl bg-[#243c32] px-6 py-3 text-white">{saving===String(arena.id)?t.saving:t.saveArena}</button></div>
     </fieldset></form>
    </article>)}</div>{!arenas.length&&<p className="mt-5 rounded-xl bg-white p-5">{t.empty}</p>}
   </section>
  </>}
 </div></main>;
}
