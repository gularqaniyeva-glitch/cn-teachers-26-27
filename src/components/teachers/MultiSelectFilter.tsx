import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useT } from '../../i18n/useLocaleStore';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Показывать строку поиска внутри списка — имеет смысл при длинном списке значений */
  searchable?: boolean;
}

// Единый компонент множественного выбора для панели фильтров — используется
// одинаково для Tabeçilik, Года начала/стажа, Классов и Статуса прохождения
// на всех вкладках (2–9 классы, 10–11 классы, Отчёт по модулю), чтобы вести
// себя предсказуемо и одинаково независимо от того, где он отрисован.
export function MultiSelectFilter({ label, options, selected, onChange, searchable = true }: MultiSelectFilterProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, query]);

  const labelByValue = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);

  function toggleValue(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  function selectAll() {
    const visibleValues = filteredOptions.map((o) => o.value);
    onChange(Array.from(new Set([...selected, ...visibleValues])));
  }

  function clearSelection() {
    // Сбрасывает только то, что сейчас видно (при активном поиске) — либо весь фильтр целиком, если поиск пуст.
    if (query.trim()) {
      const visibleValues = new Set(filteredOptions.map((o) => o.value));
      onChange(selected.filter((v) => !visibleValues.has(v)));
    } else {
      onChange([]);
    }
  }

  const summary =
    selected.length === 0
      ? t.filters.multiSelectAny
      : selected.length <= 2
        ? selected.map((v) => labelByValue.get(v) ?? v).join(', ')
        : `${selected.length} ${t.filters.multiSelectCountSuffix}`;

  return (
    <div className="relative" ref={ref}>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        {label}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-[180px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <span className="truncate">{summary}</span>
          <ChevronDown size={14} className="shrink-0 text-slate-400" />
        </button>
      </label>

      {open && (
        <div className="absolute z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {searchable && options.length > 6 && (
            <div className="relative mb-2">
              <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.common.search}
                className="w-full rounded-md border border-slate-200 py-1 pl-7 pr-2 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-100"
              />
            </div>
          )}

          <div className="mb-1.5 flex items-center gap-2 text-xs">
            <button type="button" onClick={selectAll} className="font-medium text-brand-600 hover:underline">
              {t.filters.selectAll}
            </button>
            <span className="text-slate-300">·</span>
            <button type="button" onClick={clearSelection} className="font-medium text-slate-500 hover:underline">
              {t.filters.clearSelection}
            </button>
          </div>

          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {filteredOptions.length === 0 && (
              <p className="px-1 py-2 text-center text-xs text-slate-400">{t.quickList.empty}</p>
            )}
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                  className="accent-brand-600"
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
