import { useState, useMemo, useCallback } from 'react';
import {
  Bell, Search, X, Check, CheckCheck, Eye, Filter, ChevronUp, ChevronDown,
} from 'lucide-react';
import { getAlerts, updateAlertStatus, type AlertQuery } from '@/lib/dataStore';
import { formatTimestamp, timeAgo } from '@/lib/format';
import {
  SeverityBadge, StatusBadge, DetectionTypeBadge, EmptyState,
} from '@/components/ui/Badges';
import { useToast } from '@/context/ToastContext';
import type { Alert, AlertStatus, Severity } from '@/types';

export function AlertsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [detectionFilter, setDetectionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity' | 'confidence'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const query: AlertQuery = useMemo(() => ({
    search,
    severity: severityFilter,
    status: statusFilter,
    detectionType: detectionFilter,
    sortBy,
    sortOrder,
  }), [search, severityFilter, statusFilter, detectionFilter, sortBy, sortOrder]);

  const alerts = useMemo(() => getAlerts(query), [query, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleAcknowledge = useCallback((id: string) => {
    updateAlertStatus(id, 'ACKNOWLEDGED');
    toast('success', 'Alert acknowledged');
    refresh();
    if (selectedAlert?.id === id) {
      setSelectedAlert(getAlerts({}).find((a) => a.id === id) ?? null);
    }
  }, [toast, refresh, selectedAlert]);

  const handleResolve = useCallback((id: string) => {
    updateAlertStatus(id, 'RESOLVED');
    toast('success', 'Alert resolved');
    refresh();
    if (selectedAlert?.id === id) {
      setSelectedAlert(getAlerts({}).find((a) => a.id === id) ?? null);
    }
  }, [toast, refresh, selectedAlert]);

  const toggleSort = (field: 'timestamp' | 'severity' | 'confidence') => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'timestamp' | 'severity' | 'confidence' }) => {
    if (sortBy !== field) return <span className="inline-block w-3" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 inline" />
      : <ChevronDown className="w-3 h-3 inline" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by IP, type, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9"
            />
          </div>

          {/* Severity filter */}
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="input">
            <option value="ALL">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Status filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Detection type filter */}
          <select value={detectionFilter} onChange={(e) => setDetectionFilter(e.target.value)} className="input">
            <option value="ALL">All Types</option>
            <option value="Port Scan">Port Scan</option>
            <option value="DoS-like Traffic">DoS-like</option>
            <option value="Brute Force">Brute Force</option>
            <option value="Other Suspicious Traffic">Other Suspicious</option>
          </select>

          <div className="flex items-center gap-2 text-sm text-slate-400 ml-auto">
            <Filter className="w-4 h-4" />
            <span>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Alerts table */}
      <div className="card p-0 overflow-hidden">
        {alerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No alerts found"
            message="Try adjusting your filters or run the live monitoring simulation to generate alerts."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-base-700 bg-base-900">
                  <th className="table-header">Alert ID</th>
                  <th className="table-header cursor-pointer select-none" onClick={() => toggleSort('timestamp')}>
                    Timestamp <SortIcon field="timestamp" />
                  </th>
                  <th className="table-header">Source IP</th>
                  <th className="table-header">Dest IP:Port</th>
                  <th className="table-header">Protocol</th>
                  <th className="table-header">Detection</th>
                  <th className="table-header cursor-pointer select-none" onClick={() => toggleSort('severity')}>
                    Severity <SortIcon field="severity" />
                  </th>
                  <th className="table-header cursor-pointer select-none" onClick={() => toggleSort('confidence')}>
                    Conf. <SortIcon field="confidence" />
                  </th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="table-row">
                    <td className="table-cell font-mono text-xs text-cyan-glow">{alert.id}</td>
                    <td className="table-cell text-xs text-slate-400" title={formatTimestamp(alert.timestamp)}>
                      {timeAgo(alert.timestamp)}
                    </td>
                    <td className="table-cell font-mono text-xs">{alert.source_ip}</td>
                    <td className="table-cell font-mono text-xs">{alert.destination_ip}:{alert.destination_port}</td>
                    <td className="table-cell text-xs">{alert.protocol}</td>
                    <td className="table-cell"><DetectionTypeBadge type={alert.detection_type} /></td>
                    <td className="table-cell"><SeverityBadge severity={alert.severity} /></td>
                    <td className="table-cell text-xs">{alert.confidence}%</td>
                    <td className="table-cell"><StatusBadge status={alert.status} /></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="p-1.5 rounded hover:bg-base-700 text-slate-400 hover:text-cyan-glow transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {alert.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="p-1.5 rounded hover:bg-base-700 text-slate-400 hover:text-status-warning transition-colors"
                            title="Acknowledge"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {alert.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="p-1.5 rounded hover:bg-base-700 text-slate-400 hover:text-status-normal transition-colors"
                            title="Resolve"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert detail modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={() => handleAcknowledge(selectedAlert.id)}
          onResolve={() => handleResolve(selectedAlert.id)}
        />
      )}
    </div>
  );
}

function AlertDetailModal({
  alert, onClose, onAcknowledge, onResolve,
}: {
  alert: Alert;
  onClose: () => void;
  onAcknowledge: () => void;
  onResolve: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn" onClick={onClose}>
      <div
        className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                ? 'bg-status-critical/10 border border-status-critical/30'
                : alert.severity === 'MEDIUM'
                ? 'bg-status-warning/10 border border-status-warning/30'
                : 'bg-status-info/10 border border-status-info/30'
            }`}>
              <Bell className={`w-6 h-6 ${
                alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'text-status-critical' :
                alert.severity === 'MEDIUM' ? 'text-status-warning' : 'text-status-info'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{alert.detection_type}</h2>
              <p className="text-xs text-slate-500 font-mono">{alert.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-base-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-6">
          <SeverityBadge severity={alert.severity} />
          <StatusBadge status={alert.status} />
          <DetectionTypeBadge type={alert.detection_type} />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <DetailField label="Timestamp" value={formatTimestamp(alert.timestamp)} />
          <DetailField label="Confidence" value={`${alert.confidence}%`} />
          <DetailField label="Source IP" value={alert.source_ip} mono />
          <DetailField label="Destination IP" value={alert.destination_ip} mono />
          <DetailField label="Source Port" value={String(alert.source_port)} mono />
          <DetailField label="Destination Port" value={String(alert.destination_port)} mono />
          <DetailField label="Protocol" value={alert.protocol} />
          <DetailField label="Status" value={alert.status} />
        </div>

        {/* Confidence bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Confidence Score</span>
            <span className="text-xs text-slate-300 font-medium">{alert.confidence}%</span>
          </div>
          <div className="h-2 bg-base-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                alert.confidence >= 85 ? 'bg-status-critical' :
                alert.confidence >= 70 ? 'bg-status-warning' : 'bg-status-info'
              }`}
              style={{ width: `${alert.confidence}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-base-700">
          {alert.status === 'OPEN' && (
            <button onClick={onAcknowledge} className="btn-secondary">
              <Check className="w-4 h-4" /> Acknowledge
            </button>
          )}
          {alert.status !== 'RESOLVED' && (
            <button onClick={onResolve} className="btn-success">
              <CheckCheck className="w-4 h-4" /> Resolve
            </button>
          )}
          <button onClick={onClose} className="btn-secondary ml-auto">Close</button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="card p-3 bg-base-900">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
