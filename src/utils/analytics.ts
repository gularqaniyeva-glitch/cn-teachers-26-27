// Лёгкий фоновый трекинг ключевых действий поверх Vercel Analytics (тот же
// пакет, что уже подключён в main.tsx для просмотров страниц). Никаких
// prompt/модалок при входе — Vercel Analytics сам различает посетителей
// на сервере по IP+User-Agent (без cookie и без клиентского fingerprint-
// кода), поэтому клиенту не нужно ничего спрашивать и ничего собирать
// самостоятельно, чтобы события на дашборде Vercel группировались по
// уникальным посещениям.
//
// Разработчик исключает свои собственные визиты либо явным
// localStorage.setItem('ignore_analytics', 'true'), либо один раз открыв
// сайт с ?debug=true — после этого флаг сохраняется навсегда, пока его не
// снимут вручную.
import { track } from '@vercel/analytics';

const IGNORE_KEY = 'ignore_analytics';
const SESSION_LOGGED_KEY = 'analytics_session_logged';

export function isAnalyticsDisabled(): boolean {
  try {
    return localStorage.getItem(IGNORE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Обязательно вызывать СИНХРОННО до первого рендера (см. main.tsx) — иначе <Analytics/> успеет отправить первый page view до того, как флаг встанет. */
export function applyDebugFlagFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      localStorage.setItem(IGNORE_KEY, 'true');
    }
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — не критично
  }
}

type EventProps = Record<string, string | number | boolean>;

function safeTrack(name: string, props?: EventProps): void {
  if (isAnalyticsDisabled()) return;
  try {
    track(name, props);
  } catch {
    // Блокировщики рекламы иногда режут скрипт аналитики — интерфейс это не должно ломать.
  }
}

/** Вызывается один раз при старте приложения — фиксирует ?debug=true и шлёт "session_start" один раз за вкладку браузера */
export function initAnalytics(): void {
  applyDebugFlagFromUrl();
  if (isAnalyticsDisabled()) return;

  try {
    if (sessionStorage.getItem(SESSION_LOGGED_KEY) === 'true') return;
    sessionStorage.setItem(SESSION_LOGGED_KEY, 'true');
  } catch {
    // sessionStorage недоступен — просто отправим событие ещё раз, не критично
  }

  safeTrack('session_start');
}

/** Переключение вкладок верхнего уровня (Главная, Статистика, 2–9 классы, 10–11 классы) */
export function trackTabSwitch(section: string): void {
  safeTrack('tab_switch', { section });
}

/** Применение фильтра в панели фильтров (Tabeçilik, год начала, статус и т.п.) */
export function trackFilterApplied(filter: string, value: string): void {
  safeTrack('filter_applied', { filter, value: value || '(сброшено)' });
}

/** Нажатие кнопки "Экспорт в Excel/CSV" */
export function trackExport(source: string): void {
  safeTrack('export_csv', { source });
}
