import { useState } from 'react';
import { AIAssistant } from './pages/AIAssistant/AIAssistant';
import { Campaigns } from './pages/Campaigns/Campaigns';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Reports } from './pages/Reports/Reports';

type Page = 'dashboard' | 'campaigns' | 'reports' | 'ai';

export function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <>
      <nav className="top-nav">
        <div className="brand">Ads Intelligence</div>
        <div className="nav-actions">
          <button className={page === 'dashboard' ? 'active' : ''} type="button" onClick={() => setPage('dashboard')}>
            Dashboard
          </button>
          <button className={page === 'campaigns' ? 'active' : ''} type="button" onClick={() => setPage('campaigns')}>
            Campaigns
          </button>
          <button className={page === 'reports' ? 'active' : ''} type="button" onClick={() => setPage('reports')}>
            Reports
          </button>
          <button className={page === 'ai' ? 'active' : ''} type="button" onClick={() => setPage('ai')}>
            AI Assistant
          </button>
        </div>
      </nav>
      {page === 'dashboard' && <Dashboard />}
      {page === 'campaigns' && <Campaigns />}
      {page === 'reports' && <Reports />}
      {page === 'ai' && <AIAssistant />}
    </>
  );
}
