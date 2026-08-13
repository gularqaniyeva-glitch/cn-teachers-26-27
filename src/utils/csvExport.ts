import type { Teacher } from '../types/teacher';
import { MODULES } from '../data/constants';
import { getTeacherAverageScore } from './stats';
import type { Dict } from '../i18n/translations';

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",;\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTeachersToCsv(teachers: Teacher[], t: Dict, filename = 'teachers.csv'): void {
  const headers = [
    t.columns.fullName,
    t.columns.school,
    t.columns.district,
    t.detail.fields.fin,
    t.detail.fields.phone,
    t.detail.fields.lmsId,
    t.detail.fields.language,
    t.columns.trainingType,
    t.columns.lifecycleStatus,
    t.columns.gradeGroup,
    t.columns.platformStatus,
    `${t.columns.result}, %`,
    ...MODULES.map((m) => `${t.gradeGroup[m.group]} · ${m.shortTitle}`),
    t.columns.note,
  ];

  const statusLabel = {
    passed: t.moduleStatus.passed,
    failed: t.moduleStatus.failed,
    not_started: t.moduleStatus.notStarted,
  } as const;

  const rows = teachers.map((teacher) => {
    const avg = getTeacherAverageScore(teacher);
    const moduleCells = MODULES.map((m) => {
      const result = teacher.moduleResults.find((r) => r.moduleId === m.id);
      if (!result) return '';
      return `${statusLabel[result.status]} (${result.score}%)`;
    });

    return [
      teacher.fullName,
      teacher.school,
      teacher.district,
      teacher.fin,
      teacher.phone,
      teacher.lmsId,
      t.language[teacher.language],
      t.trainingType[teacher.trainingType],
      teacher.lifecycleStatus,
      t.gradeGroup[teacher.gradeGroup],
      t.platformStatus[teacher.platformStatus === 'entered' ? 'entered' : 'notEntered'],
      avg === null ? '' : String(avg),
      ...moduleCells,
      teacher.note,
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
