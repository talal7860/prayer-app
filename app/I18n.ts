import {I18n} from 'i18n-js';
import {getLocales} from 'expo-localization';
import ar from './locales/ar.json';
import en from './locales/en.json';
import ur from './locales/ur.json';

export const LANGUAGES = ['en', 'ar', 'ur'] as const;
export const RTL_LANGUAGES = ['ar', 'ur'];

/** The first of the phone's preferred languages that the app has, else English. */
export const deviceLanguage = (): string => {
  try {
    const found = getLocales()
      .map(l => l.languageCode ?? '')
      .find(code => (LANGUAGES as readonly string[]).includes(code));
    return found ?? 'en';
  } catch {
    return 'en';
  }
};

const i18n = new I18n({en, ar, ur});

i18n.defaultLocale = 'en';
i18n.locale = deviceLanguage();
i18n.enableFallback = true;

/** Arabic-Indic (٠-٩) and Persian/Urdu (۰-۹) digits to 0-9. */
export const latinDigits = (text: string) =>
  text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) & 0xf));

/**
 * A date in the app's language with Latin digits (so dates match the times), e.g.
 * "الأربعاء، 11 نوفمبر". Hermes ignores `numberingSystem` and `-u-nu-latn`, so convert.
 */
export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions, locale = i18n.locale) =>
  latinDigits(date.toLocaleDateString(locale, options));

export default i18n;
