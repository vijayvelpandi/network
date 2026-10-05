import { useState, useCallback, useRef } from 'react';
import {
  FileSearch, Upload, FileText, Play, CheckCircle2, AlertCircle,
  TableIcon, Download,
} from 'lucide-react';
import { parseCSV, validateCSVFile, rowsToCSV, downloadCSV } from '@/lib/csvUtils';
import { predictBatch } from '@/lib/dataStore';
import { generateSampleFlowsAsRecords } from '@/lib/sampleDataset';
import { useToast } from '@/context/ToastContext';
import {
  PredictionBadge, DetectionTypeBadge, SeverityBadge, EmptyState, ErrorState,
} from '@/components/ui/Badges';
import type { BatchPredictionResponse, PredictionResult } from '@/types';

interface UploadedData {
  fileName: string;
  columns: string[];
  rows: Record<string, string>[];
  errors: string[];
}

// Map flexible column names to canonical feature names
const COLUMN_MAP: Record<string, string> = {
  source_ip: 'source_ip', 'sourceip': 'source_ip', 'src_ip': 'source_ip', 'srcip': 'source_ip',
  destination_ip: 'destination_ip', 'dest_ip': 'destination_ip', 'dst_ip': 'destination_ip', 'dstip': 'destination_ip',
  source_port: 'source_port', 'src_port': 'source_port', 'srcport': 'source_port', 'sport': 'source_port',
  destination_port: 'destination_port', 'dst_port': 'destination_port', 'dstport': 'destination_port', 'dport': 'destination_port',
  protocol: 'protocol', 'proto': 'protocol',
  flow_duration: 'flow_duration', 'duration': 'flow_duration', 'flowduration': 'flow_duration',
  packet_count: 'packet_count', 'packets': 'packet_count', 'pktcount': 'packet_count',
  byte_count: 'byte_count', 'bytes': 'byte_count', 'bytcount': 'byte_count',
  packets_per_second: 'packets_per_second', 'pps': 'packets_per_second', 'pkt_rate': 'packets_per_second',
  bytes_per_second: 'bytes_per_second', 'bps': 'bytes_per_second', 'byte_rate': 'bytes_per_second',
  tcp_flags: 'tcp_flags', 'flags': 'tcp_flags', 'tcpflags': 'tcp_flags',
};

function normalizeColumns(rows: Record<string, string>[]): Record<string, string | number>[] {
  return rows.map((row) => {
    const normalized: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(row)) {
      const lowerKey = key.toLowerCase().trim();
      const canonical = COLUMN_MAP[lowerKey] ?? lowerKey;
      // Try to convert numeric fields
      const numericFields = ['source_port', 'destination_port', 'flow_duration', 'packet_count', 'byte_count', 'packets_per_second', 'bytes_per_second'];
      if (numericFields.includes(canonical) && value !== '') {
        const n = parseFloat(value);
        normalized[canonical] = isNaN(n) ? value : n;
      } else {
        normalized[canonical] = value;
      }
    }
    return normalized;
  });
}

const REQUIRED_COLUMNS = ['source_ip', 'destination_ip', 'protocol'];

