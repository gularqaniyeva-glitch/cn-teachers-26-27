import { create } from 'zustand';
import type { Teacher } from '../types/teacher';
import * as teacherService from '../services/teacherService';
import type { StatsSummary } from '../services/teacherService';
import { getScheduleAuditInfo } from '../services/scheduleMapping';
import { runDataAudit, type AuditIssue } from '../utils/dataAudit';

interface TeacherStoreState {
  teachers: Teacher[];
  /** Сводка "Вошли/Не вошли/Всего" с листа "Statistika" — null, если лист недоступен (напр. тестовые данные в dev-режиме); тогда карточки считают по teachers сами. */
  statsSummary: StatsSummary | null;
  /** Расхождения, найденные системой авто-аудита при последней загрузке — см. utils/dataAudit.ts. Пустой массив — данные согласованы. */
  auditIssues: AuditIssue[];
  loading: boolean;
  /** Ручное обновление данных (кнопка "🔄 Обновить данные") — отдельно от начальной загрузки */
  refreshing: boolean;
  error: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  /** Принудительно перезапрашивает данные из Google Sheets, минуя кэш сервисного слоя */
  reload: () => Promise<void>;
  updateTeacher: (id: string, patch: Partial<Teacher>) => Promise<void>;
  /** Массовое обновление: patchFn получает текущего учителя и возвращает изменения для него */
  updateManyTeachers: (ids: string[], patchFn: (teacher: Teacher) => Partial<Teacher>) => Promise<void>;
}

/** Собирает сводку/график/аудит из текущих сайд-каналов сервисного слоя — вызывается сразу после каждой успешной загрузки teachers. */
function snapshotAuxState(teachers: Teacher[]) {
  const statsSummary = teacherService.getStatsSummary();
  const auditIssues = runDataAudit(teachers, statsSummary, getScheduleAuditInfo());
  return { statsSummary, auditIssues };
}

export const useTeacherStore = create<TeacherStoreState>((set, get) => ({
  teachers: [],
  statsSummary: null,
  auditIssues: [],
  loading: false,
  refreshing: false,
  error: null,
  loaded: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      // Отдаём сохранённые локально данные мгновенно (если есть), а свежую
      // версию из Google Sheets подтягиваем в фоне без повторного "loading".
      const teachers = await teacherService.getTeachersStaleWhileRevalidate((fresh) => {
        set({ teachers: fresh, ...snapshotAuxState(fresh) });
      });
      set({ teachers, ...snapshotAuxState(teachers), loading: false, loaded: true });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Не удалось загрузить список учителей', loading: false });
    }
  },

  reload: async () => {
    set({ refreshing: true, error: null });
    try {
      const teachers = await teacherService.reloadTeachers();
      set({ teachers, ...snapshotAuxState(teachers), refreshing: false, loaded: true });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Не удалось обновить данные', refreshing: false });
    }
  },

  updateTeacher: async (id, patch) => {
    const updated = await teacherService.updateTeacher(id, patch);
    set({ teachers: get().teachers.map((t) => (t.id === id ? updated : t)) });
  },

  updateManyTeachers: async (ids, patchFn) => {
    const current = get().teachers;
    const byId = new Map(current.map((t) => [t.id, t]));
    const updates = await Promise.all(
      ids
        .map((id) => byId.get(id))
        .filter((t): t is Teacher => Boolean(t))
        .map((t) => teacherService.updateTeacher(t.id, patchFn(t))),
    );
    const updatesById = new Map(updates.map((t) => [t.id, t]));
    set({ teachers: get().teachers.map((t) => updatesById.get(t.id) ?? t) });
  },
}));
