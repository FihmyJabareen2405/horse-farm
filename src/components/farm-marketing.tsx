'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUpLeft,
  ArrowDown,
  Phone,
  MapPin,
  Clock3,
  Menu,
  X,
  MessageCircle,
  HeartHandshake,
  Leaf,
  Compass,
  Check,
} from 'lucide-react';

const phone = '0502044882';
const waze = 'https://waze.com/ul/hsvbbztex2';

const words = {
  ar: {
    brand: 'مربط ابو ماجد',
    subtitle: 'الخيول العربية · الركوب العربي والعلاجي',
    home: 'الرئيسية',
    about: 'عن المربط',
    services: 'خدماتنا',
    horses: 'خيولنا',
    visit: 'الزيارة والتواصل',
    login: 'دخول الأعضاء',
    menu: 'القائمة',
    eyebrow: 'أهلاً بكم في مربط ابو ماجد',
    heroOne: 'علاقة تبدأ بالثقة.',
    heroTwo: 'وتكبر مع كل خطوة.',
    heroText: 'لتربية الخيول العربية وتعليم ركوب الخيل العربي والعلاجي، مع طاقم مهني مؤهل ومميز وذي خبرة عالية.',
    contact: 'تواصلوا معنا',
    discover: 'اكتشفوا المربط',
    scroll: 'تعرّفوا علينا',
    stripOne: 'ركوب عربي وعلاجي',
    stripTwo: 'دروس فردية وجماعية',
    stripThree: 'كل يوم · 15:00–20:00',
    aboutTitle: 'مكان يجمع حب الخيل، ومتعة التعلّم.',
    aboutText: 'في مربط ابو ماجد، يجتمع الاهتمام بالخيول العربية مع تعليم ركوب الخيل. نرافق الراغبين في تعلّم الركوب العربي والعلاجي من خلال طاقم مهني مؤهل وذي خبرة.',
    aboutSecond: 'للتعرّف على الدروس المتاحة وتنسيق الزيارة، يسعدنا أن نتحدث معكم ونجيب عن أسئلتكم.',
    aboutTag: 'الخيول العربية في قلب المربط',
    servicesTitle: 'اختاروا تجربتكم مع الخيل.',
    servicesIntro: 'من التعلّم إلى التواصل مع الخيل — تعرّفوا على مجالات النشاط في المربط.',
    western: 'تعليم الركوب العربي',
    westernText: 'دروس لتعلّم ركوب الخيل العربي، مع إرشاد الطاقم وتنسيق الدرس المناسب مع المربط.',
    therapy: 'تعليم الركوب العلاجي',
    therapyText: 'ركوب علاجي بإرشاد طاقم مهني مؤهل. تواصلوا معنا للاستفسار عن طبيعة الدروس ومدى ملاءمتها.',
    arabian: 'تربية الخيول العربية',
    arabianText: 'تربية الخيول العربية والاهتمام بها في المربط. يسعدنا استقبال استفساراتكم وتنسيق الزيارة.',
    ask: 'استفسروا عن الخدمة',
    horsesTitle: 'للخيل حضور. وللعلاقة معها قصة.',
    horsesText: 'الخيول العربية جزء أساسي من هوية مربط ابو ماجد. تعالوا للتعرّف على المربط والحديث مع الطاقم عن عالم الخيل ودروس الركوب.',
    horseArt: 'شعار مربط ابو ماجد بالخط العربي',
    horseCall: 'نسّقوا زيارة للمربط',
    visitTitle: 'ننتظركم في المربط.',
    visitText: 'للاستفسار عن الدروس أو تنسيق زيارة، اتصلوا بنا أو أرسلوا رسالة عبر واتساب.',
    hours: 'ساعات النشاط',
    everyday: 'جميع أيام الأسبوع',
    telephone: 'الهاتف والتواصل',
    location: 'كيف تصلون إلينا؟',
    locationText: 'افتحوا موقع المربط في Waze للحصول على إرشادات الوصول.',
    navigate: 'الانتقال إلى Waze',
    whatsapp: 'مراسلة عبر واتساب',
    call: 'اتصلوا بنا',
    footer: 'مربط ابو ماجد · لتربية الخيول العربية وتعليم الركوب العربي والعلاجي',
    copyright: 'جميع الحقوق محفوظة',
    memberTitle: 'هل أنتم من أعضاء المربط؟',
    memberText: 'مدير، مدرب أو فارس — بوابة الدخول إلى المساحة الشخصية.',
    memberButton: 'الدخول إلى البوابة',
    whatsappText: 'مرحباً، أرغب بالاستفسار عن دروس ركوب الخيل في مربط ابو ماجد.',
    openNow: 'مفتوح يومياً',
    professional: 'طاقم مهني مؤهل',
    personal: 'تعليم يناسب كل راكب',
  },
  he: {
    brand: 'חוות אבו מאג׳ד',
    subtitle: 'סוסים ערביים · רכיבה ערבית וטיפולית',
    home: 'ראשי',
    about: 'על החווה',
    services: 'השירותים שלנו',
    horses: 'הסוסים בחווה',
    visit: 'ביקור ויצירת קשר',
    login: 'כניסה למערכת',
    menu: 'תפריט',
    eyebrow: 'ברוכים הבאים לחוות אבו מאג׳ד',
    heroOne: 'קשר שמתחיל באמון.',
    heroTwo: 'וצומח עם כל צעד.',
    heroText: 'גידול סוסים ערביים ולימודי רכיבה ערבית וטיפולית, עם צוות מקצועי, מוסמך ומנוסה.',
    contact: 'דברו איתנו',
    discover: 'הכירו את החווה',
    scroll: 'נעים להכיר',
    stripOne: 'רכיבה ערבית וטיפולית',
    stripTwo: 'שיעורים פרטיים וקבוצתיים',
    stripThree: 'כל יום · 15:00–20:00',
    aboutTitle: 'מקום לאהבת סוסים ולחדוות הלמידה.',
    aboutText: 'בחוות אבו מאג׳ד אנחנו משלבים גידול סוסים ערביים עם לימודי רכיבה. צוות מקצועי, מוסמך ומנוסה מלווה את המעוניינים ללמוד רכיבה ערבית וטיפולית.',
    aboutSecond: 'נשמח לשוחח, לענות על שאלות ולעזור בתיאום ביקור ובהיכרות עם השיעורים בחווה.',
    aboutTag: 'הסוסים הערביים בלב החווה',
    servicesTitle: 'מצאו את הדרך שלכם לעולם הסוסים.',
    servicesIntro: 'מלימוד רכיבה ועד היכרות עם הסוסים — אלה תחומי הפעילות בחווה.',
    western: 'לימודי רכיבה ערבית',
    westernText: 'שיעורי רכיבה ערבית בליווי הצוות. דברו איתנו לתיאום ולהתאמת השיעור.',
    therapy: 'לימודי רכיבה טיפולית',
    therapyText: 'רכיבה טיפולית בהדרכת צוות מקצועי ומוסמך. ניתן לפנות אלינו לבירור אופי השיעורים והתאמתם.',
    arabian: 'גידול סוסים ערביים',
    arabianText: 'גידול סוסים ערביים וטיפול בהם בחווה. נשמח לענות על שאלות ולתאם ביקור.',
    ask: 'לפרטים על השירות',
    horsesTitle: 'לסוסים יש נוכחות. לקשר איתם יש סיפור.',
    horsesText: 'הסוסים הערביים הם חלק מהזהות של חוות אבו מאג׳ד. מוזמנים להכיר את החווה ולשוחח עם הצוות על עולם הסוסים ועל שיעורי הרכיבה.',
    horseArt: 'לוגו חוות אבו מאג׳ד בקליגרפיה ערבית',
    horseCall: 'לתיאום ביקור בחווה',
    visitTitle: 'מחכים לכם בחווה.',
    visitText: 'לשאלות על השיעורים ולתיאום ביקור, התקשרו או שלחו לנו הודעה ב־WhatsApp.',
    hours: 'שעות הפעילות',
    everyday: 'כל ימות השבוע',
    telephone: 'טלפון ויצירת קשר',
    location: 'איך מגיעים?',
    locationText: 'פתחו את מיקום החווה ב־Waze לקבלת הנחיות הגעה.',
    navigate: 'ניווט ב־Waze',
    whatsapp: 'שליחת הודעה ב־WhatsApp',
    call: 'התקשרו אלינו',
    footer: 'חוות אבו מאג׳ד · גידול סוסים ערביים ולימודי רכיבה ערבית וטיפולית',
    copyright: 'כל הזכויות שמורות',
    memberTitle: 'כבר חלק מהחווה?',
    memberText: 'מנהל, מדריך או רוכב — הכניסה לאזור האישי מתחילה כאן.',
    memberButton: 'כניסה לאזור האישי',
    whatsappText: 'שלום, אשמח לקבל פרטים על שיעורי הרכיבה בחוות אבו מאג׳ד.',
    openNow: 'פתוח בכל יום',
    professional: 'צוות מקצועי ומוסמך',
    personal: 'לימוד מותאם לכל רוכב',
  },
};

