import type { ReactNode } from 'react';

/**
 * Реальные ФИО, названия школ, FIN и LMS ID — это исходные данные из
 * Google Sheets, а не текст интерфейса. Google Translate (и другие
 * автопереводчики страниц) не должен пытаться "переводить" их при смене
 * языка сайта AZ/RU.
 */
export function NoTranslate({ children }: { children: ReactNode }) {
  return (
    <span className="notranslate" translate="no">
      {children}
    </span>
  );
}
