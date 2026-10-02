'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, GraduationCap, UserRound, ArrowUpLeft } from 'lucide-react';

const copy = {
  ar: {
    back: 'العودة إلى موقع المربط',
    eyebrow: 'بوابة أعضاء المربط',
    title: 'اختاروا طريقة الدخول',
    intro: 'لكل مستخدم مساحة مخصصة بصلاحيات ومعلومات تناسب دوره في المربط.',
    admin: 'مدير المربط',
    adminText: 'إدارة المربط، المستخدمين، الخيول، الدروس والإعدادات.',
    instructor: 'مدرب',
    instructorText: 'الدروس، الحضور، تقييم تقدم الفرسان والملاحظات المهنية.',
    rider: 'فارس',
    riderText: 'الدروس الشخصية، الحضور، التقدم والتقييمات الأخيرة.',
    choose: 'متابعة للدخول',
    secure: 'دخول آمن ومخصص حسب نوع الحساب',
    switch: 'עברית',
  },
  he: {
    back: 'חזרה לאתר החווה',
    eyebrow: 'אזור חברי החווה',
    title: 'בחרו איך להיכנס',
    intro: 'לכל משתמש יש אזור אישי עם הרשאות ומידע שמתאימים לתפקיד שלו בחווה.',
    admin: 'מנהל החווה',
    adminText: 'ניהול החווה, המשתמשים, הסוסים, השיעורים וההגדרות.',
    instructor: 'מדריך',
    instructorText: 'שיעורים, נוכחות, הערכת התקדמות רוכבים והערות מקצועיות.',
    rider: 'רוכב',
    riderText: 'שיעורים אישיים, נוכחות, התקדמות והערכות אחרונות.',
    choose: 'המשך להתחברות',
    secure: 'כניסה מאובטחת ומותאמת לסוג החשבון',
    switch: 'العربية',
  },
};

type RoleChoice = 'admin' | 'instructor' | 'rider';

export function FarmEntry({ initialLanguage }: { initialLanguage: 'he' | 'ar' }) {
  const lang = initialLanguage;
  const t = copy[lang];
  const roles: Array<{ id: RoleChoice; Icon: typeof ShieldCheck; title: string; text: string; number: string }> = [
    { id: 'admin', Icon: ShieldCheck, title: t.admin, text: t.adminText, number: '01' },
    { id: 'instructor', Icon: GraduationCap, title: t.instructor, text: t.instructorText, number: '02' },
    { id: 'rider', Icon: UserRound, title: t.rider, text: t.riderText, number: '03' },
  ];

  return (
    <main className="farm-site farm-entry-page farm-auth-surface" lang={lang} dir="rtl">
      <div className="farm-auth-shell">
        <div className="farm-auth-topbar">
          <Link href="/" className="farm-auth-back">
            {t.back}<ArrowUpLeft size={17} />
          </Link>
          <Link href={`/login?lang=${lang === 'ar' ? 'he' : 'ar'}`} className="farm-auth-language" lang={lang === 'ar' ? 'he' : 'ar'}>
            {t.switch}
          </Link>
        </div>

        <section className="farm-entry-hero">
          <div className="farm-entry-brand">
            <div className="farm-entry-logo-wrap">
              <Image src="/brand/abu-majed-logo.png" alt="مربط ابو ماجد" width={170} height={115} priority />
            </div>
            <div>
              <span className="farm-auth-eyebrow">{t.eyebrow}</span>
              <h1>{t.title}</h1>
              <p>{t.intro}</p>
            </div>
          </div>
          <div className="farm-auth-secure">{t.secure}</div>
        </section>

        <div className="farm-entry-options farm-entry-options-modern">
          {roles.map(({ id, Icon, title, text, number }) => (
            <Link key={id} href={`/login?role=${id}&lang=${lang}`} className={`farm-role farm-role-${id}`}>
              <div className="farm-role-topline">
                <span className="farm-role-index">{number}</span>
                <span className="farm-role-icon"><Icon size={27} strokeWidth={1.6} /></span>
              </div>
              <div className="farm-role-copy">
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
              <span className="farm-role-action">{t.choose}<ArrowUpLeft size={17} /></span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
