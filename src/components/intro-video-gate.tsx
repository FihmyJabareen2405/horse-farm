'use client';

import {useEffect,useRef,useState} from 'react';
import {LogIn,Volume2,X} from 'lucide-react';
import styles from './intro-video-gate.module.css';

const STORAGE_KEY='abu-majed-intro-seen';

export function IntroVideoGate(){
 const videoRef=useRef<HTMLVideoElement|null>(null);
 const [visible,setVisible]=useState(true);
 const [started,setStarted]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [error,setError]=useState(false);

 useEffect(()=>{
  try{
   if(sessionStorage.getItem(STORAGE_KEY)==='1')setVisible(false);
  }catch{}
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

 if(!visible)return null;

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
   <span className={styles.eyebrow}>ABU MAJED · ARABIAN HORSES</span>
   <h1><span lang="ar">مربط ابو ماجد</span><span className={styles.divider}>/</span><span lang="he">חוות אבו מאג׳ד</span></h1>
   <p>ברוכים הבאים · أهلاً وسهلاً</p>
   <button type="button" className={styles.enterButton} onClick={()=>void enter()}>
    <LogIn size={20}/><span>כניסה / دخول</span><Volume2 size={18}/>
   </button>
   <small>הלחיצה מפעילה את סרטון הפתיחה עם אודיו · الضغط يشغّل فيديو الافتتاح مع الصوت</small>
   {error&&<div className={styles.error}>לא ניתן להפעיל את הסרטון כרגע. נסה שוב. · تعذّر تشغيل الفيديو، حاول مرة أخرى.</div>}
  </div>}

  {started&&<div className={styles.playingBar} dir="rtl">
   <div className={styles.soundBadge}><Volume2 size={17}/><span>{playing?'אודיו פעיל · الصوت مفعّل':'מושהה · متوقف مؤقتاً'}</span></div>
   <button type="button" className={styles.skipButton} onClick={finish}><X size={17}/><span>דלג / تخطي</span></button>
  </div>}
 </div>;
}
