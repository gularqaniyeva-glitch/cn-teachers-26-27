import type { Teacher } from '../../types/teacher';
import { Badge } from '../ui/Badge';
import { getApplicableModules } from '../../utils/stats';

interface ModuleResultsPanelProps {
  teacher: Teacher;
}

export function ModuleResultsPanel({ teacher }: ModuleResultsPanelProps) {
  const modules = getApplicableModules(teacher);

  return (
    <div className="divide-y divide-slate-100">
      {modules.map((module) => {
        const result = teacher.moduleResults.find((r) => r.moduleId === module.id);
        return (
          <div key={module.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{module.title}</p>
              <p className="text-xs text-slate-400">{module.id}</p>
            </div>
            <div className="flex items-center gap-3">
              {result ? (
                <>
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${result.score}%`,
                        backgroundColor: result.passed ? '#059669' : '#e11d48',
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-slate-600">{result.score}%</span>
                  <Badge variant={result.passed ? 'success' : 'danger'} dot>
                    {result.passed ? 'Прошёл' : 'Не прошёл'}
                  </Badge>
                </>
              ) : (
                <Badge variant="neutral">Нет данных</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
