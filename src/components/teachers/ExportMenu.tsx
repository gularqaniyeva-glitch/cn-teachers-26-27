import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { useT } from '../../i18n/useLocaleStore';
import type { Dict } from '../../i18n/translations';

export interface ExportColumnDef {
  key: string;
  label: (t: Dict) => string;
  defaultChecked: boolean;
  locked?: boolean;
}

// Стандартный набор, который выгружается, если пользователь ничего не
// менял — остальные поля (FIN, телефон, LMS ID, классы и т.д.) доступны
// по чекбоксу, но по умолчанию выключены, чтобы не раздувать файл
// служебными столбцами исходной таблицы.
export const EXPORT_COLUMNS: ExportColumnDef[] = [
  { key: 'fullName', label: (t) => t.columns.fullName, defaultChecked: true, locked: true },
  { key: 'school', label: (t) => t.columns.school, defaultChecked: true },
  { key: 'district', label: (t) => t.columns.district, defaultChecked: true },
  { key: 'trainingType', label: (t) => t.columns.trainingType, defaultChecked: true },
  { key: 'sector', label: (t) => t.filters.sectorSection, defaultChecked: true },
  { key: 'platformStatus', label: (t) => t.columns.platformStatus, defaultChecked: true },
  { key: 'result', label: (t) => t.columns.result, defaultChecked: true },
  { key: 'modules', label: (t) => t.exportMenu.modulesLabel, defaultChecked: true },
  { key: 'fin', label: (t) => t.detail.fields.fin, defaultChecked: false },
  { key: 'phone', label: (t) => t.detail.fields.phone, defaultChecked: false },
  { key: 'lmsId', label: (t) => t.detail.fields.lmsId, defaultChecked: false },
  { key: 'gradeGroup', label: (t) => t.columns.gradeGroup, defaultChecked: false },
  { key: 'lifecycleStatus', label: (t) => t.columns.lifecycleStatus, defaultChecked: false },
  { key: 'classesTaught', label: (t) => t.detail.fields.classesTaught, defaultChecked: false },
  { key: 'note', label: (t) => t.columns.note, defaultChecked: false },
];

interface ExportMenuProps {
  buttonLabel: string;
  disabled?: boolean;
  onExport: (selectedKeys: Set<string>) => void;
}

export function ExportMenu({ buttonLabel, disabled, onExport }: ExportMenuProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(EXPORT_COLUMNS.filter((c) => c.defaultChecked).map((c) => c.key)),
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-700"
      >
        <Download size={16} />
        {buttonLabel}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-1.5 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.exportMenu.title}
          </p>
          <div className="max-h-64 overflow-y-auto">
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
          <button
            onClick={() => {
              onExport(checked);
              setOpen(false);
            }}
            className="mt-2 w-full rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {t.exportMenu.download}
          </button>
        </div>
      )}
    </div>
  );
}