export function TrafficAnalysisPage() {
  const { toast } = useToast();
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictionResult, setPredictionResult] = useState<BatchPredictionResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    const error = validateCSVFile(file);
    if (error) {
      toast('error', error);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.errors.length > 0) {
        toast('error', parsed.errors[0]);
        return;
      }

      // Check for required columns (flexible matching)
      const normalizedHeaders = parsed.columns.map((c) => COLUMN_MAP[c.toLowerCase().trim()] ?? c.toLowerCase().trim());
      const missingRequired = REQUIRED_COLUMNS.filter((req) => !normalizedHeaders.includes(req));

      if (missingRequired.length > 0) {
        toast('warning', `Missing recommended columns: ${missingRequired.join(', ')}. The model will use defaults.`);
      } else {
        toast('success', `Loaded ${parsed.rows.length} rows from ${file.name}`);
      }

      setUploadedData({
        fileName: file.name,
        columns: parsed.columns,
        rows: parsed.rows,
        errors: parsed.errors,
      });
      setPredictionResult(null);
      setShowPreview(true);
    };
    reader.onerror = () => toast('error', 'Failed to read file.');
    reader.readAsText(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleLoadSample = useCallback(() => {
    const rows = generateSampleFlowsAsRecords(50);
    const columns = Object.keys(rows[0] ?? {});
    // Convert to string records for display
    const stringRows = rows.map((r) => {
      const obj: Record<string, string> = {};
      for (const [k, v] of Object.entries(r)) obj[k] = String(v);
      return obj;
    });
    setUploadedData({
      fileName: 'demo_network_flows.csv',
      columns,
      rows: stringRows,
      errors: [],
    });
    setPredictionResult(null);
    setShowPreview(true);
    toast('info', 'Loaded 50 sample network-flow records (DEMO data)');
  }, [toast]);

  const handleRunPrediction = useCallback(() => {
    if (!uploadedData) return;
    setIsProcessing(true);
    // Simulate ML processing delay
    setTimeout(() => {
      const normalizedRows = normalizeColumns(uploadedData.rows);
      const result = predictBatch(normalizedRows);
      setPredictionResult(result);
      setIsProcessing(false);
      toast('success', `Analyzed ${result.totalFlows} flows: ${result.normalCount} normal, ${result.suspiciousCount} suspicious, ${result.alertsGenerated} alerts generated`);
    }, 800);
  }, [uploadedData, toast]);

  const handleExportResults = useCallback(() => {
    if (!predictionResult) return;
    const rows = predictionResult.results.map((r) => ({
      ...r.flow,
      prediction: r.label,
      detection_type: r.detection_type,
      confidence: r.confidence,
      severity: r.severity,
    }));
    const csv = rowsToCSV(rows as Record<string, string | number>[]);
    downloadCSV('prediction_results.csv', csv);
    toast('success', 'Results exported as CSV');
  }, [predictionResult, toast]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Upload area */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-100 mb-1">Upload Network Flow Data</h3>
        <p className="text-xs text-slate-500 mb-4">
          Upload a CSV file with network-flow features. Supported columns: source_ip, destination_ip, source_port, destination_port, protocol, flow_duration, packet_count, byte_count, packets_per_second, bytes_per_second, tcp_flags
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-base-600 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-glow/40 hover:bg-cyan-glow/5 transition-all"
        >
          <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 text-sm">Click to browse or drag a CSV file here</p>
          <p className="text-xs text-slate-500 mt-1">Max 10 MB · .csv files only</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={handleLoadSample} className="btn-secondary">
            <FileText className="w-4 h-4" /> Load Sample Data
          </button>
        </div>
      </div>

      {/* Data preview */}
      {uploadedData && showPreview && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-cyan-glow" />
              <div>
                <h3 className="font-semibold text-slate-100">{uploadedData.fileName}</h3>
                <p className="text-xs text-slate-500">
                  {uploadedData.rows.length} rows · {uploadedData.columns.length} columns
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-normal" />
              <span className="text-xs text-status-normal">Validated</span>
            </div>
          </div>

          {/* Column list */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2">Detected columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {uploadedData.columns.map((col) => {
                const canonical = COLUMN_MAP[col.toLowerCase().trim()] ?? col.toLowerCase().trim();
                const isKnown = Object.values(COLUMN_MAP).includes(canonical);
                return (
                  <span
                    key={col}
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      isKnown
                        ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20'
                        : 'bg-base-800 text-slate-400 border border-base-700'
                    }`}
                  >
                    {col}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-base-850">
                <tr className="border-b border-base-700">
                  <th className="table-header w-8">#</th>
                  {uploadedData.columns.slice(0, 8).map((col) => (
                    <th key={col} className="table-header">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadedData.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell text-slate-500 text-xs">{i + 1}</td>
                    {uploadedData.columns.slice(0, 8).map((col) => (
                      <td key={col} className="table-cell font-mono text-xs truncate max-w-32">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {uploadedData.rows.length > 10 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Showing 10 of {uploadedData.rows.length} rows
            </p>
          )}

          {/* Run prediction button */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-base-700">
            <button onClick={handleRunPrediction} disabled={isProcessing} className="btn-primary">
              <Play className="w-4 h-4" />
              {isProcessing ? 'Running ML Model...' : 'Run ML Model'}
            </button>
            {isProcessing && (
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-glow rounded-full animate-pulseGlow" />
                Classifying flows with Random Forest model...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Prediction results */}
      {predictionResult && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-cyan-glow" />
              <h3 className="font-semibold text-slate-100">Prediction Results</h3>
            </div>
            <button onClick={handleExportResults} className="btn-secondary">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-slate-100">{predictionResult.totalFlows}</p>
              <p className="text-xs text-slate-500">Total Flows</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-status-normal">{predictionResult.normalCount}</p>
              <p className="text-xs text-slate-500">Normal</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-status-critical">{predictionResult.suspiciousCount}</p>
              <p className="text-xs text-slate-500">Suspicious</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-status-warning">{predictionResult.alertsGenerated}</p>
              <p className="text-xs text-slate-500">Alerts Generated</p>
            </div>
          </div>

          {/* Results table */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-base-850">
                <tr className="border-b border-base-700">
                  <th className="table-header w-8">#</th>
                  <th className="table-header">Source IP</th>
                  <th className="table-header">Dest IP</th>
                  <th className="table-header">Port</th>
                  <th className="table-header">Protocol</th>
                  <th className="table-header">Detection</th>
                  <th className="table-header">Label</th>
                  <th className="table-header">Confidence</th>
                  <th className="table-header">Severity</th>
                </tr>
              </thead>
              <tbody>
                {predictionResult.results.map((r: PredictionResult, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell text-slate-500 text-xs">{i + 1}</td>
                    <td className="table-cell font-mono text-xs">{String(r.flow.source_ip ?? '-')}</td>
                    <td className="table-cell font-mono text-xs">{String(r.flow.destination_ip ?? '-')}</td>
                    <td className="table-cell font-mono text-xs">{String(r.flow.destination_port ?? '-')}</td>
                    <td className="table-cell text-xs">{String(r.flow.protocol ?? '-')}</td>
                    <td className="table-cell"><DetectionTypeBadge type={r.detection_type} /></td>
                    <td className="table-cell"><PredictionBadge label={r.label} /></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-base-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${r.confidence >= 80 ? 'bg-status-critical' : r.confidence >= 60 ? 'bg-status-warning' : 'bg-status-normal'}`}
                            style={{ width: `${r.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{r.confidence}%</span>
                      </div>
                    </td>
                    <td className="table-cell"><SeverityBadge severity={r.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!uploadedData && (
        <div className="card p-8">
          <EmptyState
            icon={FileSearch}
            title="No data uploaded yet"
            message="Upload a CSV file or load sample data to start analyzing network traffic with the ML model."
            action={
              <button onClick={handleLoadSample} className="btn-primary">
                <FileText className="w-4 h-4" /> Load Sample Data
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
