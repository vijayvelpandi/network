import type {
  Alert,
  AlertStatus,
  DashboardStats,
  Dataset,
  NetworkFlow,
  BatchPredictionResponse,
  PredictionResult,
  TrafficOverTimePoint,
  CategoryDistribution,
  ProtocolDistribution,
  SeverityDistribution,
} from '@/types';
import { generateFlows, flowToAlert } from './dataGenerator';
import { classifyFlowRecord } from './mlModel';

// In-memory data store that simulates the FastAPI + SQLite backend.
// All data persists for the lifetime of the browser session.
// In the real deployment, these operations map to REST API calls.

const STORAGE_KEY = 'netguard_ids_state_v1';

interface PersistedState {
  flows: NetworkFlow[];
  alerts: Alert[];
}

function loadState(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

// Initialize with sample data on first load
let flows: NetworkFlow[] = [];
let alerts: Alert[] = [];

const existing = loadState();
if (existing && existing.flows.length > 0) {
  flows = existing.flows;
  alerts = existing.alerts;
} else {
  // Seed 200 flows (~30% suspicious) to populate the dashboard
  flows = generateFlows(200, { suspiciousRatio: 0.3 });
  alerts = flows
    .filter((f) => f.label === 'SUSPICIOUS')
    .map((f) => flowToAlert(f));
  // Sort alerts by timestamp desc
  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  persist();
}

function persist(): void {
  saveState({ flows, alerts });
}

// --- Dashboard stats ---

export function getDashboardStats(): DashboardStats {
  const normalTraffic = flows.filter((f) => f.label === 'NORMAL').length;
  const suspiciousTraffic = flows.filter((f) => f.label === 'SUSPICIOUS').length;
  const highSeverityAlerts = alerts.filter(
    (a) => a.severity === 'HIGH' || a.severity === 'CRITICAL',
  ).length;
  const detectionRate =
    flows.length > 0
      ? Math.round((suspiciousTraffic / flows.length) * 1000) / 10
      : 0;

  return {
    totalFlows: flows.length,
    normalTraffic,
    suspiciousTraffic,
    alertCount: alerts.length,
    highSeverityAlerts,
    detectionRate,
  };
}

export function getTrafficOverTime(hours = 6): TrafficOverTimePoint[] {
  const now = Date.now();
  const points: TrafficOverTimePoint[] = [];
  const buckets = hours * 4; // 15-min buckets

  for (let i = buckets - 1; i >= 0; i--) {
    const bucketStart = now - (i + 1) * 15 * 60 * 1000;
    const bucketEnd = now - i * 15 * 60 * 1000;
    const label = new Date(bucketStart).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const bucketFlows = flows.filter((f) => {
      const t = new Date(f.timestamp).getTime();
      return t >= bucketStart && t < bucketEnd;
    });

    points.push({
      time: label,
      normal: bucketFlows.filter((f) => f.label === 'NORMAL').length,
      suspicious: bucketFlows.filter((f) => f.label === 'SUSPICIOUS').length,
    });
  }

  return points;
}

export function getCategoryDistribution(): CategoryDistribution[] {
  const categories = ['Normal Traffic', 'Port Scan', 'DoS-like Traffic', 'Brute Force', 'Other Suspicious Traffic'];
  return categories
    .map((name) => ({
      name,
      value: flows.filter((f) => f.detection_type === name).length,
    }))
    .filter((d) => d.value > 0);
}

export function getProtocolDistribution(): ProtocolDistribution[] {
  const protocols = ['TCP', 'UDP', 'ICMP'];
  return protocols.map((name) => ({
    name,
    value: flows.filter((f) => f.protocol === name).length,
  }));
}

export function getSeverityDistribution(): SeverityDistribution[] {
  const severities: SeverityDistribution['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return severities.map((severity) => ({
    severity,
    count: alerts.filter((a) => a.severity === severity).length,
  }));
}

export function getRecentFlows(limit = 10): NetworkFlow[] {
  return flows.slice(0, limit);
}

export function getRecentAlerts(limit = 5): Alert[] {
  return alerts.slice(0, limit);
}

// --- Alerts ---

