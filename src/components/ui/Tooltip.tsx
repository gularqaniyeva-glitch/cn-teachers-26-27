import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
}

/** Значок "ⓘ" с всплывающей подсказкой при наведении/фокусе */
export function Tooltip({ text }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        tabIndex={0}
        className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-brand-600 focus:outline-none"
        aria-label={text}
      >
        <Info size={14} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-800" />
      </span>
    </span>
  );
}