export function FarmMarketing() {
  const [lang, setLang] = useState<'ar' | 'he'>('ar');
  const [open, setOpen] = useState(false);
  const t = words[lang];
  const entry = `/login?lang=${lang}`;
  const wa = `https://wa.me/972502044882?text=${encodeURIComponent(t.whatsappText)}`;
  const links = [
    ['about', t.about],
    ['services', t.services],
    ['horses', t.horses],
    ['visit', t.visit],
  ];
  const services = [
    { Icon: Compass, title: t.western, text: t.westernText },
    { Icon: HeartHandshake, title: t.therapy, text: t.therapyText },
    { Icon: Leaf, title: t.arabian, text: t.arabianText },
  ];

  return (
    <main dir="rtl" lang={lang} className="farm-site" id="top">
      <a href="#main-content" className="farm-skip">{t.discover}</a>

      <header className="farm-header">
        <div className="farm-container farm-header-inner">
          <a href="#top" className="farm-wordmark">
            <span className="farm-brand-logo-wrap">
              <Image src="/brand/abu-majed-logo.jfif" width={70} height={49} alt="" aria-hidden="true" className="farm-brand-logo" style={{ width: '100%', height: '100%' }} loading="eager" />
            </span>
            <span className="farm-wordmark-text">
              <span lang="ar">مربط ابو ماجد</span>
              <small>{t.subtitle}</small>
            </span>
          </a>

          <nav aria-label={t.menu} className="farm-desktop-nav">
            {links.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </nav>

          <div className="farm-header-actions">
            <button type="button" className="farm-language" lang={lang === 'ar' ? 'he' : 'ar'} onClick={() => setLang(lang === 'ar' ? 'he' : 'ar')}>
              {lang === 'ar' ? 'עברית' : 'العربية'}
            </button>
            <Link href={entry} className="farm-entry">{t.login}<ArrowUpLeft size={16} /></Link>
            <button type="button" className="farm-menu-toggle" aria-label={t.menu} aria-expanded={open} aria-controls="farm-mobile-nav" onClick={() => setOpen(!open)}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="farm-mobile-nav" aria-label={t.menu} className="farm-mobile-nav">
            {links.map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>)}
            <Link href={entry}>{t.login}</Link>
          </nav>
        )}
      </header>

      <section className="farm-hero" id="main-content">
        <div className="farm-container farm-hero-grid">
          <div className="farm-hero-copy">
            <p className="farm-eyebrow"><span />{t.eyebrow}</p>
            <h1>{t.heroOne}<br /><em>{t.heroTwo}</em></h1>
            <p className="farm-hero-description">{t.heroText}</p>
            <div className="farm-buttons">
              <a href="#visit" className="farm-button farm-button-gold">{t.contact}<ArrowUpLeft size={19} /></a>
              <a href="#services" className="farm-hero-link">{t.discover}<ArrowDown size={17} /></a>
            </div>
            <div className="farm-hero-points">
              <span><Check size={15} />{t.openNow}</span>
              <span><Check size={15} />{t.professional}</span>
              <span><Check size={15} />{t.personal}</span>
            </div>
          </div>

          <div className="farm-hero-art">
            <div className="farm-hero-glow" />
            <div className="farm-art-frame">
              <span className="farm-art-overline">ABU MAJED · ARABIAN HORSES</span>
              <Image src="/brand/abu-majed-logo.jfif" width={820} height={580} priority loading="eager" alt={t.horseArt} className="farm-horse-art" style={{ width: '100%', height: 'auto' }} />
              <div className="farm-art-footer">
                <div><strong lang="ar">مربط ابو ماجد</strong><small>{t.aboutTag}</small></div>
                <span className="farm-art-number">01</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="farm-strip">
        <div className="farm-container">
          <span>{t.stripOne}</span><i aria-hidden="true">✦</i>
          <span>{t.stripTwo}</span><i aria-hidden="true">✦</i>
          <span>{t.everyday} <bdi>15:00–20:00</bdi></span>
        </div>
      </div>

      <section id="about" className="farm-section farm-about">
        <div className="farm-container farm-about-grid">
          <div className="farm-section-title-block">
            <p className="farm-kicker">01 — {t.about}</p>
            <h2>{t.aboutTitle}</h2>
          </div>
          <div className="farm-prose">
            <p>{t.aboutText}</p>
            <p>{t.aboutSecond}</p>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="farm-text-link">{t.contact}<ArrowUpLeft size={18} /></a>
          </div>
        </div>
        <div className="farm-container farm-about-facts">
          <div><span>01</span><strong>{t.stripOne}</strong></div>
          <div><span>02</span><strong>{t.professional}</strong></div>
          <div><span>03</span><strong>{t.everyday} · <bdi>15:00–20:00</bdi></strong></div>
        </div>
      </section>

      <section id="services" className="farm-section farm-services">
        <div className="farm-container">
          <div className="farm-section-heading">
            <div><p className="farm-kicker">02 — {t.services}</p><h2>{t.servicesTitle}</h2></div>
            <p>{t.servicesIntro}</p>
          </div>
          <div className="farm-service-grid">
            {services.map(({ Icon, title, text }, i) => (
              <article key={i} className="farm-service">
                <div className="farm-service-top">
                  <span className="farm-service-icon"><Icon size={27} strokeWidth={1.5} /></span>
                  <span className="farm-service-index">0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href={wa} target="_blank" rel="noopener noreferrer">{t.ask}<ArrowUpLeft size={19} /></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="horses" className="farm-section farm-horses">
        <div className="farm-container farm-horses-grid">
          <div className="farm-horses-art">
            <span className="farm-horses-orbit farm-horses-orbit-one" />
            <span className="farm-horses-orbit farm-horses-orbit-two" />
            <div className="farm-horses-logo-card">
              <Image src="/brand/abu-majed-logo.jfif" width={820} height={580} alt={t.horseArt} style={{ width: '100%', height: 'auto' }} />
            </div>
          </div>
          <div className="farm-horses-copy">
            <p className="farm-kicker">03 — {t.horses}</p>
            <h2>{t.horsesTitle}</h2>
            <p>{t.horsesText}</p>
            <div className="farm-horse-values" lang="ar"><span>أصالة</span><i>·</i><span>ثقة</span><i>·</i><span>شغف</span></div>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="farm-button farm-button-gold">{t.horseCall}<ArrowUpLeft size={19} /></a>
          </div>
        </div>
      </section>

      <section id="visit" className="farm-section farm-visit">
        <div className="farm-container">
          <p className="farm-kicker">04 — {t.visit}</p>
          <div className="farm-section-heading farm-visit-heading">
            <h2>{t.visitTitle}</h2>
            <p>{t.visitText}</p>
          </div>
          <div className="farm-contact-grid">
            <article>
              <span className="farm-contact-icon"><Clock3 size={25} strokeWidth={1.5} /></span>
              <span className="farm-contact-index">01</span>
              <h3>{t.hours}</h3>
              <p>{t.everyday}</p>
              <strong className="farm-hours"><bdi>15:00–20:00</bdi></strong>
            </article>
            <article>
              <span className="farm-contact-icon"><Phone size={25} strokeWidth={1.5} /></span>
              <span className="farm-contact-index">02</span>
              <h3>{t.telephone}</h3>
              <a href="tel:+972502044882" className="farm-phone" aria-label={`${t.call} ${phone}`}><bdi>050-204-4882</bdi></a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="farm-text-link"><MessageCircle size={18} />{t.whatsapp}</a>
            </article>
            <article>
              <span className="farm-contact-icon"><MapPin size={25} strokeWidth={1.5} /></span>
              <span className="farm-contact-index">03</span>
              <h3>{t.location}</h3>
              <p>{t.locationText}</p>
              <a href={waze} target="_blank" rel="noopener noreferrer" className="farm-text-link">{t.navigate}<ArrowUpLeft size={18} /></a>
            </article>
          </div>
        </div>
      </section>

      <section className="farm-member">
        <div className="farm-container">
          <div><span>MEMBERS AREA</span><h2>{t.memberTitle}</h2><p>{t.memberText}</p></div>
          <Link href={entry} className="farm-button farm-button-light">{t.memberButton}<ArrowUpLeft size={19} /></Link>
        </div>
      </section>

      <footer className="farm-footer">
        <div className="farm-container farm-footer-main">
          <div className="farm-footer-brand-block">
            <a href="#top" lang="ar" className="farm-footer-brand">مربط ابو ماجد</a>
            <p>{t.footer}</p>
          </div>
          <nav className="farm-footer-nav" aria-label={t.menu}>
            {links.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </nav>
          <div className="farm-footer-contact"><a href="tel:+972502044882"><bdi>050-204-4882</bdi></a><p>© {t.copyright} · مربط ابو ماجد</p></div>
        </div>
      </footer>

      <div className="farm-floating-actions" aria-label={t.contact}>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="farm-float farm-float-wa" aria-label={t.whatsapp}><MessageCircle size={20} /></a>
        <a href={waze} target="_blank" rel="noopener noreferrer" className="farm-float" aria-label={t.navigate}><MapPin size={20} /></a>
      </div>
    </main>
  );
}
