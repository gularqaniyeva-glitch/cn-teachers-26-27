import { create } from 'zustand';
import type { Locale } from './translations';
import { TRANSLATIONS } from './translations';

const STORAGE_KEY = 'cn-teachers-26-27:locale';

function loadInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'az' || saved === 'ru' ? saved : 'ru';
  } catch {
    return 'ru';
  }
}

interface LocaleStoreState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStoreState>((set) => ({
  locale: loadInitialLocale(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // персонализация языка необязательна — ошибку хранения игнорируем
    }
    set({ locale });
  },
}));

/** Текущий словарь переводов — используйте как `const t = useT();` */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return TRANSLATIONS[locale];
}
