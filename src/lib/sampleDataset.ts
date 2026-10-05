import { generateFlow } from './dataGenerator';

// Generate sample network-flow records (as plain objects for CSV/dataset display)
export function generateSampleFlowsAsRecords(
  count: number,
): Record<string, string | number>[] {
  const records: Record<string, string | number>[] = [];
  for (let i = 0; i < count; i++) {
    const flow = generateFlow({ suspiciousRatio: 0.3, secondsAgo: Math.floor(Math.random() * 7200) });
    records.push({
      source_ip: flow.source_ip,
      destination_ip: flow.destination_ip,
      source_port: flow.source_port,
      destination_port: flow.destination_port,
      protocol: flow.protocol,
      flow_duration: flow.flow_duration,
      packet_count: flow.packet_count,
      byte_count: flow.byte_count,
      packets_per_second: flow.packets_per_second,
      bytes_per_second: flow.bytes_per_second,
      tcp_flags: flow.tcp_flags,
      label: flow.label,
    });
  }
  return records;
}

// Generate a downloadable CSV string of sample data
export function generateSampleCSV(count = 150): string {
  const records = generateSampleFlowsAsRecords(count);
  if (records.length === 0) return '';
  const headers = Object.keys(records[0]);
  const lines = [headers.join(',')];
  for (const row of records) {
    const values = headers.map((h) => {
      const v = row[h];
      if (typeof v === 'string' && v.includes(',')) {
        return `"${v}"`;
      }
      return String(v);
    });
    lines.push(values.join(','));
  }
  return lines.join('\n');
}
