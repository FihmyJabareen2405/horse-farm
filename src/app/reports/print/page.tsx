import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getReportsData } from '@/lib/reports';
import { ReportsPrintTrigger } from '@/components/reports-print-trigger';
import styles from './reports-print.module.css';

function formatDate(value: string, timeZone: string) {
  const date = value.includes('T') ? new Date(value) : new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat('he-IL', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default async function ReportsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[]; auto?: string | string[] }>;
}) {
  const admin = await requireRole('ADMIN');
  const params = await searchParams;
  const result = await getReportsData(admin.farmId, params);

  if (!result) return <main className={styles.page}><div className={styles.sheet}>לא נמצאה חווה פעילה.</div></main>;
  const { farm, data } = result;
  const auto = params.auto === '1';

  return <main className={styles.page}>
    <div className={styles.toolbar}>
      <ReportsPrintTrigger auto={auto} />
      <Link href={`/reports?from=${data.from}&to=${data.to}`}>חזרה לדוחות</Link>
    </div>
    <article className={styles.sheet}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src="/brand/abu-majed-logo.png" alt="לוגו החווה" />
          <div><h1>דוח פעילות חווה</h1><p>{farm.name} · تقرير نشاط المربط</p></div>
        </div>
        <div className={styles.period}><strong>{formatDate(data.from, data.timeZone)} — {formatDate(data.to, data.timeZone)}</strong><p>נוצר מתוך מערכת Horse Farm</p></div>
      </header>

      <section className={styles.kpis}>
        <Kpi label="שיעורים" value={data.summary.totalLessons} />
        <Kpi label="שעות פעילות" value={`${data.summary.lessonHours} ש׳`} />
        <Kpi label="נוכחות" value={data.summary.attendanceRate === null ? '—' : `${data.summary.attendanceRate}%`} />
        <Kpi label="התקדמות" value={data.summary.progressAverage === null ? '—' : `${data.summary.progressAverage}/5`} />
      </section>

      <section className={styles.section}>
        <h2>מגמות חודשיות</h2>
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>חודש</th><th>שיעורים</th><th>הושלמו</th><th>מתוכננים</th><th>בוטלו</th><th>נוכחות</th></tr></thead><tbody>
          {data.months.map((row) => <tr key={row.key}><td>{row.label}</td><td>{row.lessons}</td><td>{row.completed}</td><td>{row.scheduled}</td><td>{row.cancelled}</td><td>{row.attendanceRate === null ? '—' : `${row.attendanceRate}%`}</td></tr>)}
        </tbody></table></div>
      </section>

      <section className={`${styles.section} ${styles.twoCols}`}>
        <div><h2>עומס מדריכים</h2><div className={styles.list}>{data.instructors.slice(0, 8).map((row) => <div className={styles.row} key={row.id}><span>{row.name}</span><strong>{row.lessons} שיעורים · {row.hours} ש׳</strong></div>)}{!data.instructors.length && <p className={styles.empty}>אין נתונים</p>}</div></div>
        <div><h2>שימוש בסוסים</h2><div className={styles.list}>{data.horses.slice(0, 8).map((row) => <div className={styles.row} key={row.id}><span>{row.name}</span><strong>{row.lessons} שיבוצים · {row.hours} ש׳</strong></div>)}{!data.horses.length && <p className={styles.empty}>אין נתונים</p>}</div></div>
      </section>

      <section className={styles.section}>
        <h2>נוכחות והתקדמות לפי רוכב</h2>
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>רוכב</th><th>רמה</th><th>שיעורים</th><th>נוכח</th><th>נעדר</th><th>נוכחות</th><th>התקדמות</th></tr></thead><tbody>
          {data.riders.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.level ?? '—'}</td><td>{row.lessons}</td><td>{row.present}</td><td>{row.absent}</td><td>{row.attendanceRate === null ? '—' : `${row.attendanceRate}%`}</td><td>{row.progressAverage === null ? '—' : `${row.progressAverage}/5`}</td></tr>)}
        </tbody></table></div>
      </section>

      <section className={styles.section}>
        <h2>טיפולים קרובים ובאיחור</h2>
        {data.treatments.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>סוס</th><th>טיפול</th><th>מועד</th><th>סטטוס</th></tr></thead><tbody>
          {data.treatments.map((row) => <tr key={row.id}><td>{row.horseName}</td><td>{row.type}</td><td>{formatDate(row.dueAt, data.timeZone)}</td><td>{row.dayDiff < 0 ? `באיחור ${Math.abs(row.dayDiff)} ימים` : row.dayDiff === 0 ? 'היום' : `בעוד ${row.dayDiff} ימים`}</td></tr>)}
        </tbody></table></div> : <p className={styles.empty}>אין טיפולים באיחור או ב־30 הימים הקרובים.</p>}
      </section>

      <footer className={styles.footer}>{farm.name} · {data.from} — {data.to}</footer>
    </article>
  </main>;
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return <div className={styles.kpi}><span>{label}</span><strong>{value}</strong></div>;
}
