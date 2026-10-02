/* Never cache farm data: only generic offline content and app icons. */
const PREFIX='horse-farm-static-',CACHE=PREFIX+'v1',OFFLINE='/farm-offline.html';
const ASSETS=[OFFLINE,'/icons/farm-192.png','/icons/farm-512.png','/icons/farm-maskable-512.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{try{return await fetch(request);}catch{const cache=await caches.open(CACHE);return await cache.match(OFFLINE)||new Response('Offline / אין חיבור / لا يوجد اتصال',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}})());return;
 }
 if(ASSETS.includes(url.pathname)&&!url.search)event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(url.pathname)||fetch(request);})());
 // API, RSC, server actions and Next assets pass through untouched.
});

self.addEventListener('push',event=>{
 let data={};
 try{data=event.data?event.data.json():{};}catch{data={title:'مربط ابو ماجد / חוות אבו מאג׳ד',body:event.data?event.data.text():''};}
 const title=typeof data.title==='string'&&data.title?data.title:'مربط ابو ماجد / חוות אבו מאג׳ד';
 const body=typeof data.body==='string'?data.body:'';
 const href=typeof data.href==='string'&&data.href.startsWith('/')&&!data.href.startsWith('//')?data.href:'/notifications';
 const tag=typeof data.tag==='string'&&data.tag?data.tag:'horse-farm-notification';
 event.waitUntil(self.registration.showNotification(title,{
  body,
  icon:'/icons/farm-192.png',
  badge:'/icons/farm-192.png',
  tag,
  renotify:true,
  data:{href},
 }));
});

self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const href=event.notification?.data?.href;
 const target=typeof href==='string'&&href.startsWith('/')&&!href.startsWith('//')?href:'/notifications';
 event.waitUntil((async()=>{
  const allClients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of allClients){
   try{
    const url=new URL(client.url);
    if(url.origin===self.location.origin){
     if('focus' in client)await client.focus();
     if('navigate' in client)await client.navigate(target);
     return;
    }
   }catch{}
  }
  if(self.clients.openWindow)await self.clients.openWindow(target);
 })());
});