export interface AlertQuery {
  search?: string;
  severity?: string;
  status?: string;
  detectionType?: string;
  sortBy?: 'timestamp' | 'severity' | 'confidence';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

const SEVERITY_ORDER: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export function getAlerts(query: AlertQuery = {}): Alert[] {
  let result = [...alerts];

  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.source_ip.toLowerCase().includes(q) ||
        a.destination_ip.toLowerCase().includes(q) ||
        a.detection_type.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q),
    );
  }

  if (query.severity && query.severity !== 'ALL') {
    result = result.filter((a) => a.severity === query.severity);
  }

  if (query.status && query.status !== 'ALL') {
    result = result.filter((a) => a.status === query.status);
  }

  if (query.detectionType && query.detectionType !== 'ALL') {
    result = result.filter((a) => a.detection_type === query.detectionType);
  }

  if (query.sortBy) {
    result.sort((a, b) => {
      let cmp = 0;
      if (query.sortBy === 'timestamp') {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (query.sortBy === 'severity') {
        cmp = (SEVERITY_ORDER[a.severity] ?? 0) - (SEVERITY_ORDER[b.severity] ?? 0);
      } else if (query.sortBy === 'confidence') {
        cmp = a.confidence - b.confidence;
      }
      return query.sortOrder === 'asc' ? cmp : -cmp;
    });
  } else {
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  if (query.limit) {
    result = result.slice(0, query.limit);
  }

  return result;
}

export function getAlertById(id: string): Alert | undefined {
  return alerts.find((a) => a.id === id);
}

export function updateAlertStatus(id: string, status: AlertStatus): Alert | undefined {
  const alert = alerts.find((a) => a.id === id);
  if (alert) {
    alert.status = status;
    persist();
  }
  return alert;
}

// --- Traffic ---

export function getTraffic(limit = 50): NetworkFlow[] {
  return flows.slice(0, limit);
}

// --- Predictions ---

export function predictBatch(
  rows: Record<string, string | number>[],
): BatchPredictionResponse {
  const results: PredictionResult[] = [];
  let normalCount = 0;
  let suspiciousCount = 0;
  let alertsGenerated = 0;

  for (const row of rows) {
    const classification = classifyFlowRecord(row);
    const result: PredictionResult = {
      label: classification.label,
      detection_type: classification.detection_type,
      confidence: classification.confidence,
      severity: classification.severity,
      flow: row,
    };
    results.push(result);

    if (classification.label === 'NORMAL') {
      normalCount++;
    } else {
      suspiciousCount++;
      // Generate alert for suspicious flows
      const now = new Date().toISOString();
      const newAlert: Alert = {
        id: `alert_${Date.now()}_${alertsGenerated}`,
        timestamp: now,
        source_ip: String(row.source_ip ?? row['Source IP'] ?? 'unknown'),
        destination_ip: String(row.destination_ip ?? row['Destination IP'] ?? 'unknown'),
        source_port: Number(row.source_port ?? row['Source Port'] ?? 0) || 0,
        destination_port: Number(row.destination_port ?? row['Destination Port'] ?? 0) || 0,
        protocol: (String(row.protocol ?? row['Protocol'] ?? 'TCP').toUpperCase() as Alert['protocol']),
        detection_type: classification.detection_type,
        severity: classification.severity,
        confidence: classification.confidence,
        status: 'OPEN',
      };
      alerts.unshift(newAlert);
      alertsGenerated++;
    }
  }

  // Also add these as analyzed flows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const classification = classifyFlowRecord(row);
    flows.unshift({
      id: `flow_${Date.now()}_${i}`,
      timestamp: new Date().toISOString(),
      source_ip: String(row.source_ip ?? row['Source IP'] ?? ''),
      destination_ip: String(row.destination_ip ?? row['Destination IP'] ?? ''),
      source_port: Number(row.source_port ?? row['Source Port'] ?? 0) || 0,
      destination_port: Number(row.destination_port ?? row['Destination Port'] ?? 0) || 0,
      protocol: (String(row.protocol ?? row['Protocol'] ?? 'TCP').toUpperCase() as NetworkFlow['protocol']),
      flow_duration: Number(row.flow_duration ?? row['Flow Duration'] ?? 0) || 0,
      packet_count: Number(row.packet_count ?? row['Packet Count'] ?? 0) || 0,
      byte_count: Number(row.byte_count ?? row['Byte Count'] ?? 0) || 0,
      packets_per_second: Number(row.packets_per_second ?? row['Packets/s'] ?? 0) || 0,
      bytes_per_second: Number(row.bytes_per_second ?? row['Bytes/s'] ?? 0) || 0,
      tcp_flags: String(row.tcp_flags ?? row['TCP Flags'] ?? ''),
      label: classification.label,
      detection_type: classification.detection_type,
      confidence: classification.confidence,
    });
  }

  persist();

  return {
    results,
    totalFlows: rows.length,
    normalCount,
    suspiciousCount,
    alertsGenerated,
  };
}

// --- Live simulation ---

export function addSimulatedFlow(flow: NetworkFlow): void {
  flows.unshift(flow);
  if (flow.label === 'SUSPICIOUS') {
    alerts.unshift(flowToAlert(flow));
  }
  // Keep arrays from growing unbounded
  if (flows.length > 5000) flows = flows.slice(0, 5000);
  if (alerts.length > 2000) alerts = alerts.slice(0, 2000);
  persist();
}

// --- Datasets ---

export function getSampleDataset(): Dataset {
  return generateSampleDataset();
}

import { generateSampleFlowsAsRecords } from './sampleDataset';

function generateSampleDataset(): Dataset {
  const rows = generateSampleFlowsAsRecords(150);
  const columns = Object.keys(rows[0] ?? {});
  let missing = 0;
  for (const row of rows) {
    for (const col of columns) {
      if (row[col] === '' || row[col] === undefined || row[col] === null) missing++;
    }
  }
  return {
    id: 'dataset_sample_001',
    name: 'demo_network_flows.csv',
    uploadedAt: '2026-09-20T08:00:00Z',
    rowCount: rows.length,
    columns,
    missingValues: missing,
    isSample: true,
    rows,
  };
}

// --- Reports ---

export function getReportData() {
  const stats = getDashboardStats();
  const categories = getCategoryDistribution();
  const severities = getSeverityDistribution();
  const protocols = getProtocolDistribution();
  const trafficOverTime = getTrafficOverTime(24);

  return {
    stats,
    categories,
    severities,
    protocols,
    trafficOverTime,
    totalAlerts: alerts.length,
    acknowledgedAlerts: alerts.filter((a) => a.status !== 'OPEN').length,
  };
}

export function getAllFlows(): NetworkFlow[] {
  return flows;
}
