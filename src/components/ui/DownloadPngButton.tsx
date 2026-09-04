import { useState, type RefObject } from 'react';
import { Copy, Download } from 'lucide-react';
import { useT } from '../../i18n/useLocaleStore';

interface DownloadPngButtonProps {
  targetRef: RefObject<HTMLElement>;
  filename: string;
}

// html2canvas-pro (не обычный html2canvas — тот не умеет парсить
// современные CSS-функции цвета oklch()/lab(), на которых построена вся
// палитра Tailwind v4 в этом проекте, и падает с ошибкой при любом
// экспорте) — тяжёлая библиотека, нужна только в момент клика на экспорт,
// поэтому грузим её динамическим import() отдельным чанком (тот же приём,
// что и для recharts на странице "Статистика"), а не в общем бандле.
//
// useCORS/allowTaint — на случай внешних изображений внутри карточки (сейчас
// таких нет, но не помешает на будущее); backgroundColor — иначе прозрачный
// фон карточки превращается в чёрный при просмотре PNG вне браузера.
async function captureElement(el: HTMLElement) {
  const { default: html2canvas } = await import('html2canvas-pro');
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  });
}

export function DownloadPngButton({ targetRef, filename }: DownloadPngButtonProps) {
  const t = useT();
  const [busyAction, setBusyAction] = useState<'download' | 'copy' | null>(null);

  async function handleDownload() {
    if (!targetRef.current || busyAction) return;
    setBusyAction('download');
    try {
      const canvas = await captureElement(targetRef.current);
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
      setBusyAction(null);
    }
  }

  async function handleCopy() {
    if (!targetRef.current || busyAction) return;
    setBusyAction('copy');
    try {
      const canvas = await captureElement(targetRef.current);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('canvas.toBlob вернул null');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch (err) {
      console.warn('Не удалось скопировать карточку как картинку:', err);
      window.alert(t.statistics.copyImageError);
    } finally {
      setBusyAction(null);
    }
  }

  const buttonClass =
    'flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60';

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={handleDownload} disabled={busyAction !== null} className={buttonClass}>
        <Download size={13} />
        {busyAction === 'download' ? t.common.loading : t.statistics.downloadPng}
      </button>
      <button type="button" onClick={handleCopy} disabled={busyAction !== null} className={buttonClass}>
        <Copy size={13} />
        {busyAction === 'copy' ? t.common.loading : t.statistics.copyImage}
      </button>
    </div>
  );
}
