import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import { applyDebugFlagFromUrl, isAnalyticsDisabled } from './utils/analytics';
import './index.css';

// Синхронно, до первого рендера — иначе <Analytics/> успеет отправить
// первый page view раньше, чем ?debug=true превратится в постоянный флаг.
applyDebugFlagFromUrl();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* beforeSend режет и автоматические просмотры страниц, не только
        наши кастомные события — иначе флаг ignore_analytics/?debug=true
        глушил бы только события, но не сами page view. */}
    <Analytics beforeSend={(event) => (isAnalyticsDisabled() ? null : event)} />
  </StrictMode>,
);
