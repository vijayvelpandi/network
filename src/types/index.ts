// Core domain types for the Network Intrusion Detection System

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type PredictionLabel = 'NORMAL' | 'SUSPICIOUS';
export type DetectionType =
  | 'Normal Traffic'
  | 'Port Scan'
  | 'DoS-like Traffic'
  | 'Brute Force'
  | 'Other Suspicious Traffic';

export type Protocol = 'TCP' | 'UDP' | 'ICMP';

export interface NetworkFlow {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  source_port: number;
  destination_port: number;
  protocol: Protocol;
  flow_duration: number;
  packet_count: number;
  byte_count: number;
  packets_per_second: number;
  bytes_per_second: number;
  tcp_flags: string;
  label: PredictionLabel;
  detection_type: DetectionType;
  confidence: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  source_port: number;
  destination_port: number;
  protocol: Protocol;
  detection_type: DetectionType;
  severity: Severity;
  confidence: number;
  status: AlertStatus;
}

export interface Dataset {
  id: string;
  name: string;
  uploadedAt: string;
  rowCount: number;
  columns: string[];
  missingValues: number;
  isSample: boolean;
  rows: Record<string, string | number>[];
}

export interface DashboardStats {
  totalFlows: number;
  normalTraffic: number;
  suspiciousTraffic: number;
  alertCount: number;
  highSeverityAlerts: number;
  detectionRate: number;
}

export interface TrafficOverTimePoint {
  time: string;
  normal: number;
  suspicious: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
}

export interface ProtocolDistribution {
  name: string;
  value: number;
}

export interface SeverityDistribution {
  severity: Severity;
  count: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    trueNegatives: number;
    falsePositives: number;
    falseNegatives: number;
    truePositives: number;
  };
  trainingSamples: number;
  testSamples: number;
  features: string[];
  modelType: string;
  trainedAt: string;
}

export interface PredictionResult {
  label: PredictionLabel;
  detection_type: DetectionType;
  confidence: number;
  severity: Severity;
  flow: Record<string, string | number>;
}

export interface BatchPredictionResponse {
  results: PredictionResult[];
  totalFlows: number;
  normalCount: number;
  suspiciousCount: number;
  alertsGenerated: number;
}

export type Page =
  | 'dashboard'
  | 'live'
  | 'analysis'
  | 'alerts'
  | 'datasets'
  | 'model'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
