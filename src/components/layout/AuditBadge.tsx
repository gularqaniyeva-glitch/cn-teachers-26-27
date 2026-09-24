import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useT } from '../../i18n/useLocaleStore';

/**
 * Компактный значок "⚠️ Аудит данных" в шапке сайта — виден, только если
 * система авто-аудита (utils/dataAudit.ts) нашла расхождения при последней
 * загрузке данных. Ничего не блокирует: сайт работает как обычно, значок —
 * просто предупреждение с деталями по клику.
 */
export function AuditBadge() {
  const { auditIssues } = useTeacherStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (auditIssues.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex animate-pulse items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
        aria-label={`${t.audit.badgeLabel} — ${auditIssues.length}`}
      >
        <AlertTriangle size={14} />
        {t.audit.badgeLabel} ({auditIssues.length})
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-80 max-w-[85vw] rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.audit.panelTitle}</p>
          <ul className="space-y-2">
            {auditIssues.map((issue) => (
              <li key={issue.id} className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-snug text-amber-900">
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
