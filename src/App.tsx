import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TeachersPage } from './pages/TeachersPage';
import { SeniorGradesPage } from './pages/SeniorGradesPage';
import { TeacherDetailPage } from './pages/TeacherDetailPage';
import { StatisticsPage } from './pages/StatisticsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/senior" element={<SeniorGradesPage />} />
        <Route path="/teachers/:id" element={<TeacherDetailPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
      </Route>
    </Routes>
  );
}
