import { useMemo } from 'react';
import { useTeacherStore } from '../store/useTeacherStore';
import { buildGroupAnomalyKeySet } from '../utils/anomalies';

/** Набор ключей "параллель+модуль+сектор+формат", отмеченных как массовая аномалия LMS */
export function useGroupAnomalySet() {
  const teachers = useTeacherStore((s) => s.teachers);
  return useMemo(() => buildGroupAnomalyKeySet(teachers), [teachers]);
}
