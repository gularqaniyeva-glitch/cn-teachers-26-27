import { useState, type RefObject } from 'react';
import { Download } from 'lucide-react';
import { useT } from '../../i18n/useLocaleStore';

interface DownloadPngButtonProps {
  targetRef: RefObject<HTMLElement>;
  filename: string;
  label?: string;
}

// html2canvas-pro (не обычный html2canvas — тот не умеет парсить
// современные CSS-функции цвета oklch()/lab(), на которых построена вся
// палитра Tailwind v4 в этом проекте, и падает с ошибкой при любом
// экспорте) — тяжёлая библиотека, нужна только в момент клика на экспорт,
// поэтому грузим её динамическим import() отдельным чанком (тот же приём,
// что и для recharts на странице "Статистика"), а не в общем бандле.
export function DownloadPngButton({ targetRef, filename, label }: DownloadPngButtonProps) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!targetRef.current || busy) return;
    setBusy(true);
    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Не удалось сохранить карточку как PNG:', err);
      window.alert(t.statistics.downloadPngError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
    >
      <Download size={13} />
      {busy ? t.common.loading : (label ?? t.statistics.downloadPng)}
    </button>
  );
}
