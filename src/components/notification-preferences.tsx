import { SlidersHorizontal } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import { saveNotificationPreferences } from '@/app/notifications/preferences-actions';
import styles from './notification-preferences.module.css';

type Preferences = {
  lessonUpcoming: boolean;
  lessonCreated: boolean;
  lessonUpdated: boolean;
  lessonCancelled: boolean;
  treatmentDue: boolean;
};

const lessonOptions = [
  { key: 'lessonUpcoming', title: 'שיעור קרוב / درس قريب', description: 'תזכורת לפני שיעור שמתקרב / تذكير قبل اقتراب الدرس' },
  { key: 'lessonCreated', title: 'שיעור חדש / درس جديد', description: 'כאשר משבצים אותך לשיעור חדש / عند تعيينك لدرس جديد' },
  { key: 'lessonUpdated', title: 'שינוי בשיעור / تعديل الدرس', description: 'שינוי במועד, מדריך, מגרש או שיבוץ / تغيير الموعد أو المدرب أو الميدان أو التوزيع' },
  { key: 'lessonCancelled', title: 'ביטול שיעור / إلغاء درس', description: 'כאשר שיעור שלך מבוטל / عند إلغاء درس خاص بك' },
] as const;

export function NotificationPreferences({ role, preferences }: { role: UserRole; preferences: Preferences }) {
  const admin = role === 'ADMIN';
  return (
    <form action={saveNotificationPreferences} className={styles.card} dir="rtl">
      <div className={styles.header}>
        <div>
          <span className={styles.kicker}>PUSH PREFERENCES</span>
          <h3 className={styles.title}>מה לשלוח לטלפון / ما الذي يصل إلى الهاتف</h3>
          <p className={styles.subtitle}>בחר אילו סוגי Push תרצה לקבל. ההתראות בתוך המערכת ימשיכו להופיע כרגיל.</p>
        </div>
        <div className={styles.icon}><SlidersHorizontal size={21} /></div>
      </div>

      <div className={styles.options}>
        {admin ? (
          <label className={styles.option}>
            <div>
              <strong>טיפולים ובדיקות לסוסים / علاجات وفحوصات الخيول</strong>
              <span>תזכורת כאשר טיפול מתקרב או עבר את מועדו / تنبيه عند اقتراب موعد العلاج أو تأخره</span>
            </div>
            <input type="checkbox" name="treatmentDue" defaultChecked={preferences.treatmentDue} />
          </label>
        ) : lessonOptions.map((option) => (
          <label className={styles.option} key={option.key}>
            <div>
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </div>
            <input type="checkbox" name={option.key} defaultChecked={preferences[option.key]} />
          </label>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.note}>ההעדפה נשמרת לחשבון שלך ומשפיעה על כל המכשירים המחוברים אליו.</span>
        <button type="submit" className={styles.save}>שמירת העדפות / حفظ التفضيلات</button>
      </div>
    </form>
  );
}
