import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
 return {id:'/',name:'مربط ابو ماجد | חוות אבו מאג׳ד',short_name:'Abu Majed',description:'تربية الخيول العربية وتعليم الركوب العربي والعلاجي',lang:'ar',dir:'rtl',start_url:'/',scope:'/',display:'standalone',background_color:'#f5f3ee',theme_color:'#243c32',icons:[
 {src:'/icons/farm-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
 {src:'/icons/farm-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
 {src:'/icons/farm-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]};
}
