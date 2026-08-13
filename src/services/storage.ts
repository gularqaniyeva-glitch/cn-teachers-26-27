// Локальное хранение данных браузера — временная замена базы данных.
// Используется только сервисным слоем (teacherService.ts), больше никем.

// v2 — изменилась структура результатов модулей (3 статуса вместо passed:boolean)
// и нумерация модулей. Версионируем ключ, чтобы у всех автоматически
// подтянулись свежие тестовые данные в новом формате.
const STORAGE_KEY = 'cn-teachers-26-27:data:v2';

export function loadFromStorage<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveToStorage<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Тестовый слой хранения — ошибки квоты игнорируем.
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
