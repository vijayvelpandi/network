import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ToastProvider } from '@/context/ToastContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { LiveMonitoringPage } from '@/pages/LiveMonitoringPage';
import { TrafficAnalysisPage } from '@/pages/TrafficAnalysisPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { DatasetsPage } from '@/pages/DatasetsPage';
import { MLModelPage } from '@/pages/MLModelPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { getAlerts } from '@/lib/dataStore';
import type { Page } from '@/types';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [alertCount, setAlertCount] = useState(0);

  // Refresh alert count periodically to keep the sidebar badge current
  useEffect(() => {
    const updateCount = () => {
      setAlertCount(getAlerts({ status: 'OPEN' }).length);
    };
    updateCount();
    const interval = setInterval(updateCount, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'live':
        return <LiveMonitoringPage />;
      case 'analysis':
        return <TrafficAnalysisPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'datasets':
        return <DatasetsPage />;
      case 'model':
        return <MLModelPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <ToastProvider>
      <AppLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        alertCount={alertCount}
      >
        {renderPage()}
      </AppLayout>
    </ToastProvider>
  );
}

export default App;
