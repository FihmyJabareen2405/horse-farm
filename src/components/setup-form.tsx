'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { createFirstAdmin, type SetupState } from '@/app/setup/actions';
const initial: SetupState = {};
export function SetupForm({ lang }: { lang: 'he' | 'ar' }) {
  const [state, action, pending] = useActionState(createFirstAdmin, initial);
  const he = lang === 'he';
  const errors: Record<string,string> = he ? {
    exists:'כבר קיים משתמש במערכת. עבור למסך הכניסה.',invalid:'בדוק את שם המשתמש והשם המוצג.',password:'הסיסמה חייבת להכיל לפחות 8 תווים ושתי הסיסמאות חייבות להיות זהות.',farm:'נדרשת חווה אחת בדיוק במסד הנתונים.',config:'יש להגדיר AUTH_SECRET באורך 32 תווים לפחות.',save:'לא הצלחנו ליצור את המשתמש.'
  } : {
    exists:'يوجد مستخدم في النظام بالفعل. انتقل إلى صفحة الدخول.',invalid:'تحقق من اسم المستخدم والاسم الظاهر.',password:'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل وأن تتطابق الكلمتان.',farm:'يجب أن توجد مزرعة واحدة فقط في قاعدة البيانات.',config:'يجب تعريف AUTH_SECRET بطول 32 حرفًا على الأقل.',save:'تعذر إنشاء المستخدم.'
  };
  return <main dir="rtl" lang={lang} className="min-h-screen bg-[#f5f3ee] px-5 py-10"><div className="mx-auto max-w-md"><Link href={`/login?lang=${lang}`} className="text-sm underline">{he?'חזרה לכניסה':'العودة إلى الدخول'}</Link><section className="mt-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-bold text-[#9a7132]" lang="ar">مربط ابو ماجد</p><h1 className="mt-3 text-3xl font-bold">{he?'הקמת מנהל ראשון':'إنشاء المدير الأول'}</h1><p className="mt-2 text-sm text-stone-600">{he?'המסך הזה פעיל רק כל עוד אין משתמשים במערכת.':'هذه الصفحة تعمل فقط ما دام النظام بلا مستخدمين.'}</p><form action={action} className="mt-7 space-y-4"><input name="displayName" required placeholder={he?'שם מלא':'الاسم الكامل'} className="w-full rounded-xl border border-stone-300 px-4 py-3"/><input name="username" required autoCapitalize="none" placeholder={he?'שם משתמש באנגלית':'اسم المستخدم بالإنجليزية'} className="w-full rounded-xl border border-stone-300 px-4 py-3"/><input name="password" type="password" required placeholder={he?'סיסמה':'كلمة المرور'} className="w-full rounded-xl border border-stone-300 px-4 py-3"/><input name="confirm" type="password" required placeholder={he?'אימות סיסמה':'تأكيد كلمة المرور'} className="w-full rounded-xl border border-stone-300 px-4 py-3"/>{state.error&&<p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">{errors[state.error]}</p>}<button disabled={pending} className="w-full rounded-xl bg-[#243c32] px-5 py-3 font-bold text-white disabled:opacity-60">{pending?(he?'יוצר…':'جارٍ الإنشاء…'):(he?'צור מנהל והיכנס':'إنشاء المدير والدخول')}</button></form></section></div></main>;
}
