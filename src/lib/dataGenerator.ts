import type { NetworkFlow, Protocol, Alert } from '@/types';
import { classifyFlow } from './mlModel';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36).padStart(6, '0')}`;
}

const NORMAL_IPS = [
  '192.168.1.10', '192.168.1.11', '192.168.1.12',
  '10.0.0.15', '10.0.0.22', '172.16.0.50',
];
const SUSPICIOUS_IPS = [
  '45.227.89.12', '185.220.101.45', '203.0.113.7',
  '198.51.100.23', '91.218.114.0',
];
const COMMON_PORTS = [80, 443, 53, 22, 3389, 21, 25, 8080, 3306];
const HIGH_PORTS = [13389, 22345, 31256, 40897, 55555, 65123];
const PROTOCOLS: Protocol[] = ['TCP', 'UDP', 'ICMP'];
const TCP_FLAGS = ['SYN', 'SYN-ACK', 'ACK', 'FIN-ACK', 'PSH-ACK', 'RST'];
const DETECTION_TYPES_NORMAL = ['Normal Traffic'] as const;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickNormalPort(): number {
  return pick(COMMON_PORTS);
}

function pickHighPort(): number {
  return pick(HIGH_PORTS);
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1));
}

function timeAgo(secondsAgo: number): string {
  return new Date(Date.now() - secondsAgo * 1000).toISOString();
}

export interface GenerateOptions {
  suspiciousRatio?: number;
  secondsAgo?: number;
}

export function generateFlow(opts: GenerateOptions = {}): NetworkFlow {
  const suspiciousRatio = opts.suspiciousRatio ?? 0.3;
  const isSuspicious = Math.random() < suspiciousRatio;
  const secondsAgo = opts.secondsAgo ?? randomInt(0, 7200);

  const sourceIp = isSuspicious ? pick(SUSPICIOUS_IPS) : pick(NORMAL_IPS);
  const protocol = isSuspicious
    ? pick(PROTOCOLS)
    : pick(['TCP', 'TCP', 'TCP', 'UDP'] as Protocol[]);

  let dstPort: number;
  let flowDuration: number;
  let packetCount: number;
  let byteCount: number;
  let pps: number;
  let bps: number;
  let tcpFlags: string;

  if (!isSuspicious) {
    dstPort = pickNormalPort();
    flowDuration = randomInt(1000, 60000);
    packetCount = randomInt(5, 200);
    byteCount = randomInt(2000, 500000);
    pps = randomFloat(1, 80);
    bps = randomFloat(1000, 80000);
    tcpFlags = pick(['SYN-ACK', 'ACK', 'PSH-ACK', 'FIN-ACK']);
  } else {
    const attackType = pick(['portscan', 'dos', 'bruteforce', 'other']);
    switch (attackType) {
      case 'portscan':
        dstPort = pickHighPort();
        flowDuration = randomInt(10, 300);
        packetCount = randomInt(1, 3);
        byteCount = randomInt(40, 160);
        pps = randomFloat(100, 800);
        bps = randomFloat(500, 5000);
        tcpFlags = 'SYN';
        break;
      case 'dos':
        dstPort = pickNormalPort();
        flowDuration = randomInt(50, 800);
        packetCount = randomInt(100, 2000);
        byteCount = randomInt(100000, 1000000);
        pps = randomFloat(500, 5000);
        bps = randomFloat(500000, 5000000);
        tcpFlags = pick(['SYN', 'SYN']);
        break;
      case 'bruteforce':
        dstPort = pick([22, 3389, 23, 21]);
        flowDuration = randomInt(100, 2000);
        packetCount = randomInt(3, 20);
        byteCount = randomInt(200, 4000);
        pps = randomFloat(5, 50);
        bps = randomFloat(500, 8000);
        tcpFlags = 'SYN';
        break;
      default:
        dstPort = pickHighPort();
        flowDuration = randomInt(50, 1500);
        packetCount = randomInt(10, 500);
        byteCount = randomInt(50000, 200000);
        pps = randomFloat(50, 400);
        bps = randomFloat(100000, 500000);
        tcpFlags = pick(TCP_FLAGS);
        break;
    }
  }

  const classification = classifyFlow({
    source_ip: sourceIp,
    destination_ip: pick(NORMAL_IPS),
    source_port: randomInt(1024, 65535),
    destination_port: dstPort,
    protocol,
    flow_duration: flowDuration,
    packet_count: packetCount,
    byte_count: byteCount,
    packets_per_second: pps,
    bytes_per_second: bps,
    tcp_flags: tcpFlags,
  });

  return {
    id: nextId('flow'),
    timestamp: timeAgo(secondsAgo),
    source_ip: sourceIp,
    destination_ip: pick(NORMAL_IPS),
    source_port: randomInt(1024, 65535),
    destination_port: dstPort,
    protocol,
    flow_duration: flowDuration,
    packet_count: packetCount,
    byte_count: byteCount,
    packets_per_second: Math.round(pps * 100) / 100,
    bytes_per_second: Math.round(bps * 100) / 100,
    tcp_flags: tcpFlags,
    label: classification.label,
    detection_type: classification.detection_type,
    confidence: classification.confidence,
  };
}

export function generateFlows(count: number, opts: GenerateOptions = {}): NetworkFlow[] {
  const flows: NetworkFlow[] = [];
  for (let i = 0; i < count; i++) {
    flows.push(generateFlow({ ...opts, secondsAgo: opts.secondsAgo ?? randomInt(0, 7200) }));
  }
  flows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return flows;
}

export function flowToAlert(flow: NetworkFlow): Alert {
  const severity = flow.detection_type === 'Normal Traffic' ? 'LOW' :
    computeAlertSeverity(flow.detection_type, flow.confidence);
  return {
    id: nextId('alert'),
    timestamp: flow.timestamp,
    source_ip: flow.source_ip,
    destination_ip: flow.destination_ip,
    source_port: flow.source_port,
    destination_port: flow.destination_port,
    protocol: flow.protocol,
    detection_type: flow.detection_type,
    severity,
    confidence: flow.confidence,
    status: 'OPEN',
  };
}

function computeAlertSeverity(type: string, confidence: number): Alert['severity'] {
  if (type === 'DoS-like Traffic' && confidence >= 85) return 'CRITICAL';
  if (type === 'Brute Force' && confidence >= 80) return 'HIGH';
  if (type === 'Port Scan' && confidence >= 85) return 'HIGH';
  if (type === 'DoS-like Traffic') return 'HIGH';
  if (type === 'Brute Force') return 'MEDIUM';
  if (type === 'Port Scan') return 'MEDIUM';
  if (type === 'Other Suspicious Traffic') return 'MEDIUM';
  return 'LOW';
}
