import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useT } from '../../i18n/useLocaleStore';
import type { Dict } from '../../i18n/translations';

export interface ExportColumnDef {
  key: string;
  label: (t: Dict) => string;
  locked?: boolean;
}

// Полный список столбцов, доступных для выгрузки. "modules" — не
// колонка-на-модуль (их было бы под три десятка, в основном пустых), а
// одна сводная колонка со всеми результатами учителя.
export const EXPORT_COLUMNS: ExportColumnDef[] = [
  { key: 'fullName', label: (t) => t.columns.fullName, locked: true },
  { key: 'school', label: (t) => t.columns.school },
  { key: 'district', label: (t) => t.columns.district },
  { key: 'trainingType', label: (t) => t.columns.trainingType },
  { key: 'sector', label: (t) => t.filters.sectorSection },
  { key: 'platformStatus', label: (t) => t.columns.platformStatus },
  { key: 'averageScore', label: (t) => t.columns.averageScore },
  { key: 'result', label: (t) => t.quickList.columnScore },
  { key: 'modules', label: (t) => t.exportMenu.modulesLabel },
  { key: 'moduleColumns', label: (t) => t.columns.moduleColumns },
  { key: 'fin', label: (t) => t.detail.fields.fin },
  { key: 'phone', label: (t) => t.detail.fields.phone },
  { key: 'email', label: (t) => t.detail.fields.email },
  { key: 'lmsId', label: (t) => t.detail.fields.lmsId },
  { key: 'gradeGroup', label: (t) => t.columns.gradeGroup },
  { key: 'lifecycleStatus', label: (t) => t.columns.lifecycleStatus },
  { key: 'classesTaught', label: (t) => t.detail.fields.classesTaught },
  { key: 'startYear', label: (t) => t.detail.fields.startYear },
  { key: 'note', label: (t) => t.columns.note },
];

const LOCKED_KEYS = EXPORT_COLUMNS.filter((c) => c.locked).map((c) => c.key);

interface ExportMenuProps {
  buttonLabel: string;
  disabled?: boolean;
  /** Столбцы, отмеченные по умолчанию при открытии окна — обычно текущие видимые столбцы таблицы */
  defaultCheckedKeys: Set<string>;
  onExport: (selectedKeys: Set<string>) => void;
}

export function ExportMenu({ buttonLabel, disabled, defaultCheckedKeys, onExport }: ExportMenuProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(defaultCheckedKeys));

  // Каждый раз при открытии окна заново подставляем актуальные видимые
  // столбцы таблицы — а не только один раз при первом монтировании.
  useEffect(() => {
    if (open) setChecked(new Set(defaultCheckedKeys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setChecked(new Set(EXPORT_COLUMNS.map((c) => c.key)));
  }

  function clearAll() {
    setChecked(new Set(LOCKED_KEYS));
  }

  function handleDownload() {
    onExport(checked);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-700"
      >
        <Download size={16} />
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{t.exportMenu.title}</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label={t.common.close}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-2.5">
              <button onClick={selectAll} className="text-xs font-medium text-brand-600 hover:underline">
                {t.exportMenu.selectAll}
              </button>
              <span className="text-slate-300">·</span>
              <button onClick={clearAll} className="text-xs font-medium text-brand-600 hover:underline">
                {t.exportMenu.clearAll}
              </button>
            </div>

            <div className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
              {EXPORT_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 ${
                    col.locked ? 'opacity-60' : 'cursor-pointer hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked.has(col.key)}
                    disabled={col.locked}
                    onChange={() => toggle(col.key)}
                    className="accent-brand-600"
                  />
                  {col.label(t)}
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleDownload}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {t.exportMenu.download}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
