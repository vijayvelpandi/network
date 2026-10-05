import { type ReactNode } from 'react';
import {
  LayoutDashboard,
  Radio,
  FileSearch,
  Bell,
  Database,
  BrainCircuit,
  FileBarChart,
  Settings,
  ShieldCheck,
  CircleDot,
} from 'lucide-react';
import type { Page } from '@/types';

interface NavItem {
  id: Page;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  alertCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onNavigate, alertCount, collapsed }: SidebarProps) {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Radio },
    { id: 'analysis', label: 'Traffic Analysis', icon: FileSearch },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'model', label: 'ML Model', icon: BrainCircuit },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-base-900 border-r border-base-700 flex flex-col transition-all duration-200 flex-shrink-0`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-base-700">
        <div className="w-9 h-9 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-cyan-glow" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-slate-100 text-sm whitespace-nowrap">NetGuard IDS</h1>
            <p className="text-[10px] text-slate-500 whitespace-nowrap">Intrusion Detection</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-base-800'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-glow rounded-r-full" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-status-critical/20 text-status-critical text-xs px-2 py-0.5 rounded-full border border-status-critical/30">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-critical rounded-full animate-pulseGlow" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Status footer */}
      <div className="px-2 py-3 border-t border-base-700">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-850">
          <CircleDot className="w-4 h-4 text-status-normal flex-shrink-0 animate-pulseGlow" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs text-slate-300 whitespace-nowrap">System Active</p>
              <p className="text-[10px] text-slate-500 whitespace-nowrap">SIMULATION MODE</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
