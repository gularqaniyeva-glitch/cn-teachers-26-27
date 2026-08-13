import type { ReactNode } from 'react';
import { Tooltip } from './Tooltip';

interface CardProps {
  title?: string;
  titleTooltip?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, titleTooltip, action, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            {title}
            {titleTooltip && <Tooltip text={titleTooltip} />}
          </h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
