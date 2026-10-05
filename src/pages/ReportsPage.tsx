import { useMemo, useCallback } from 'react';
import {
  FileBarChart, Download, TrendingUp, Shield, AlertTriangle,
  Bell, Activity, Target,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getReportData } from '@/lib/dataStore';
import { MODEL_METRICS } from '@/lib/mlModel';
import { rowsToCSV, downloadCSV } from '@/lib/csvUtils';
import { useToast } from '@/context/ToastContext';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'];
const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626',
};

export function ReportsPage() {
  const { toast } = useToast();
  const report = useMemo(() => getReportData(), []);
  const metrics = MODEL_METRICS;

  const handleExportReport = useCallback(() => {
    // Build a comprehensive CSV report
    const summaryRows: Record<string, string | number>[] = [
      { metric: 'Total Traffic Analyzed', value: report.stats.totalFlows },
      { metric: 'Normal Traffic', value: report.stats.normalTraffic },
      { metric: 'Suspicious Traffic', value: report.stats.suspiciousTraffic },
      { metric: 'Total Alerts', value: report.stats.alertCount },
      { metric: 'High Severity Alerts', value: report.stats.highSeverityAlerts },
      { metric: 'Detection Rate (%)', value: report.stats.detectionRate },
      { metric: 'Acknowledged Alerts', value: report.acknowledgedAlerts },
      { metric: 'Model Accuracy (%)', value: metrics.accuracy },
      { metric: 'Model Precision (%)', value: metrics.precision },
      { metric: 'Model Recall (%)', value: metrics.recall },
      { metric: 'Model F1 Score (%)', value: metrics.f1Score },
    ];

    // Add category breakdown
    for (const cat of report.categories) {
      summaryRows.push({ metric: `Category: ${cat.name}`, value: cat.value });
    }
    // Add severity breakdown
    for (const sev of report.severities) {
      summaryRows.push({ metric: `Severity: ${sev.severity}`, value: sev.count });
    }

    const csv = rowsToCSV(summaryRows);
    downloadCSV('security_report.csv', csv);
    toast('success', 'Report exported as CSV');
  }, [report, metrics, toast]);

  const summaryCards = [
    { label: 'Total Traffic', value: report.stats.totalFlows, icon: Activity, color: 'text-cyan-glow', bg: 'bg-cyan-glow/10', border: 'border-cyan-glow/20' },
    { label: 'Normal Traffic', value: report.stats.normalTraffic, icon: Shield, color: 'text-status-normal', bg: 'bg-status-normal/10', border: 'border-status-normal/20' },
    { label: 'Suspicious Traffic', value: report.stats.suspiciousTraffic, icon: AlertTriangle, color: 'text-status-critical', bg: 'bg-status-critical/10', border: 'border-status-critical/20' },
    { label: 'Total Alerts', value: report.stats.alertCount, icon: Bell, color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/20' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header + export */}
      <div className="card p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center">
            <FileBarChart className="w-6 h-6 text-cyan-glow" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-lg">Security Analytics Report</h3>
            <p className="text-xs text-slate-500">Comprehensive overview of network traffic and detection metrics</p>
          </div>
        </div>
        <button onClick={handleExportReport} className="btn-primary">
          <Download className="w-4 h-4" /> Export Report as CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className={`w-10 h-10 rounded-lg ${card.bg} border ${card.border} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{card.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detection trends */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-100">Detection Trends</h3>
            <p className="text-xs text-slate-500">Normal vs suspicious traffic over 24 hours</p>
          </div>
          <TrendingUp className="w-5 h-5 text-cyan-glow" />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={report.trafficOverTime}>
            <defs>
              <linearGradient id="repNormal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="repSusp" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotone" dataKey="normal" stroke="#22c55e" strokeWidth={2} fill="url(#repNormal)" name="Normal" />
            <Area type="monotone" dataKey="suspicious" stroke="#ef4444" strokeWidth={2} fill="url(#repSusp)" name="Suspicious" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Attack categories + severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-1">Attack Categories</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution of detected traffic types</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={report.categories}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} angle={-15} textAnchor="end" height={50}
                tickFormatter={(v: string) => v.replace(' Traffic', '').replace('-like', '')}
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: '#1a254040' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {report.categories.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-1">Severity Statistics</h3>
          <p className="text-xs text-slate-500 mb-4">Alert severity breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={report.severities} cx="50%" cy="50%" outerRadius={85} dataKey="count" nameKey="severity" paddingAngle={3}>
                {report.severities.map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.severity]} />
                ))}
              </Pie>
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend formatter={(v: string) => <span className="text-slate-400 text-xs">{v}</span>} verticalAlign="bottom" height={30} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ML performance summary */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-cyan-glow" />
          <h3 className="font-semibold text-slate-100">ML Model Performance</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Accuracy', value: `${metrics.accuracy}%` },
            { label: 'Precision', value: `${metrics.precision}%` },
            { label: 'Recall', value: `${metrics.recall}%` },
            { label: 'F1 Score', value: `${metrics.f1Score}%` },
          ].map((m) => (
            <div key={m.label} className="card p-3 text-center bg-base-900">
              <p className="text-lg font-bold text-cyan-glow">{m.value}</p>
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed table */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-100 mb-4">Summary Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-700">
                <th className="table-header">Metric</th>
                <th className="table-header">Value</th>
              </tr>
            </thead>
            <tbody>
              <ReportRow label="Total Traffic Analyzed" value={report.stats.totalFlows} />
              <ReportRow label="Normal Traffic" value={report.stats.normalTraffic} />
              <ReportRow label="Suspicious Traffic" value={report.stats.suspiciousTraffic} />
              <ReportRow label="Detection Rate" value={`${report.stats.detectionRate}%`} />
              <ReportRow label="Total Alerts" value={report.stats.alertCount} />
              <ReportRow label="High Severity Alerts" value={report.stats.highSeverityAlerts} />
              <ReportRow label="Acknowledged Alerts" value={report.acknowledgedAlerts} />
              {report.categories.map((cat) => (
                <ReportRow key={cat.name} label={`Category: ${cat.name}`} value={cat.value} />
              ))}
              {report.severities.map((sev) => (
                <ReportRow key={sev.severity} label={`Severity: ${sev.severity}`} value={sev.count} />
              ))}
              <ReportRow label="Model Accuracy" value={`${metrics.accuracy}%`} />
              <ReportRow label="Model Precision" value={`${metrics.precision}%`} />
              <ReportRow label="Model Recall" value={`${metrics.recall}%`} />
              <ReportRow label="Model F1 Score" value={`${metrics.f1Score}%`} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string | number }) {
  return (
    <tr className="table-row">
      <td className="table-cell">{label}</td>
      <td className="table-cell font-mono text-cyan-glow">{value}</td>
    </tr>
  );
}
