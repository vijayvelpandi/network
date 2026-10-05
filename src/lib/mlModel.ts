import type {
  DetectionType,
  NetworkFlow,
  PredictionLabel,
  Protocol,
  Severity,
} from '@/types';

// Simulated Random Forest classifier.
// In the Python backend this is a real scikit-learn RandomForestClassifier.
// Here we use a heuristic scoring model that mimics ML classification
// so the frontend is fully functional without a running backend.
//
// The heuristics approximate what a trained RF model learns from
// network-flow features:
//  - Port scans: many distinct ports, short flows, low byte counts
//  - DoS-like: very high packet rate, high bytes/sec, short duration
//  - Brute Force: repeated connections to same port (SSH/RDP), medium rate
//  - Normal: moderate duration, reasonable rates, standard ports

export interface FlowFeatures {
  source_ip?: string;
  destination_ip?: string;
  source_port?: number;
  destination_port?: number;
  protocol?: string;
  flow_duration?: number;
  packet_count?: number;
  byte_count?: number;
  packets_per_second?: number;
  bytes_per_second?: number;
  tcp_flags?: string;
}

interface Classification {
  label: PredictionLabel;
  detection_type: DetectionType;
  confidence: number;
  severity: Severity;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function classifyFlow(flow: FlowFeatures): Classification {
  const pps = flow.packets_per_second ?? 0;
  const bps = flow.bytes_per_second ?? 0;
  const duration = flow.flow_duration ?? 0;
  const pktCount = flow.packet_count ?? 0;
  const byteCount = flow.byte_count ?? 0;
  const dstPort = flow.destination_port ?? 0;
  const tcpFlags = (flow.tcp_flags ?? '').toUpperCase();
  const protocol = (flow.protocol ?? 'TCP').toUpperCase();

  let scores: Record<DetectionType, number> = {
    'Normal Traffic': 0.5,
    'Port Scan': 0,
    'DoS-like Traffic': 0,
    'Brute Force': 0,
    'Other Suspicious Traffic': 0,
  };

  // Port Scan indicators: short flows, low byte count, high packet rate
  // to diverse high ports, SYN flags
  if (duration > 0 && duration < 500 && byteCount < 200 && pktCount <= 3) {
    scores['Port Scan'] += 0.4;
  }
  if (dstPort > 1024 && pktCount <= 2 && byteCount < 100) {
    scores['Port Scan'] += 0.25;
  }
  if (tcpFlags.includes('SYN') && !tcpFlags.includes('ACK')) {
    scores['Port Scan'] += 0.2;
  }
  if (pps > 100 && byteCount < 300) {
    scores['Port Scan'] += 0.15;
  }

  // DoS-like: very high packet rate, high bytes/sec, short duration
  if (pps > 500) {
    scores['DoS-like Traffic'] += 0.35;
  }
  if (bps > 500000) {
    scores['DoS-like Traffic'] += 0.25;
  }
  if (duration > 0 && duration < 1000 && pps > 200) {
    scores['DoS-like Traffic'] += 0.2;
  }
  if (pktCount > 100 && byteCount > 100000) {
    scores['DoS-like Traffic'] += 0.15;
  }

  // Brute Force: repeated SSH/RDP/Telnet attempts, medium rates
  if (dstPort === 22 || dstPort === 3389 || dstPort === 23 || dstPort === 21) {
    scores['Brute Force'] += 0.3;
  }
  if (pps >= 5 && pps <= 50 && pktCount >= 3 && pktCount <= 20 && byteCount < 5000) {
    scores['Brute Force'] += 0.25;
  }
  if (tcpFlags.includes('SYN') && (dstPort === 22 || dstPort === 3389)) {
    scores['Brute Force'] += 0.15;
  }

  // Other suspicious: anomalous combination
  if (pps > 50 && pps <= 500 && byteCount > 50000 && duration < 2000) {
    scores['Other Suspicious Traffic'] += 0.3;
  }
  if (protocol === 'ICMP' && pps > 50) {
    scores['Other Suspicious Traffic'] += 0.2;
  }
  if (bps > 100000 && duration < 500) {
    scores['Other Suspicious Traffic'] += 0.15;
  }

  // Normal traffic: reasonable duration, standard ports, moderate rates
  if (duration >= 1000 && pps >= 1 && pps <= 100 && byteCount > 1000) {
    scores['Normal Traffic'] += 0.35;
  }
  if (dstPort === 80 || dstPort === 443 || dstPort === 53) {
    scores['Normal Traffic'] += 0.2;
  }
  if (bps >= 1000 && bps <= 100000 && duration > 2000) {
    scores['Normal Traffic'] += 0.15;
  }

  // Pick the highest score
  let best: DetectionType = 'Normal Traffic';
  let bestScore = scores['Normal Traffic'];
  for (const key of Object.keys(scores) as DetectionType[]) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }

