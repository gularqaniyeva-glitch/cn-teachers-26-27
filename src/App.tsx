import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TeachersPage } from './pages/TeachersPage';
import { SeniorGradesPage } from './pages/SeniorGradesPage';
import { TeacherDetailPage } from './pages/TeacherDetailPage';
import { useT } from './i18n/useLocaleStore';
import { initAnalytics } from './utils/analytics';

// Статистика тянет за собой recharts (тяжёлая библиотека графиков) — грузим
// её отдельным чанком, только когда пользователь реально открывает эту
// страницу, а не при первой загрузке сайта.
const StatisticsPage = lazy(() => import('./pages/StatisticsPage').then((m) => ({ default: m.StatisticsPage })));

export default function App() {
  const t = useT();

  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/senior" element={<SeniorGradesPage />} />
        <Route path="/teachers/:id" element={<TeacherDetailPage />} />
        <Route
          path="/statistics"
          element={
            <Suspense fallback={<p className="text-slate-500">{t.common.loading}</p>}>
              <StatisticsPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
