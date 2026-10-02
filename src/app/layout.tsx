import type {Metadata,Viewport} from 'next';
import type {ReactNode} from 'react';
import './globals.css';
import './marketing.css';
import {PwaShell} from '@/components/pwa-shell';
export const metadata:Metadata={
 title:'مربط ابو ماجد | חוות אבו מאג׳ד',description:'مربط ابو ماجد — تربية الخيول العربية وتعليم الركوب العربي والعلاجي. חוות אבו מאג׳ד — גידול סוסים ערביים ורכיבה ערבית וטיפולית. כל יום 15:00–20:00.',
 appleWebApp:{capable:true,statusBarStyle:'default',title:'Abu Majed'},
 icons:{icon:[{url:'/icons/farm-192.png',sizes:'192x192',type:'image/png'}],apple:[{url:'/icons/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]},
};
export const viewport:Viewport={themeColor:'#243c32'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="he" dir="rtl"><body><PwaShell>{children}</PwaShell></body></html>;}
