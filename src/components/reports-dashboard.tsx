import Link from 'next/link';
import { Activity, CalendarDays, CheckCircle2, Clock3, PawPrint, ShieldCheck, UserRoundCheck, Users, XCircle } from 'lucide-react';
import type { ReportsData } from '@/lib/reports';
import styles from './reports-dashboard.module.css';

export type { ReportsData } from '@/lib/reports';

type ReportsDashboardProps = { data?: ReportsData; issue?: 'farm' | 'connection' };

type TrendSeries = { name: string; values: number[] };

const TREND_COLORS = ['#18364b', '#b88942', '#4f7b66', '#a45f5f'];

function percent(value: number, total: number) {
  return total ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
}

function formatDate(value: string, timeZone = 'Asia/Jerusalem') {
  const source = value.includes('T') ? new Date(value) : new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat('he-IL', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(source);
}

function statusText(dayDiff: number) {
  if (dayDiff < 0) return `באיחור ${Math.abs(dayDiff)} ימים`;
  if (dayDiff === 0) return 'היום';
  if (dayDiff === 1) return 'מחר';
  return `בעוד ${dayDiff} ימים`;
}

export function ReportsDashboard({ data, issue }: ReportsDashboardProps) {
  if (issue || !data) {
    return <div className="reports-alert" role="alert">{issue === 'farm' ? 'לא נמצאה חווה פעילה במערכת.' : 'לא הצלחנו לטעון את הדוחות. בדוק את החיבור למסד הנתונים ונסה שוב.'}</div>;
  }

  const summary = data.summary;
  const lessonChart = [
    { label: 'הושלמו', value: summary.completedLessons, tone: 'success' },
    { label: 'מתוכננים', value: summary.scheduledLessons, tone: 'navy' },
    { label: 'בוטלו', value: summary.cancelledLessons, tone: 'danger' },
  ];
  const attendanceTotal = summary.present + summary.absent + summary.unmarked;
  const topInstructorMax = Math.max(1, ...data.instructors.map((row) => row.lessons));
  const topHorseMax = Math.max(1, ...data.horses.map((row) => row.lessons));
  const presets = [
    { label: '7 ימים', from: moveDate(data.today, -6) },
    { label: '30 ימים', from: moveDate(data.today, -29) },
    { label: '90 ימים', from: moveDate(data.today, -89) },
  ];
  const query = `from=${encodeURIComponent(data.from)}&to=${encodeURIComponent(data.to)}`;
  const monthlyMax = Math.max(1, ...data.months.map((row) => row.lessons));
  const attendanceTrend: TrendSeries[] = [{ name: 'נוכחות %', values: data.months.map((row) => row.attendanceRate ?? 0) }];
  const instructorSeries: TrendSeries[] = data.instructorTrend.map((row) => ({ name: row.name, values: row.values }));
  const horseSeries: TrendSeries[] = data.horseTrend.map((row) => ({ name: row.name, values: row.values }));

  return <div className={`${styles.root} reports-page`} dir="rtl">
    <section className="reports-filter-card">
      <div>
        <span className="reports-kicker">REPORTING PERIOD</span>
        <h2>טווח הדוח / فترة التقرير</h2>
        <p>{formatDate(data.from, data.timeZone)} — {formatDate(data.to, data.timeZone)}</p>
      </div>
      <form className="reports-filter-form" method="get">
        <label>מתאריך<input type="date" name="from" defaultValue={data.from} max={data.to} /></label>
        <label>עד תאריך<input type="date" name="to" defaultValue={data.to} min={data.from} max="2100-12-31" /></label>
        <button type="submit">הצג דוח</button>
      </form>
      <div className="reports-filter-bottom">
        <div className="reports-presets" aria-label="טווחים מהירים">
          {presets.map((preset) => <Link key={preset.label} href={`/reports?from=${preset.from}&to=${data.today}`}>{preset.label}</Link>)}
        </div>
        <div className="reports-export-actions" aria-label="ייצוא דוחות">
          <a className="is-excel" href={`/reports/export/xlsx?${query}`}>Excel</a>
          <a className="is-pdf" href={`/reports/print?${query}&auto=1`} target="_blank" rel="noreferrer">PDF / הדפסה</a>
        </div>
      </div>
    </section>

    <section className="reports-stat-grid" aria-label="סיכום">
      <StatCard icon={CalendarDays} label="שיעורים בטווח" value={summary.totalLessons} sub={`${summary.completedLessons} הושלמו`} />
      <StatCard icon={Clock3} label="שעות פעילות" value={summary.lessonHours} sub="ללא שיעורים שבוטלו" suffix="ש׳" />
      <StatCard icon={CheckCircle2} label="נוכחות" value={summary.attendanceRate ?? '—'} suffix={summary.attendanceRate !== null ? '%' : undefined} sub={`${summary.present} נוכחים · ${summary.absent} נעדרים`} />
      <StatCard icon={Activity} label="התקדמות ממוצעת" value={summary.progressAverage ?? '—'} suffix={summary.progressAverage !== null ? '/5' : undefined} sub={`${summary.participantAssignments} שיבוצי רוכבים`} />
    </section>

    <section className="reports-panel reports-wide-panel">
      <div className="reports-panel-head"><div><h3>פעילות חודשית</h3><p>שיעורים לפי חודש בטווח הנבחר</p></div><Activity size={20} /></div>
      <div className="reports-month-chart" aria-label="פעילות חודשית">
        {data.months.map((month) => <div className="reports-month-column" key={month.key}>
          <div className="reports-month-bars" title={`${month.label}: ${month.lessons} שיעורים`}>
            <span className="is-completed" style={{ height: `${percent(month.completed, monthlyMax)}%` }} />
            <span className="is-scheduled" style={{ height: `${percent(month.scheduled, monthlyMax)}%` }} />
            <span className="is-cancelled" style={{ height: `${percent(month.cancelled, monthlyMax)}%` }} />
          </div>
          <strong>{month.lessons}</strong>
          <small>{month.label}</small>
        </div>)}
      </div>
      <div className="reports-chart-legend">
        <span><i className="is-completed" />הושלמו</span><span><i className="is-scheduled" />מתוכננים</span><span><i className="is-cancelled" />בוטלו</span>
      </div>
    </section>

    <section className="reports-overview-grid reports-trend-grid">
      <article className="reports-panel">
        <div className="reports-panel-head"><div><h3>מגמת נוכחות</h3><p>אחוז נוכחות לפי חודש</p></div><CheckCircle2 size={20} /></div>
        <LineChart labels={data.months.map((row) => row.label)} series={attendanceTrend} fixedMax={100} suffix="%" emptyText="אין מספיק נתוני נוכחות" />
      </article>
      <article className="reports-panel">
        <div className="reports-panel-head"><div><h3>מגמת שיעורים</h3><p>סה״כ שיעורים בכל חודש</p></div><CalendarDays size={20} /></div>
        <LineChart labels={data.months.map((row) => row.label)} series={[{ name: 'שיעורים', values: data.months.map((row) => row.lessons) }]} emptyText="אין שיעורים בטווח" />
      </article>
    </section>

    <section className="reports-overview-grid">
      <article className="reports-panel">
        <div className="reports-panel-head"><div><h3>סטטוס שיעורים</h3><p>התפלגות השיעורים בטווח הנבחר</p></div><CalendarDays size={20} /></div>
        <div className="reports-bars">
          {lessonChart.map((row) => <div className="reports-bar-row" key={row.label}>
            <div className="reports-bar-copy"><span>{row.label}</span><strong>{row.value}</strong></div>
            <div className="reports-bar-track"><span className={`reports-bar-fill is-${row.tone}`} style={{ width: `${percent(row.value, Math.max(1, summary.totalLessons))}%` }} /></div>
          </div>)}
        </div>
      </article>

      <article className="reports-panel">
        <div className="reports-panel-head"><div><h3>נוכחות רוכבים</h3><p>נוכחות שסומנה בשיעורים שלא בוטלו</p></div><Users size={20} /></div>
        <div className="reports-attendance-stack" aria-label="התפלגות נוכחות">
          <span className="is-present" style={{ width: `${percent(summary.present, Math.max(1, attendanceTotal))}%` }} />
          <span className="is-absent" style={{ width: `${percent(summary.absent, Math.max(1, attendanceTotal))}%` }} />
          <span className="is-unmarked" style={{ width: `${percent(summary.unmarked, Math.max(1, attendanceTotal))}%` }} />
        </div>
        <div className="reports-legend">
          <span><i className="is-present" />נוכח <b>{summary.present}</b></span>
          <span><i className="is-absent" />נעדר <b>{summary.absent}</b></span>
          <span><i className="is-unmarked" />לא סומן <b>{summary.unmarked}</b></span>
        </div>
      </article>
    </section>

    <section className="reports-overview-grid">
      <article className="reports-panel">
        <div className="reports-panel-head"><div><h3>עומס מדריכים</h3><p>מספר שיעורים ושעות עבודה</p></div><UserRoundCheck size={20} /></div>
        <div className="reports-ranking-list">
          {data.instructors.slice(0, 8).map((row) => <div className="reports-ranking" key={row.id}>
            <div className="reports-ranking-copy"><strong>{row.name}</strong><span>{row.lessons} שיעורים · {row.hours} שעות · {row.riders} שיבוצים</span></div>
            <div className="reports-mini-track"><span style={{ width: `${percent(row.lessons, topInstructorMax)}%` }} /></div>
            {!row.active && <em>לא פעיל</em>}
          </div>)}
          {!data.instructors.length && <EmptyRow text="אין מדריכים להצגה" />}
        </div>
      </article>

      <article className="reports-panel">
        <div className="reports-panel-head"><div><h3>שימוש בסוסים</h3><p>מספר שיבוצים ושעות עבודה לסוס</p></div><PawPrint size={20} /></div>
        <div className="reports-ranking-list">
          {data.horses.slice(0, 8).map((row) => <div className="reports-ranking" key={row.id}>
            <div className="reports-ranking-copy"><strong>{row.name}</strong><span>{row.lessons} שיבוצים · {row.hours} שעות</span></div>
            <div className="reports-mini-track"><span style={{ width: `${percent(row.lessons, topHorseMax)}%` }} /></div>
            {!row.active && <em>לא פעיל</em>}
          </div>)}
          {!data.horses.length && <EmptyRow text="אין סוסים להצגה" />}
        </div>
      </article>
    </section>

    <section className="reports-overview-grid reports-trend-grid">
      <article className="reports-panel">
        <div className="reports-panel-head"><div><h3>עומס מדריכים לאורך זמן</h3><p>ארבעת המדריכים הפעילים ביותר בטווח</p></div><UserRoundCheck size={20} /></div>
        <LineChart labels={data.months.map((row) => row.label)} series={instructorSeries} emptyText="אין נתוני מדריכים" />
      </article>
      <article className="reports-panel">
        <div className="reports-panel-head"><div><h3>שימוש בסוסים לאורך זמן</h3><p>ארבעת הסוסים המשובצים ביותר בטווח</p></div><PawPrint size={20} /></div>
        <LineChart labels={data.months.map((row) => row.label)} series={horseSeries} emptyText="אין נתוני סוסים" />
      </article>
    </section>

    <section className="reports-panel reports-table-panel">
      <div className="reports-panel-head"><div><h3>נוכחות והתקדמות לפי רוכב</h3><p>פירוט לתקופה הנבחרת</p></div><Users size={20} /></div>
      <div className="reports-table-wrap">
        <table className="reports-table">
          <thead><tr><th>רוכב</th><th>שיעורים</th><th>נוכח</th><th>נעדר</th><th>לא סומן</th><th>אחוז נוכחות</th><th>התקדמות</th></tr></thead>
          <tbody>
            {data.riders.map((row) => <tr key={row.id}>
              <td><strong>{row.name}</strong>{row.level && <small>{row.level}</small>}{!row.active && <small>לא פעיל</small>}</td>
              <td>{row.lessons}</td><td>{row.present}</td><td>{row.absent}</td><td>{row.unmarked}</td>
              <td>{row.attendanceRate === null ? '—' : `${row.attendanceRate}%`}</td>
              <td>{row.progressAverage === null ? '—' : `${row.progressAverage}/5`}</td>
            </tr>)}
            {!data.riders.length && <tr><td colSpan={7}><EmptyRow text="אין רוכבים להצגה" /></td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="reports-panel">
      <div className="reports-panel-head"><div><h3>טיפולים קרובים ובאיחור</h3><p>הטיפול האחרון מכל סוג לכל סוס, עד 30 יום קדימה</p></div><ShieldCheck size={20} /></div>
      <div className="reports-treatment-grid">
        {data.treatments.map((row) => <article className={`reports-treatment-card ${row.dayDiff < 0 ? 'is-overdue' : row.dayDiff <= 7 ? 'is-soon' : ''}`} key={row.id}>
          <span className="reports-treatment-icon">{row.dayDiff < 0 ? <XCircle size={18} /> : <ShieldCheck size={18} />}</span>
          <div><strong>{row.horseName}</strong><p>{row.type}</p><small>{formatDate(row.dueAt, data.timeZone)} · {statusText(row.dayDiff)}</small></div>
        </article>)}
        {!data.treatments.length && <EmptyRow text="אין טיפולים באיחור או ב־30 הימים הקרובים" />}
      </div>
    </section>
  </div>;
}

function LineChart({ labels, series, fixedMax, suffix = '', emptyText }: { labels: string[]; series: TrendSeries[]; fixedMax?: number; suffix?: string; emptyText: string }) {
  const maxValue = fixedMax ?? Math.max(1, ...series.flatMap((row) => row.values));
  const hasData = series.some((row) => row.values.some((value) => value > 0));
  if (!hasData || labels.length === 0) return <EmptyRow text={emptyText} />;

  const width = 640;
  const height = 230;
  const padX = 32;
  const padTop = 18;
  const padBottom = 42;
  const plotHeight = height - padTop - padBottom;
  const plotWidth = width - padX * 2;
  const xFor = (index: number) => labels.length <= 1 ? width / 2 : padX + (index / (labels.length - 1)) * plotWidth;
  const yFor = (value: number) => padTop + plotHeight - (Math.max(0, Math.min(maxValue, value)) / maxValue) * plotHeight;

  return <div className="reports-line-chart">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="גרף מגמה">
      {[0, .25, .5, .75, 1].map((ratio) => {
        const y = padTop + plotHeight - ratio * plotHeight;
        return <g key={ratio}><line x1={padX} y1={y} x2={width - padX} y2={y} className="reports-grid-line" /><text x={padX - 7} y={y + 4} className="reports-axis-value">{Math.round(maxValue * ratio)}{suffix}</text></g>;
      })}
      {series.map((row, seriesIndex) => {
        const points = row.values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');
        const color = TREND_COLORS[seriesIndex % TREND_COLORS.length];
        return <g key={`${row.name}-${seriesIndex}`}>
          <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {row.values.map((value, index) => <circle key={index} cx={xFor(index)} cy={yFor(value)} r="3.5" fill={color}><title>{row.name}: {value}{suffix}</title></circle>)}
        </g>;
      })}
      {labels.map((label, index) => <text key={label} x={xFor(index)} y={height - 13} textAnchor="middle" className="reports-axis-label">{label}</text>)}
    </svg>
    <div className="reports-series-legend">
      {series.map((row, index) => <span key={row.name}><i style={{ background: TREND_COLORS[index % TREND_COLORS.length] }} />{row.name}</span>)}
    </div>
  </div>;
}

function moveDate(day: string, delta: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function StatCard({ icon: Icon, label, value, sub, suffix }: { icon: typeof Activity; label: string; value: number | string; sub: string; suffix?: string }) {
  return <article className="reports-stat-card"><span className="reports-stat-icon"><Icon size={20} /></span><div><p>{label}</p><strong>{value}{suffix && <small>{suffix}</small>}</strong><span>{sub}</span></div></article>;
}

function EmptyRow({ text }: { text: string }) {
  return <div className="reports-empty">{text}</div>;
}
