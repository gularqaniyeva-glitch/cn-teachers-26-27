import { create } from 'zustand';
import type { Teacher } from '../types/teacher';
import * as teacherService from '../services/teacherService';

interface TeacherStoreState {
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  updateTeacher: (id: string, patch: Partial<Teacher>) => Promise<void>;
  /** Массовое обновление: patchFn получает текущего учителя и возвращает изменения для него */
  updateManyTeachers: (ids: string[], patchFn: (teacher: Teacher) => Partial<Teacher>) => Promise<void>;
}

export const useTeacherStore = create<TeacherStoreState>((set, get) => ({
  teachers: [],
  loading: false,
  error: null,
  loaded: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const teachers = await teacherService.getTeachers();
      set({ teachers, loading: false, loaded: true });
    } catch {
      set({ error: 'Не удалось загрузить список учителей', loading: false });
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
