'use client';

import { useActionState } from 'react';
import { changePassword, updateProfile, type PasswordState, type ProfileState } from '@/app/account/actions';
import styles from './account-settings.module.css';

const profileInitial: ProfileState = {};
const passwordInitial: PasswordState = {};

const roleNames = {
  ADMIN: 'מנהל / مدير',
  INSTRUCTOR: 'מדריך / مدرب',
  RIDER: 'רוכב / فارس',
} as const;

type Props = {
  displayName: string;
  username: string;
  role: keyof typeof roleNames;
  farmName: string;
  linkedName?: string | null;
};

export function AccountSettings({ displayName, username, role, farmName, linkedName }: Props) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, profileInitial);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, passwordInitial);

  const profileErrors: Record<NonNullable<ProfileState['error']>, string> = {
    invalid: 'השם חייב להכיל 2–80 תווים / يجب أن يحتوي الاسم على 2–80 حرفًا',
    save: 'לא הצלחנו לשמור את השינוי / تعذر حفظ التغيير',
  };
  const passwordErrors: Record<NonNullable<PasswordState['error']>, string> = {
    invalid: 'בדוק שהסיסמה החדשה מכילה לפחות 8 תווים וששתי ההקלדות זהות / تحقق من أن كلمة المرور الجديدة تحتوي على 8 أحرف على الأقل ومتطابقة',
    current: 'הסיסמה הנוכחית אינה נכונה / كلمة المرور الحالية غير صحيحة',
    same: 'הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית / يجب أن تكون كلمة المرور الجديدة مختلفة',
    save: 'לא הצלחנו לשנות את הסיסמה / تعذر تغيير كلمة المرور',
  };

  return (
    <div className={styles.shell} dir="rtl">
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>MY ACCOUNT</span>
          <h2>החשבון שלי / حسابي</h2>
          <p>ניהול פרטי החשבון והסיסמה האישית שלך / إدارة بيانات حسابك وكلمة المرور الخاصة بك.</p>
        </div>
        <div className={styles.heroMeta}>
          <span className={styles.chip}>{roleNames[role]}</span>
          <span className={styles.chip}>{farmName}</span>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h3>פרטי חשבון / بيانات الحساب</h3>
              <p>אפשר לעדכן את השם שמופיע במערכת. שם המשתמש נשאר קבוע.</p>
            </div>
            <span className={styles.badge}>PROFILE</span>
          </div>

          <form action={profileAction} className={styles.form}>
            <label className={styles.field}>
              <span>שם מוצג / الاسم الظاهر</span>
              <input className={styles.input} name="displayName" defaultValue={displayName} required minLength={2} maxLength={80} />
            </label>
            <label className={styles.field}>
              <span>שם משתמש / اسم المستخدم</span>
              <input className={styles.input} value={username} readOnly aria-readonly="true" />
            </label>
            {profileState.ok && <p className={`${styles.message} ${styles.success}`}>הפרטים נשמרו בהצלחה / تم حفظ البيانات بنجاح</p>}
            {profileState.error && <p role="alert" className={`${styles.message} ${styles.error}`}>{profileErrors[profileState.error]}</p>}
            <button className={styles.button} disabled={profilePending} type="submit">
              {profilePending ? 'שומר… / جارٍ الحفظ…' : 'שמור פרטים / حفظ البيانات'}
            </button>
          </form>

          <div className={styles.facts}>
            <div className={styles.fact}><span>תפקיד / الصفة</span><strong>{roleNames[role]}</strong></div>
            <div className={styles.fact}><span>חווה / المربط</span><strong>{farmName}</strong></div>
            {linkedName && <div className={styles.fact}><span>כרטיס מקושר / الملف المرتبط</span><strong>{linkedName}</strong></div>}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h3>שינוי סיסמה / تغيير كلمة المرور</h3>
              <p>הקלד את הסיסמה הנוכחית ולאחר מכן סיסמה חדשה.</p>
            </div>
            <span className={styles.badge}>SECURITY</span>
          </div>

          <form action={passwordAction} className={styles.form}>
            <label className={styles.field}>
              <span>סיסמה נוכחית / كلمة المرور الحالية</span>
              <input className={styles.input} name="currentPassword" type="password" autoComplete="current-password" required />
            </label>
            <label className={styles.field}>
              <span>סיסמה חדשה / كلمة المرور الجديدة</span>
              <input className={styles.input} name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
              <small className={styles.passwordHint}>לפחות 8 תווים / 8 أحرف على الأقل</small>
            </label>
            <label className={styles.field}>
              <span>אימות סיסמה / تأكيد كلمة المرور</span>
              <input className={styles.input} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
            </label>
            {passwordState.ok && <p className={`${styles.message} ${styles.success}`}>הסיסמה שונתה בהצלחה / تم تغيير كلمة المرور بنجاح</p>}
            {passwordState.error && <p role="alert" className={`${styles.message} ${styles.error}`}>{passwordErrors[passwordState.error]}</p>}
            <button className={styles.button} disabled={passwordPending} type="submit">
              {passwordPending ? 'מעדכן… / جارٍ التحديث…' : 'שנה סיסמה / تغيير كلمة المرور'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
