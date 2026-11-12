import I18n, {formatDate} from '../I18n';
import {addDays, formatTime, hijriLabel, isFriday} from './prayerDay';
import {methodName, prayerTimesFor} from './prayerTimes';

const COLUMNS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escape = (s: string) => s.replace(/[&<>"']/g, c => ENTITIES[c]);

/** Every day of `month`'s month, with that day's prayer times. */
export const monthDays = (settings: Settings, month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({length: count}, (_, i) => {
    const date = addDays(first, i);
    return {date, times: prayerTimesFor(settings, date)};
  });
};

/** A printable A4 page of the month's prayer times, as HTML for expo-print. */
export const timetableHtml = (settings: Settings, month: Date, locale = I18n.locale): string => {
  const rtl = /^(ar|ur|fa|he)/.test(locale);
  const days = monthDays(settings, month);
  const title = formatDate(month, {month: 'long', year: 'numeric'}, locale);
  const asr = I18n.t(`asrNames.${settings.asr}`);
  const subtitle = [
    settings.city,
    methodName(settings.calculationMethod),
    I18n.t('asrNames.label', {asr}),
  ]
    .filter(Boolean)
    .join(' · ');
  const head = COLUMNS.map(k => `<th>${escape(I18n.t(`prayer.${k}`))}</th>`).join('');
  const rows = days
    .map(({date, times}) => {
      const fri = isFriday(date);
      const cells = COLUMNS.map(k => {
        // prayerTimesFor always returns every column's prayer.
        const time = times.find(p => p.key === k)?.time;
        return `<td${k === 'dhuhr' && fri ? ' class="jumuah"' : ''}>${time ? formatTime(time, settings.timeFormat) : ''}</td>`;
      }).join('');
      const day = formatDate(date, {weekday: 'short', day: 'numeric'}, locale);
      return `<tr${fri ? ' class="fri"' : ''}><th scope="row">${escape(day)}<small>${escape(hijriLabel(date))}</small></th>${cells}</tr>`;
    })
    .join('');
  return `<!doctype html>
<html lang="${escape(locale)}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; color: #12162B; }
  h1 { font-size: 22px; margin: 0; color: #2453B3; }
  p { margin: 4px 0 14px; color: #5B6275; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { padding: 4px 6px; text-align: center; border-bottom: 1px solid #E3E7F0; font-variant-numeric: tabular-nums; }
  thead th { color: #5B6275; font-weight: 600; text-transform: uppercase; font-size: 10px; }
  tbody th { text-align: start; font-weight: 600; white-space: nowrap; }
  small { display: block; font-weight: 400; color: #8A90A2; font-size: 9px; }
  tr.fri { background: #EEF3FF; }
  td.jumuah { font-weight: 700; color: #2453B3; }
</style></head><body>
<h1>${escape(I18n.t('timetable.title', {month: title}))}</h1>
<p>${escape(subtitle)}</p>
<table><thead><tr><th>${escape(I18n.t('week.day'))}</th>${head}</tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
};
