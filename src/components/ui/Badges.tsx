import type { ReactNode } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import type { Severity, AlertStatus, PredictionLabel, DetectionType } from '@/types';

// --- Severity Badge ---
const severityStyles: Record<Severity, string> = {
  LOW: 'badge-info',
  MEDIUM: 'badge-warning',
  HIGH: 'badge-critical',
  CRITICAL: 'badge-critical',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cls = severityStyles[severity];
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        severity === 'CRITICAL' ? 'bg-status-critical' :
        severity === 'HIGH' ? 'bg-status-critical' :
        severity === 'MEDIUM' ? 'bg-status-warning' :
        'bg-status-info'
      } animate-pulseGlow`} />
      {severity}
    </span>
  );
}

// --- Status Badge ---
const statusStyles: Record<AlertStatus, string> = {
  OPEN: 'badge-critical',
  ACKNOWLEDGED: 'badge-warning',
  RESOLVED: 'badge-normal',
};

export function StatusBadge({ status }: { status: AlertStatus }) {
  return <span className={statusStyles[status]}>{status}</span>;
}

// --- Prediction Label Badge ---
export function PredictionBadge({ label }: { label: PredictionLabel }) {
  return label === 'NORMAL' ? (
    <span className="badge-normal">NORMAL</span>
  ) : (
    <span className="badge-critical">SUSPICIOUS</span>
  );
}

// --- Detection Type Badge ---
export function DetectionTypeBadge({ type }: { type: DetectionType }) {
  const isNormal = type === 'Normal Traffic';
  const cls = isNormal ? 'badge-normal' : 'badge-warning';
  return <span className={cls}>{type}</span>;
}

// --- Loading State ---
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-cyan-glow animate-spin" />
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}

// --- Empty State ---
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No data available',
  message,
  action,
}: {
  icon?: typeof Inbox;
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-base-800 border border-base-700 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-slate-300 font-medium mb-1">{title}</h3>
      {message && <p className="text-sm text-slate-500 max-w-sm mb-4">{message}</p>}
      {action}
    </div>
  );
}

// --- Error State ---
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="card border-status-critical/30 bg-status-critical/5 p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-status-critical/10 flex items-center justify-center flex-shrink-0">
        <span className="text-status-critical font-bold">!</span>
      </div>
      <p className="text-sm text-status-critical">{message}</p>
    </div>
  );
}

// --- Tooltip ---
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-base-700 text-slate-200 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-base-600">
        {text}
      </span>
    </span>
  );
}
