import type { Teacher } from '../types/teacher';
import { GRADE_GROUP_LABELS, LANGUAGE_LABELS, MODULES, PLATFORM_STATUS_LABELS, TRAINING_TYPE_LABELS } from '../data/constants';
import { getTeacherAverageScore } from './stats';

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",;\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTeachersToCsv(teachers: Teacher[], filename = 'учителя.csv'): void {
  const headers = [
    'ФИО',
    'Школа',
    'Район',
    'FIN',
    'Телефон',
    'LMS ID',
    'Язык',
    'Тип обучения',
    'Статус',
    'Классы',
    'Статус платформы',
    'Средний результат, %',
    ...MODULES.map((m) => m.shortTitle),
    'Заметка',
  ];

  const rows = teachers.map((t) => {
    const avg = getTeacherAverageScore(t);
    const moduleCells = MODULES.map((m) => {
      const result = t.moduleResults.find((r) => r.moduleId === m.id);
      if (!result) return 'нет данных';
      return `${result.passed ? 'прошёл' : 'не прошёл'} (${result.score}%)`;
    });

    return [
      t.fullName,
      t.school,
      t.district,
      t.fin,
      t.phone,
      t.lmsId,
      LANGUAGE_LABELS[t.language],
      TRAINING_TYPE_LABELS[t.trainingType],
      t.lifecycleStatus,
      GRADE_GROUP_LABELS[t.gradeGroup],
      PLATFORM_STATUS_LABELS[t.platformStatus],
      avg === null ? 'нет данных' : String(avg),
      ...moduleCells,
      t.note,
    ];
  });

  const csvLines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(';'));
  const csvContent = '﻿' + csvLines.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
