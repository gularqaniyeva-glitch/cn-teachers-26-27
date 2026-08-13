import { useLocaleStore } from '../../i18n/useLocaleStore';

export function LanguageSwitcher() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-sm font-medium">
      {(['az', 'ru'] as const).map((code) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`rounded-md px-2.5 py-1 uppercase transition-colors ${
            locale === code ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
