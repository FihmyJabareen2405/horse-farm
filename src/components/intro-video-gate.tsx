'use client';

import {useEffect,useRef,useState} from 'react';
import {Download,LogIn,Share2,Volume2,X} from 'lucide-react';
import styles from './intro-video-gate.module.css';

const STORAGE_KEY='abu-majed-intro-seen';
const PWA_INSTALLED_KEY='abu-majed-pwa-installed';

type InstallPrompt=Event&{
  prompt:()=>Promise<void>;
  userChoice:Promise<{outcome:'accepted'|'dismissed'}>;
};

function isStandalone(){
  const iosStandalone=!!(navigator as Navigator&{standalone?:boolean}).standalone;
  return window.matchMedia('(display-mode: standalone)').matches||iosStandalone;
}

function isMobileDevice(){
  return window.matchMedia('(max-width: 820px)').matches &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function IntroVideoGate(){
 const videoRef=useRef<HTMLVideoElement|null>(null);
 const [visible,setVisible]=useState(true);
 const [started,setStarted]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [error,setError]=useState(false);
 const [mobile,setMobile]=useState(false);
 const [installed,setInstalled]=useState(false);
 const [installPrompt,setInstallPrompt]=useState<InstallPrompt|null>(null);
 const [ios,setIos]=useState(false);
 const [installHelp,setInstallHelp]=useState(false);
 const [installing,setInstalling]=useState(false);

 useEffect(()=>{
  try{
   if(sessionStorage.getItem(STORAGE_KEY)==='1')setVisible(false);
  }catch{}
 },[]);

 useEffect(()=>{
  const mobileQuery=window.matchMedia('(max-width: 820px)');
  const standaloneQuery=window.matchMedia('(display-mode: standalone)');

  const sync=()=>{
   const standalone=isStandalone();
   const storedInstalled=localStorage.getItem(PWA_INSTALLED_KEY)==='1';
   setMobile(isMobileDevice());
   setInstalled(standalone||storedInstalled);
   if(standalone){
    try{localStorage.setItem(PWA_INSTALLED_KEY,'1');}catch{}
   }
  };

  const onBeforeInstall=(event:Event)=>{
   event.preventDefault();
   setInstallPrompt(event as InstallPrompt);
   setInstalled(false);
  };

  const onInstalled=()=>{
   try{localStorage.setItem(PWA_INSTALLED_KEY,'1');}catch{}
   setInstalled(true);
   setInstallPrompt(null);
   setInstallHelp(false);
  };

  setIos(/iPhone|iPad|iPod/.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
  sync();

  window.addEventListener('beforeinstallprompt',onBeforeInstall);
  window.addEventListener('appinstalled',onInstalled);
  mobileQuery.addEventListener('change',sync);
  standaloneQuery.addEventListener('change',sync);

  return ()=>{
   window.removeEventListener('beforeinstallprompt',onBeforeInstall);
   window.removeEventListener('appinstalled',onInstalled);
   mobileQuery.removeEventListener('change',sync);
   standaloneQuery.removeEventListener('change',sync);
  };
 },[]);

 useEffect(()=>{
  if(!visible)return;
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  return ()=>{document.body.style.overflow=previous;};
 },[visible]);

 function finish(){
  try{sessionStorage.setItem(STORAGE_KEY,'1');}catch{}
  const video=videoRef.current;
  if(video){video.pause();video.currentTime=0;}
  setVisible(false);
 }

 async function enter(){
  const video=videoRef.current;
  if(!video)return;
  setError(false);
  setStarted(true);
  video.muted=false;
  video.volume=1;
  video.currentTime=0;
  try{
   await video.play();
   setPlaying(true);
  }catch{
   setPlaying(false);
   setError(true);
   setStarted(false);
  }
 }

 async function installApp(){
  setInstallHelp(false);

  if(installPrompt){
   setInstalling(true);
   try{
    await installPrompt.prompt();
    const choice=await installPrompt.userChoice;
    if(choice.outcome==='accepted'){
     try{localStorage.setItem(PWA_INSTALLED_KEY,'1');}catch{}
     setInstalled(true);
    }
    setInstallPrompt(null);
   }finally{
    setInstalling(false);
   }
   return;
  }

  setInstallHelp(true);
 }

 if(!visible)return null;

 const showInstallButton=mobile&&!installed&&(!!installPrompt||ios);

 return <div className={styles.gate} role="dialog" aria-modal="true" aria-label="مربط ابو ماجد / חוות אבו מאג׳ד">
  <video
   ref={videoRef}
   className={styles.video}
   src="/video/abu-majed-intro.mp4"
   poster="/video/abu-majed-intro-poster.jpg"
   playsInline
   preload="metadata"
   onEnded={finish}
   onPlay={()=>setPlaying(true)}
   onPause={()=>setPlaying(false)}
   onError={()=>setError(true)}
  />
  <div className={`${styles.scrim} ${started?styles.scrimPlaying:''}`} />

  {!started&&<div className={styles.entryPanel} dir="rtl">
   <img
    src="/brand/abu-majed-logo.png"
    alt="مربط ابو ماجد / חוות אבו מאג׳ד"
    className={styles.entryLogo}
   />
   <span className={styles.eyebrow}>ABU MAJED · ARABIAN HORSES</span>
   <h1><span lang="ar">مربط ابو ماجد</span><span className={styles.divider}>/</span><span lang="he">חוות אבו מאג׳ד</span></h1>
   <p>ברוכים הבאים · أهلاً وسهلاً</p>

   <div className={styles.entryActions}>
    <button type="button" className={styles.enterButton} onClick={()=>void enter()}>
     <LogIn size={20}/><span>כניסה / دخول</span><Volume2 size={18}/>
    </button>

    {showInstallButton&&
     <button
      type="button"
      className={styles.installButton}
      disabled={installing}
      onClick={()=>void installApp()}
     >
      <Download size={19}/>
      <span>{installing?'פותח התקנה… / جارٍ التثبيت…':'התקנת האפליקציה / تثبيت التطبيق'}</span>
     </button>
    }
   </div>

   {installHelp&&
    <div className={styles.installHelp}>
     <Share2 size={18}/>
     <div>
      <strong>התקנה באייפון / التثبيت على iPhone</strong>
      <span>Safari → שיתוף → הוסף למסך הבית · Safari ← مشاركة ← إضافة إلى الشاشة الرئيسية</span>
     </div>
     <button type="button" onClick={()=>setInstallHelp(false)} aria-label="סגירה"><X size={16}/></button>
    </div>
   }

   <small>הלחיצה על כניסה מפעילה את סרטון הפתיחה עם אודיו · الضغط على الدخول يشغّل فيديو الافتتاح مع الصوت</small>
   {error&&<div className={styles.error}>לא ניתן להפעיל את הסרטון כרגע. נסה שוב. · تعذّر تشغيل الفيديو، حاول مرة أخرى.</div>}
  </div>}

  {started&&<div className={styles.playingBar} dir="rtl">
   <div className={styles.soundBadge}><Volume2 size={17}/><span>{playing?'אודיו פעיל · الصوت مفعّل':'מושהה · متوقف مؤقتاً'}</span></div>
   <button type="button" className={styles.skipButton} onClick={finish}><X size={17}/><span>דלג / تخطي</span></button>
  </div>}
 </div>;
}
