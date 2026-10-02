'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState } from 'react';
import { ShieldCheck, GraduationCap, UserRound, ArrowUpLeft } from 'lucide-react';
import { login, type LoginState } from '@/app/login/actions';

const initial: LoginState = {};
type LoginRole = 'admin' | 'instructor' | 'rider';

export function LoginForm({ lang, role }: { lang: 'he' | 'ar'; role: LoginRole }) {
  const [state, action, pending] = useActionState(login, initial);
  const t = lang === 'he' ? {
    eyebrow: 'כניסה מאובטחת', title: 'כניסה למערכת', intro: 'הזן את פרטי החשבון שלך כדי להמשיך לאזור האישי.', user: 'שם משתמש', pass: 'סיסמה', submit: 'כניסה למערכת', loading: 'מתחבר…', back: 'בחירת תפקיד אחר',
    invalid: 'שם המשתמש או הסיסמה אינם נכונים, או שהחשבון אינו מתאים לתפקיד שנבחר.', setup: 'עדיין אין משתמש מנהל. יש לבצע הקמה ראשונית.', config: 'חסר AUTH_SECRET תקין בקובץ הסביבה.', setupLink: 'הקמת מנהל ראשון', switch: 'العربية',
    admin: 'מנהל החווה', instructor: 'מדריך', rider: 'רוכב',
    panelTitle: 'מربط ابو ماجد', panelText: 'מערכת אחת לניהול החווה, השיעורים, הסוסים וההתקדמות — בצורה פשוטה, בטוחה ומסודרת.', secure: 'החיבור מאובטח ומוגבל לפי הרשאות המשתמש.'
  } : {
    eyebrow: 'دخول آمن', title: 'الدخول إلى النظام', intro: 'أدخل بيانات حسابك للمتابعة إلى المساحة الشخصية.', user: 'اسم المستخدم', pass: 'كلمة المرور', submit: 'الدخول إلى النظام', loading: 'جارٍ الدخول…', back: 'اختيار نوع حساب آخر',
    invalid: 'اسم المستخدم أو كلمة المرور غير صحيحين، أو أن الحساب لا يطابق نوع الدخول المختار.', setup: 'لم يتم إنشاء مستخدم مدير بعد. يجب تنفيذ الإعداد الأولي.', config: 'قيمة AUTH_SECRET مفقودة أو غير صالحة.', setupLink: 'إنشاء المدير الأول', switch: 'עברית',
    admin: 'مدير المربط', instructor: 'مدرب', rider: 'فارس',
    panelTitle: 'مربط ابو ماجد', panelText: 'نظام واحد لإدارة المربط، الدروس، الخيول وتقدم الفرسان بصورة بسيطة، آمنة ومنظمة.', secure: 'الاتصال آمن ومقيّد حسب صلاحيات المستخدم.'
  };

  const roleMeta = {
    admin: { Icon: ShieldCheck, label: t.admin, tone: 'admin' },
    instructor: { Icon: GraduationCap, label: t.instructor, tone: 'instructor' },
    rider: { Icon: UserRound, label: t.rider, tone: 'rider' },
  }[role];
  const RoleIcon = roleMeta.Icon;
  const error = state.error === 'invalid' ? t.invalid : state.error === 'setup' ? t.setup : state.error === 'config' ? t.config : null;

  return (
    <main dir="rtl" lang={lang} className="farm-site farm-auth-surface farm-login-page">
      <div className="farm-login-shell">
        <aside className="farm-login-brand-panel">
          <div className="farm-login-brand-mark">
            <Image src="/brand/abu-majed-logo.png" alt="مربط ابو ماجد" width={260} height={175} priority />
          </div>
          <div className="farm-login-brand-copy">
            <span>EST. ABU MAJED</span>
            <h2>{t.panelTitle}</h2>
            <p>{t.panelText}</p>
          </div>
          <div className="farm-login-panel-line" />
        </aside>

        <section className="farm-login-card">
          <div className="farm-login-toolbar">
            <Link href={`/login?lang=${lang}`} className="farm-auth-back">{t.back}<ArrowUpLeft size={16} /></Link>
            <Link href={`/login?role=${role}&lang=${lang === 'he' ? 'ar' : 'he'}`} className="farm-auth-language">{t.switch}</Link>
          </div>

          <div className={`farm-login-role farm-login-role-${roleMeta.tone}`}>
            <span className="farm-login-role-icon"><RoleIcon size={23} strokeWidth={1.6} /></span>
            <span>{roleMeta.label}</span>
          </div>

          <div className="farm-login-heading">
            <span className="farm-auth-eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>

          <form action={action} className="farm-login-form">
            <input type="hidden" name="role" value={role} />
            <label className="farm-login-field">
              <span>{t.user}</span>
              <input name="username" autoComplete="username" required />
            </label>
            <label className="farm-login-field">
              <span>{t.pass}</span>
              <input name="password" type="password" autoComplete="current-password" required />
            </label>

            {error && (
              <div role="alert" className="farm-login-alert">
                {error}
                {state.error === 'setup' && role === 'admin' && (
                  <div><Link href={`/setup?lang=${lang}`}>{t.setupLink}</Link></div>
                )}
              </div>
            )}

            <button disabled={pending} className="farm-login-submit">
              {pending ? t.loading : t.submit}
              {!pending && <ArrowUpLeft size={18} />}
            </button>
          </form>

          <div className="farm-login-secure-note"><ShieldCheck size={15} />{t.secure}</div>
        </section>
      </div>
    </main>
  );
}
