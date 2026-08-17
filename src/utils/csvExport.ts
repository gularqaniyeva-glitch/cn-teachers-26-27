import type { GradeGroup, Teacher } from '../types/teacher';
import { GRADE_GROUPS, findModuleResultForColumn, getModule, getModuleColumnsForGroups } from '../data/constants';
import {
  formatAssignedClassesLabel,
  getApplicableModules,
  getAssignedGradeGroups,
  getTeacherAverageScore,
  getTeacherOverallStats,
} from './stats';
import type { IndividualAnomaly } from './anomalies';
import type { Dict } from '../i18n/translations';

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",;\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Excel при открытии CSV сам пытается угадать тип ячейки и может превратить
// длинный LMS ID/FIN в число (с потерей ведущих нулей или в научной
// нотации). Оборачиваем значение как текстовую формулу ="..." — Excel
// показывает её результат как обычный текст, без переформатирования.
function excelTextLiteral(value: string): string {
  return value ? `="${value.replace(/"/g, '""')}"` : '';
}

// Активные параллели этой конкретной выгрузки — по факту назначенных
// модулей у переданных учителей (а не по одному gradeGroup, которое не
// покажет вторую параллель у двухпараллельных учителей).
function collectActiveGroups(teachers: Teacher[]): GradeGroup[] {
  const groups = new Set<GradeGroup>();
  for (const teacher of teachers) {
    for (const g of getAssignedGradeGroups(teacher)) groups.add(g);
  }
  return GRADE_GROUPS.filter((g) => groups.has(g));
}

function downloadCsv(headers: string[], rows: (string | number)[][], filename: string): void {
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

interface ExportFieldDef {
  key: string;
  header: (t: Dict) => string;
  value: (teacher: Teacher, t: Dict) => string;
}

// Каждое поле экспортируется, только если его ключ выбран пользователем в
// меню "Столбцы для экспорта" — так CSV не раздувается служебными и
// малополезными для конкретной выгрузки столбцами. "modules" — не
// колонка-на-модуль (их было бы под три десятка, в основном пустых), а
// одна сводная колонка со всеми результатами учителя.
const EXPORT_FIELDS: ExportFieldDef[] = [
  { key: 'fullName', header: (t) => t.columns.fullName, value: (te) => te.fullName },
  { key: 'school', header: (t) => t.columns.school, value: (te) => te.school },
  { key: 'district', header: (t) => t.columns.district, value: (te) => te.district },
  { key: 'sector', header: (t) => t.filters.sectorSection, value: (te, t) => t.language[te.language] },
  { key: 'trainingType', header: (t) => t.columns.trainingType, value: (te, t) => t.trainingType[te.trainingType] },
  {
    key: 'platformStatus',
    header: (t) => t.columns.platformStatus,
    value: (te, t) => t.platformStatus[te.platformStatus === 'entered' ? 'entered' : 'notEntered'],
  },
  {
    key: 'averageScore',
    header: (t) => t.columns.averageScore,
    value: (te) => {
      const avg = getTeacherAverageScore(te);
      return avg === null ? '' : String(avg);
    },
  },
  {
    key: 'result',
    header: (t) => t.quickList.columnScore,
    value: (te, t) => {
      const overall = getTeacherOverallStats(te);
      return overall.assigned > 0
        ? t.deadlines.resultHintAllModules
            .replace('{passed}', String(overall.passed))
            .replace('{assigned}', String(overall.assigned))
        : '';
    },
  },
  { key: 'fin', header: (t) => t.detail.fields.fin, value: (te) => excelTextLiteral(te.fin) },
  { key: 'phone', header: (t) => t.detail.fields.phone, value: (te) => te.phone },
  { key: 'lmsId', header: (t) => t.detail.fields.lmsId, value: (te) => excelTextLiteral(te.lmsId) },
  { key: 'gradeGroup', header: (t) => t.columns.gradeGroup, value: (te, t) => t.gradeGroup[te.gradeGroup] },
  { key: 'lifecycleStatus', header: (t) => t.columns.lifecycleStatus, value: (te) => te.lifecycleStatus },
  {
    key: 'classesTaught',
    header: (t) => t.detail.fields.classesTaught,
    value: (te, t) => formatAssignedClassesLabel(te, t.gradeGroup),
  },
  { key: 'startYear', header: (t) => t.detail.fields.startYear, value: (te) => te.startYear },
  { key: 'note', header: (t) => t.columns.note, value: (te) => te.note },
];

export function exportTeachersToCsv(
  teachers: Teacher[],
  t: Dict,
  selectedKeys: Set<string>,
  filename = 'teachers.csv',
): void {
  const activeFields = EXPORT_FIELDS.filter((f) => selectedKeys.has(f.key));
  const includeModules = selectedKeys.has('modules');
  const includeModuleColumns = selectedKeys.has('moduleColumns');
  const moduleColumns = includeModuleColumns ? getModuleColumnsForGroups(collectActiveGroups(teachers)) : [];

  const statusLabel = {
    passed: t.moduleStatus.passed,
    failed: t.moduleStatus.failed,
    not_started: t.moduleStatus.notStarted,
  } as const;

  const headers = [
    ...activeFields.map((f) => f.header(t)),
    ...(includeModules ? [t.exportMenu.modulesLabel] : []),
    ...moduleColumns.map((c) => c.label),
  ];

  const rows = teachers.map((teacher) => {
    const cells = activeFields.map((f) => f.value(teacher, t));

    const summaryCell = includeModules
      ? [
          getApplicableModules(teacher)
            .map((m) => {
              const result = teacher.moduleResults.find((r) => r.moduleId === m.id);
              return result ? `${m.shortTitle}: ${statusLabel[result.status]} (${result.score}%)` : '';
            })
            .filter(Boolean)
            .join('; '),
        ]
      : [];

    const moduleCells = includeModuleColumns
      ? moduleColumns.map((col) => {
          const result = findModuleResultForColumn(teacher.moduleResults, col);
          return result ? String(result.score) : '';
        })
      : [];

    return [...cells, ...summaryCell, ...moduleCells];
  });

  downloadCsv(headers, rows, filename);
}

export function exportAnomaliesToCsv(anomalies: IndividualAnomaly[], t: Dict, filename = 'lms-anomalies.csv'): void {
  const headers = [
    t.columns.fullName,
    t.columns.school,
    t.quickList.gradeGroupLabel,
    t.filters.sectorSection,
    t.quickList.columnFormat,
    t.anomalies.flaggedModulesLabel,
  ];

  const rows = anomalies.map(({ teacher, moduleIds }) => [
    teacher.fullName,
    teacher.school,
    t.gradeGroup[teacher.gradeGroup],
    t.language[teacher.language],
    t.trainingType[teacher.trainingType],
    moduleIds.map((id) => getModule(id)?.shortTitle ?? id).join(', '),
  ]);

  downloadCsv(headers, rows, filename);
}
