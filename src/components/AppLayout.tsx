import { useState, type ReactNode } from 'react';
import { Menu, Activity, Wifi } from 'lucide-react';
import type { Page } from '@/types';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  alertCount: number;
  children: ReactNode;
}

const pageTitles: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Security Dashboard', subtitle: 'Network traffic overview and threat metrics' },
  live: { title: 'Live Monitoring', subtitle: 'Real-time network flow simulation' },
  analysis: { title: 'Traffic Analysis', subtitle: 'Upload and classify network flow data' },
  alerts: { title: 'Alert Management', subtitle: 'View, filter, and manage security alerts' },
  datasets: { title: 'Dataset Management', subtitle: 'Upload, inspect, and preprocess datasets' },
  model: { title: 'ML Model Performance', subtitle: 'Classifier metrics and evaluation' },
  reports: { title: 'Reports', subtitle: 'Security analytics and exportable reports' },
  settings: { title: 'Settings', subtitle: 'Application configuration' },
};

export function AppLayout({ currentPage, onNavigate, alertCount, children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { title, subtitle } = pageTitles[currentPage];

  return (
    <div className="flex h-screen overflow-hidden bg-base-950">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        alertCount={alertCount}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-base-900 border-b border-base-700 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-2 rounded-lg hover:bg-base-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4 text-status-normal" />
              <span className="text-slate-400">Connected</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-cyan-glow" />
              <span className="text-slate-400">RF Model: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center">
                <span className="text-xs font-bold text-cyan-glow">SOC</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
