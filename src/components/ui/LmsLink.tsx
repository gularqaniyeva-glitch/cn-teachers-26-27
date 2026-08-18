import type { MouseEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { getLmsProfileUrl } from '../../utils/lms';
import { NoTranslate } from './NoTranslate';

interface LmsLinkProps {
  lmsId: string;
  /** 'inline' — синий LMS ID со значком ссылки (для таблиц), 'button' — кнопка "Перейти в LMS ↗" (для карточки) */
  variant?: 'inline' | 'button';
  /** Текст кнопки — обязателен для variant="button" */
  label?: string;
}

// Строки таблиц открывают карточку учителя по клику — ссылка внутри ячейки
// не должна ещё и триггерить этот клик, поэтому stopPropagation.
function stopRowClick(e: MouseEvent) {
  e.stopPropagation();
}

export function LmsLink({ lmsId, variant = 'inline', label }: LmsLinkProps) {
  if (!lmsId) return <span className="text-slate-400">-</span>;

  const href = getLmsProfileUrl(lmsId);

  if (variant === 'button') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stopRowClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
      >
        {label}
        <ExternalLink size={13} />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={stopRowClick}
      className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
    >
      <NoTranslate>{lmsId}</NoTranslate>
      <ExternalLink size={12} />
    </a>
  );
}
