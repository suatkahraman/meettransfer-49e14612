/**
 * Lazy date-fns locale loader
 * Reduces initial bundle by loading locales on demand
 */

import type { Locale } from 'date-fns';

// Cache for loaded locales
const localeCache: Map<string, Locale> = new Map();

// Dynamic import map for date-fns locales
const localeImportMap: Record<string, () => Promise<{ default: Locale }>> = {
  'tr': () => import('date-fns/locale/tr').then(m => ({ default: m.tr })),
  'de': () => import('date-fns/locale/de').then(m => ({ default: m.de })),
  'fr': () => import('date-fns/locale/fr').then(m => ({ default: m.fr })),
  'ru': () => import('date-fns/locale/ru').then(m => ({ default: m.ru })),
  'it': () => import('date-fns/locale/it').then(m => ({ default: m.it })),
  'es': () => import('date-fns/locale/es').then(m => ({ default: m.es })),
  'en': () => import('date-fns/locale/en-US').then(m => ({ default: m.enUS })),
  'ar': () => import('date-fns/locale/ar').then(m => ({ default: m.ar })),
  'uk': () => import('date-fns/locale/uk').then(m => ({ default: m.uk })),
  'ja': () => import('date-fns/locale/ja').then(m => ({ default: m.ja })),
};

/**
 * Get locale synchronously from cache, or return undefined
 */
export function getCachedLocale(langCode: string): Locale | undefined {
  return localeCache.get(langCode.toLowerCase());
}

/**
 * Load a date-fns locale dynamically
 */
export async function loadLocale(langCode: string): Promise<Locale> {
  const normalizedCode = langCode.toLowerCase();
  
  // Return cached locale if available
  if (localeCache.has(normalizedCode)) {
    return localeCache.get(normalizedCode)!;
  }
  
  // Load the locale
  const importFn = localeImportMap[normalizedCode] || localeImportMap['en'];
  const module = await importFn();
  const locale = module.default;
  
  // Cache for future use
  localeCache.set(normalizedCode, locale);
  
  return locale;
}

/**
 * Preload a locale (call when user changes language)
 */
export function preloadLocale(langCode: string): void {
  const normalizedCode = langCode.toLowerCase();
  if (!localeCache.has(normalizedCode)) {
    loadLocale(normalizedCode);
  }
}

/**
 * Map of language codes to their date-fns locale keys
 */
export const languageToLocaleKey: Record<string, string> = {
  'TR': 'tr',
  'DE': 'de',
  'FR': 'fr',
  'RU': 'ru',
  'IT': 'it',
  'ES': 'es',
  'EN': 'en',
  'AR': 'ar',
  'UK': 'uk',
  'JA': 'ja',
};
