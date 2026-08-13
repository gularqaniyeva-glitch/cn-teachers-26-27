import { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { useT } from '../../i18n/useLocaleStore';

interface NotesPanelProps {
  note: string;
  onSave: (note: string) => Promise<void>;
}

export function NotesPanel({ note, onSave }: NotesPanelProps) {
  const t = useT();
  const [value, setValue] = useState(note);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = value !== note;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder={t.detail.notePlaceholder}
        className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-700"
        >
          <Save size={14} />
          {t.common.saveNote}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check size={14} /> {t.common.saved}
          </span>
        )}
      </div>
    </div>
  );
}
