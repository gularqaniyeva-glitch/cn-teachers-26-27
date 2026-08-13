// Единая точка доступа к данным об учителях.
//
// Сейчас данные — это тестовый набор, сгенерированный в data/mockTeachers.ts
// и сохраняемый в localStorage браузера (чтобы правки и заметки не терялись
// при обновлении страницы).
//
// Когда источником данных станет Google Sheets, поменяется ТОЛЬКО этот файл:
// функции ниже останутся с той же сигнатурой (те же аргументы, тот же
// Promise-результат), а внутри вместо localStorage появятся вызовы
// Google Sheets API. Компоненты и store, которые вызывают эти функции,
// трогать не придётся.

import type { Teacher } from '../types/teacher';
import { createMockTeachers } from '../data/mockTeachers';
import { loadFromStorage, saveToStorage } from './storage';

const MOCK_TEACHER_COUNT = 50;
const SIMULATED_LATENCY_MS = 150;

let cache: Teacher[] | null = null;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function ensureLoaded(): Teacher[] {
  if (cache) return cache;
  const stored = loadFromStorage<Teacher[]>();
  cache = stored && stored.length > 0 ? stored : createMockTeachers(MOCK_TEACHER_COUNT);
  if (!stored) saveToStorage(cache);
  return cache;
}

export async function getTeachers(): Promise<Teacher[]> {
  return delay([...ensureLoaded()]);
}

export async function getTeacherById(id: string): Promise<Teacher | undefined> {
  const teacher = ensureLoaded().find((t) => t.id === id);
  return delay(teacher ? { ...teacher } : undefined);
}

export async function updateTeacher(id: string, patch: Partial<Teacher>): Promise<Teacher> {
  const teachers = ensureLoaded();
  const index = teachers.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Учитель с id="${id}" не найден`);
  }
  const updated: Teacher = { ...teachers[index], ...patch, id, updatedAt: new Date().toISOString() };
  teachers[index] = updated;
  saveToStorage(teachers);
  return delay({ ...updated });
}
