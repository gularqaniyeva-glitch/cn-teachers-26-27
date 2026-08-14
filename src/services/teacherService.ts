// Единая точка доступа к данным об учителях.
//
// Источник данных — Google Sheets, через собственную serverless-функцию
// /api/sheets (см. api/sheets.js). Функция ходит в таблицу от имени
// сервисного аккаунта Google — ключ доступа хранится только в переменных
// окружения Vercel и никогда не попадает в код браузера.
//
// В режиме локальной разработки (`npm run dev`) serverless-функция
// недоступна (Vite её не поднимает), поэтому при ошибке запроса
// автоматически подставляются тестовые данные — это не влияет на прод.
//
// ВАЖНО: запись изменений обратно в Google Sheets пока не реализована.
// Редактирование, заметки и массовые действия сохраняются только в
// памяти текущей вкладки браузера — при обновлении страницы изменения
// подтянутся заново из таблицы и локальные правки будут потеряны.

import type { Teacher } from '../types/teacher';
import { mapRowToTeacher } from './sheetMapping';
import type { RawSheetRow } from './sheetMapping';

interface SheetsApiResponse {
  teachers: RawSheetRow[];
  senior: RawSheetRow[];
  fetchedAt: string;
}

interface SheetsApiError {
  error: string;
}

let cache: Teacher[] | null = null;
let inFlight: Promise<Teacher[]> | null = null;

async function fetchFromSheetsApi(): Promise<Teacher[]> {
  const res = await fetch('/api/sheets');
  const contentType = res.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    throw new Error(`Сервер вернул не JSON (HTTP ${res.status}) — вероятно, /api/sheets недоступен здесь.`);
  }

  const data = (await res.json()) as SheetsApiResponse | SheetsApiError;

  if (!res.ok || 'error' in data) {
    throw new Error('error' in data ? data.error : `Ошибка запроса к /api/sheets (HTTP ${res.status})`);
  }

  const teachers2to9 = data.teachers.map((row, i) => mapRowToTeacher(row, i));
  const teachersSenior = data.senior.map((row, i) => mapRowToTeacher(row, i, '10-11'));

  return [...teachers2to9, ...teachersSenior];
}

async function loadTeachers(): Promise<Teacher[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const teachers = await fetchFromSheetsApi();
      cache = teachers;
      return teachers;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(
          '[teacherService] /api/sheets недоступен в режиме локальной разработки — использую тестовые данные:',
          err,
        );
        const { createMockTeachers } = await import('../data/mockTeachers');
        cache = createMockTeachers(50);
        return cache;
      }
      throw err;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export async function getTeachers(): Promise<Teacher[]> {
  return [...(await loadTeachers())];
}

/** Принудительно перезапрашивает данные из Google Sheets, минуя кэш — для кнопки "Обновить данные" */
export async function reloadTeachers(): Promise<Teacher[]> {
  cache = null;
  return getTeachers();
}

export async function getTeacherById(id: string): Promise<Teacher | undefined> {
  const teachers = await loadTeachers();
  const teacher = teachers.find((t) => t.id === id);
  return teacher ? { ...teacher } : undefined;
}

export async function updateTeacher(id: string, patch: Partial<Teacher>): Promise<Teacher> {
  const teachers = await loadTeachers();
  const index = teachers.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Учитель с id="${id}" не найден`);
  }
  const updated: Teacher = { ...teachers[index], ...patch, id, updatedAt: new Date().toISOString() };
  teachers[index] = updated;
  cache = teachers;
  return { ...updated };
}