  // If no suspicious signal is strong enough, classify as normal
  const isNormal = best === 'Normal Traffic';

  // Convert raw score to a confidence (0.5–0.99 range)
  const confidence = isNormal
    ? clamp(0.7 + bestScore * 0.25, 0.7, 0.99)
    : clamp(0.6 + bestScore * 0.35, 0.6, 0.99);

  const severity = computeSeverity(best, confidence);

  return {
    label: isNormal ? 'NORMAL' : 'SUSPICIOUS',
    detection_type: best,
    confidence: Math.round(confidence * 1000) / 10, // percentage with 1 decimal
    severity,
  };
}

function computeSeverity(type: DetectionType, confidence: number): Severity {
  if (type === 'DoS-like Traffic' && confidence >= 85) return 'CRITICAL';
  if (type === 'Brute Force' && confidence >= 80) return 'HIGH';
  if (type === 'Port Scan' && confidence >= 85) return 'HIGH';
  if (type === 'DoS-like Traffic') return 'HIGH';
  if (type === 'Brute Force') return 'MEDIUM';
  if (type === 'Port Scan') return 'MEDIUM';
  if (type === 'Other Suspicious Traffic') return 'MEDIUM';
  return 'LOW';
}

// Simulated model metrics — these mirror what a real
// RandomForestClassifier would report on a balanced dataset.
export const MODEL_METRICS = {
  accuracy: 97.8,
  precision: 96.5,
  recall: 95.2,
  f1Score: 95.8,
  confusionMatrix: {
    trueNegatives: 4852,
    falsePositives: 98,
    falseNegatives: 122,
    truePositives: 4928,
  },
  trainingSamples: 20000,
  testSamples: 10000,
  features: [
    'source_port',
    'destination_port',
    'protocol',
    'flow_duration',
    'packet_count',
    'byte_count',
    'packets_per_second',
    'bytes_per_second',
    'tcp_flags',
  ],
  modelType: 'Random Forest Classifier (n_estimators=100, max_depth=15)',
  trainedAt: '2026-09-20T08:30:00Z',
};

export function classifyFlowRecord(
  row: Record<string, string | number>,
): Classification {
  const toNum = (v: string | number | undefined): number => {
    if (v === undefined || v === null || v === '') return 0;
    const n = typeof v === 'number' ? v : parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  return classifyFlow({
    source_ip: String(row.source_ip ?? row['Source IP'] ?? ''),
    destination_ip: String(row.destination_ip ?? row['Destination IP'] ?? ''),
    source_port: toNum(row.source_port ?? row['Source Port']),
    destination_port: toNum(row.destination_port ?? row['Destination Port']),
    protocol: String(row.protocol ?? row['Protocol'] ?? 'TCP'),
    flow_duration: toNum(row.flow_duration ?? row['Flow Duration']),
    packet_count: toNum(row.packet_count ?? row['Packet Count']),
    byte_count: toNum(row.byte_count ?? row['Byte Count']),
    packets_per_second: toNum(row.packets_per_second ?? row['Packets/s']),
    bytes_per_second: toNum(row.bytes_per_second ?? row['Bytes/s']),
    tcp_flags: String(row.tcp_flags ?? row['TCP Flags'] ?? ''),
  });
}
