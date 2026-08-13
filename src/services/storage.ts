// Локальное хранение данных браузера — временная замена базы данных.
// Используется только сервисным слоем (teacherService.ts), больше никем.

// v3 — в тестовые данные добавлены гарантированные "аномалии LMS"
// для демонстрации авто-аудита. Версионируем ключ, чтобы у всех
// автоматически подтянулись свежие тестовые данные.
const STORAGE_KEY = 'cn-teachers-26-27:data:v3';

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
