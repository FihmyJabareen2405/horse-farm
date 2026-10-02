'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {IntroVideoGate} from '@/components/intro-video-gate';
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
const words={
 he:{title:'החווה, גם כאפליקציה',body:'פתיחה נוחה מהמסך הראשי, בחלון נפרד.',install:'התקנת האפליקציה',help:'איך מתקינים?',close:'סגירה',ios:'ב־Safari: פתח את תפריט השיתוף, בחר ״הוסף למסך הבית״ ואשר את ההוספה.',other:'בתפריט הדפדפן חפש ״התקנת אפליקציה״ או ״הוספה למסך הבית״. אם האפשרות אינה מופיעה, נסה ב־Chrome או Edge.',secure:'להתקנה נדרש חיבור HTTPS, או localhost במחשב הפיתוח.',offline:'אין חיבור לאינטרנט. טעינת נתוני החווה ושמירת שינויים דורשות חיבור.',failed:'לא הצלחנו להכין את ההתקנה כרגע. רענן את הדף ונסה שוב.',installing:'פותח התקנה…',online:'האפליקציה דורשת חיבור לאינטרנט לניהול החווה.'},
 ar:{title:'المزرعة كتطبيق أيضاً',body:'افتح التطبيق بسهولة من الشاشة الرئيسية في نافذة مستقلة.',install:'تثبيت التطبيق',help:'كيف أثبّت التطبيق؟',close:'إغلاق',ios:'في Safari: افتح قائمة المشاركة، اختر «إضافة إلى الشاشة الرئيسية» ثم أكد الإضافة.',other:'ابحث في قائمة المتصفح عن «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». إذا لم يظهر الخيار، جرّب Chrome أو Edge.',secure:'يتطلب التثبيت اتصال HTTPS أو localhost على كمبيوتر التطوير.',offline:'لا يوجد اتصال بالإنترنت. تحميل بيانات المزرعة وحفظ التغييرات يتطلبان اتصالاً.',failed:'تعذّر تجهيز التثبيت حالياً. حدّث الصفحة وحاول مجدداً.',installing:'جارٍ فتح التثبيت…',online:'تتطلب إدارة المزرعة في التطبيق اتصالاً بالإنترنت.'}
};
export function PwaShell({children}:{children:ReactNode}){
 const [lang,setLang]=useState<'he'|'ar'>('he'),[prompt,setPrompt]=useState<InstallPrompt|null>(null),[installed,setInstalled]=useState(false),[online,setOnline]=useState(true),[help,setHelp]=useState(false),[ios,setIos]=useState(false),[secure,setSecure]=useState(true),[failed,setFailed]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{const sync=()=>setLang(document.querySelector('main[lang]')?.getAttribute('lang')==='ar'?'ar':'he');sync();const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['lang']});return ()=>observer.disconnect();},[]);
 useEffect(()=>{
  const media=window.matchMedia('(display-mode: standalone)');
  const syncInstalled=()=>setInstalled(media.matches||!!(navigator as Navigator&{standalone?:boolean}).standalone),syncOnline=()=>setOnline(navigator.onLine);
  const onPrompt=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);},onInstalled=()=>{setInstalled(true);setPrompt(null);};
  syncInstalled();syncOnline();setSecure(window.isSecureContext);setIos(/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
  window.addEventListener('beforeinstallprompt',onPrompt);window.addEventListener('appinstalled',onInstalled);window.addEventListener('online',syncOnline);window.addEventListener('offline',syncOnline);media.addEventListener('change',syncInstalled);
  let active=true;if('serviceWorker' in navigator&&window.isSecureContext)navigator.serviceWorker.register('/farm-sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{if(active)setFailed(true);});
  return ()=>{active=false;window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstalled);window.removeEventListener('online',syncOnline);window.removeEventListener('offline',syncOnline);media.removeEventListener('change',syncInstalled);};
 },[]);
 async function install(){if(!prompt||busy){setHelp(true);return;}setBusy(true);setFailed(false);try{await prompt.prompt();await prompt.userChoice;setPrompt(null);}catch{setFailed(true);setPrompt(null);}finally{setBusy(false);}}
 const t=words[lang];
 return <><IntroVideoGate/>{!online&&<div role="status" dir="rtl" lang={lang} className="sticky top-0 z-50 border-b border-amber-300 bg-amber-100 px-5 py-3 text-center text-sm text-amber-950">{t.offline}</div>}{children}
 {!installed&&<aside dir="rtl" lang={lang} aria-label={t.title} className="border-t border-stone-200 bg-white px-5 py-6 text-[#243c32]"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-bold">{t.title}</h2><p className="mt-2 text-sm text-stone-600">{t.body}</p></div><button type="button" disabled={busy} onClick={()=>prompt?void install():setHelp(!help)} className="rounded-xl bg-[#243c32] px-5 py-3 text-sm text-white disabled:opacity-50">{busy?t.installing:prompt?t.install:t.help}</button></div>
 {failed&&<p role="status" className="mt-4 text-sm text-amber-800">{t.failed}</p>}{help&&<div className="mt-4 rounded-xl bg-[#f5f3ee] p-4 text-sm leading-7"><p>{!secure?t.secure:ios?t.ios:t.other}</p><p className="mt-2 text-stone-600">{t.online}</p><button type="button" onClick={()=>setHelp(false)} className="mt-2 underline">{t.close}</button></div>}</div></aside>}
 </>;
}
