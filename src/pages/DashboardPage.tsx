import { useMemo } from 'react';
import {
  Activity, Shield, AlertTriangle, Bell, TrendingUp, Gauge,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import {
  getDashboardStats, getTrafficOverTime, getCategoryDistribution,
  getProtocolDistribution, getSeverityDistribution, getRecentFlows, getRecentAlerts,
} from '@/lib/dataStore';
import { formatNumber, formatTime } from '@/lib/format';
import {
  SeverityBadge, PredictionBadge, DetectionTypeBadge,
} from '@/components/ui/Badges';
import type { Page } from '@/types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'];
const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626',
};
const PROTOCOL_COLORS = ['#22d3ee', '#3b82f6', '#a855f7'];

export function DashboardPage({ onNavigate }: DashboardProps) {
  const stats = useMemo(() => getDashboardStats(), []);
  const trafficData = useMemo(() => getTrafficOverTime(6), []);
  const categoryData = useMemo(() => getCategoryDistribution(), []);
  const protocolData = useMemo(() => getProtocolDistribution(), []);
  const severityData = useMemo(() => getSeverityDistribution(), []);
  const recentFlows = useMemo(() => getRecentFlows(8), []);
  const recentAlerts = useMemo(() => getRecentAlerts(5), []);

  const statCards = [
    {
      label: 'Total Flows', value: stats.totalFlows, icon: Activity,
      color: 'text-cyan-glow', bg: 'bg-cyan-glow/10', border: 'border-cyan-glow/20',
      trend: '+12%', trendUp: true,
    },
    {
      label: 'Normal Traffic', value: stats.normalTraffic, icon: Shield,
      color: 'text-status-normal', bg: 'bg-status-normal/10', border: 'border-status-normal/20',
      trend: '+8%', trendUp: true,
    },
    {
      label: 'Suspicious Traffic', value: stats.suspiciousTraffic, icon: AlertTriangle,
      color: 'text-status-critical', bg: 'bg-status-critical/10', border: 'border-status-critical/20',
      trend: '-3%', trendUp: false,
    },
    {
      label: 'Total Alerts', value: stats.alertCount, icon: Bell,
      color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/20',
      trend: '+5%', trendUp: true,
    },
    {
      label: 'High Severity', value: stats.highSeverityAlerts, icon: AlertTriangle,
      color: 'text-status-critical', bg: 'bg-status-critical/10', border: 'border-status-critical/20',
      trend: '+2%', trendUp: true,
    },
    {
      label: 'Detection Rate', value: `${stats.detectionRate}%`, icon: Gauge,
      color: 'text-cyan-glow', bg: 'bg-cyan-glow/10', border: 'border-cyan-glow/20',
      trend: 'stable', trendUp: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card card-hover">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg ${card.bg} border ${card.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                {card.trend !== 'stable' && (
                  <span className={`text-xs flex items-center gap-0.5 ${card.trendUp ? 'text-status-normal' : 'text-status-critical'}`}>
                    {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.trend}
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{card.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic over time */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-100">Traffic Over Time</h3>
              <p className="text-xs text-slate-500">Last 6 hours · 15-min intervals</p>
            </div>
            <TrendingUp className="w-5 h-5 text-cyan-glow" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="suspGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="normal" stroke="#22c55e" strokeWidth={2} fill="url(#normalGrad)" name="Normal" />
              <Area type="monotone" dataKey="suspicious" stroke="#ef4444" strokeWidth={2} fill="url(#suspGrad)" name="Suspicious" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Normal vs Suspicious pie */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-100">Traffic Distribution</h3>
              <p className="text-xs text-slate-500">Normal vs Suspicious</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Normal', value: stats.normalTraffic },
                  { name: 'Suspicious', value: stats.suspiciousTraffic },
                ]}
                cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                paddingAngle={3} dataKey="value"
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend
                formatter={(value: string) => <span className="text-slate-400 text-xs">{value}</span>}
                verticalAlign="bottom" height={30}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attack categories */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-1">Attack Category Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Detection type breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} width={100}
                tickFormatter={(v: string) => v.replace(' Traffic', '').replace('-like', '')}
              />
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: '#1a254040' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Protocol distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-1">Protocol Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">TCP / UDP / ICMP</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={protocolData} cx="50%" cy="50%" outerRadius={85}
                dataKey="value" nameKey="name" paddingAngle={3}
              >
                {protocolData.map((_, i) => (
                  <Cell key={i} fill={PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]} />
                ))}
              </Pie>
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend formatter={(v: string) => <span className="text-slate-400 text-xs">{v}</span>} verticalAlign="bottom" height={30} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-1">Severity Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Alert severity breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="severity" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: '#1a254040' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.severity]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent flows */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Recent Network Flows</h3>
            <button onClick={() => onNavigate('analysis')} className="text-xs text-cyan-glow hover:underline">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-base-700">
                  <th className="table-header">Time</th>
                  <th className="table-header">Source IP</th>
                  <th className="table-header">Dst Port</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Label</th>
                </tr>
              </thead>
              <tbody>
                {recentFlows.map((flow) => (
                  <tr key={flow.id} className="table-row">
                    <td className="table-cell font-mono text-xs">{formatTime(flow.timestamp)}</td>
                    <td className="table-cell font-mono text-xs">{flow.source_ip}</td>
                    <td className="table-cell font-mono text-xs">{flow.destination_port}</td>
                    <td className="table-cell"><DetectionTypeBadge type={flow.detection_type} /></td>
                    <td className="table-cell"><PredictionBadge label={flow.label} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Recent Security Alerts</h3>
            <button onClick={() => onNavigate('alerts')} className="text-xs text-cyan-glow hover:underline">
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No alerts detected</p>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-base-900 border border-base-700/50 hover:border-base-600 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    alert.severity === 'CRITICAL' ? 'bg-status-critical' :
                    alert.severity === 'HIGH' ? 'bg-status-critical' :
                    alert.severity === 'MEDIUM' ? 'bg-status-warning' :
                    'bg-status-info'
                  } animate-pulseGlow`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{alert.detection_type}</p>
                    <p className="text-xs text-slate-500 font-mono">{alert.source_ip} → {alert.destination_ip}:{alert.destination_port}</p>
                  </div>
                  <SeverityBadge severity={alert.severity} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
