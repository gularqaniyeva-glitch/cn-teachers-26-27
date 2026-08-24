// Лёгкий трекинг ключевых действий поверх Vercel Analytics (тот же пакет,
// что уже подключён в main.tsx для просмотров страниц) — отдельный сервис
// вроде PostHog не подключаем: он потребовал бы своего аккаунта/API-ключа,
// а свойства (properties) на кастомных событиях track() уже дают то же
// самое разделение "кто что сделал" без сторонних скриптов и cookie.
//
// В приложении нет авторизации, поэтому "личность" пользователя — это имя,
// которое он один раз указывает сам (localStorage, не спрашиваем повторно).
// Разработчик исключает свои собственные визиты либо явным
// localStorage.setItem('ignore_analytics', 'true'), либо один раз открыв
// сайт с ?debug=true — после этого флаг сохраняется навсегда, пока его не
// снимут вручную.
import { track } from '@vercel/analytics';

const IGNORE_KEY = 'ignore_analytics';
const USER_KEY = 'analytics_user';
const USER_PROMPTED_KEY = 'analytics_user_prompted';
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

/** Спрашиваем имя РОВНО один раз за браузер — дальше берём то, что уже сохранено (даже пустое "Гость") */
function getAnalyticsUser(): string {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) return stored;
    if (localStorage.getItem(USER_PROMPTED_KEY) === 'true') return 'Гость';

    localStorage.setItem(USER_PROMPTED_KEY, 'true');
    const input = window.prompt('Как вас зовут? (для статистики использования сайта, можно пропустить)');
    const resolved = input?.trim() || 'Гость';
    localStorage.setItem(USER_KEY, resolved);
    return resolved;
  } catch {
    return 'Гость';
  }
}

type EventProps = Record<string, string | number | boolean>;

function safeTrack(name: string, props?: EventProps): void {
  if (isAnalyticsDisabled()) return;
  try {
    track(name, { user: getAnalyticsUser(), ...props });
  } catch {
    // Блокировщики рекламы иногда режут скрипт аналитики — интерфейс это не должно ломать.
  }
}

/** Вызывается один раз при старте приложения — фиксирует ?debug=true и шлёт "User Login" один раз за вкладку браузера */
export function initAnalytics(): void {
  applyDebugFlagFromUrl();
  if (isAnalyticsDisabled()) return;

  try {
    if (sessionStorage.getItem(SESSION_LOGGED_KEY) === 'true') return;
    sessionStorage.setItem(SESSION_LOGGED_KEY, 'true');
  } catch {
    // sessionStorage недоступен — просто отправим "User Login" ещё раз, не критично
  }

  safeTrack('User Login');
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
