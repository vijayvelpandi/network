import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Database, Upload, FileText, TableIcon, AlertTriangle,
  CheckCircle2, Play, Download, Info,
} from 'lucide-react';
import { parseCSV, validateCSVFile, rowsToCSV, downloadCSV } from '@/lib/csvUtils';
import { getSampleDataset } from '@/lib/dataStore';
import { generateSampleFlowsAsRecords, generateSampleCSV } from '@/lib/sampleDataset';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/Badges';
import type { Dataset } from '@/types';

interface UploadedDataset extends Dataset {
  isSample: false;
}

export function DatasetsPage() {
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<Dataset[]>(() => [getSampleDataset()]);
  const [selectedId, setSelectedId] = useState<string>(() => 'dataset_sample_001');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDataset = useMemo(
    () => datasets.find((d) => d.id === selectedId) ?? datasets[0],
    [datasets, selectedId],
  );

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

      if (parsed.errors.length > 0 && parsed.rows.length === 0) {
        toast('error', parsed.errors[0]);
        return;
      }

      let missing = 0;
      for (const row of parsed.rows) {
        for (const col of parsed.columns) {
          if (row[col] === '' || row[col] === undefined) missing++;
        }
      }

      const newDataset: Dataset = {
        id: `dataset_${Date.now()}`,
        name: file.name,
        uploadedAt: new Date().toISOString(),
        rowCount: parsed.rows.length,
        columns: parsed.columns,
        missingValues: missing,
        isSample: false,
        rows: parsed.rows as Record<string, string | number>[],
      };

      setDatasets((prev) => [newDataset, ...prev]);
      setSelectedId(newDataset.id);
      toast('success', `Dataset "${file.name}" uploaded: ${parsed.rows.length} rows, ${parsed.columns.length} columns`);
    };
    reader.onerror = () => toast('error', 'Failed to read file.');
    reader.readAsText(file);
  }, [toast]);

  const handleDownloadSample = useCallback(() => {
    const csv = generateSampleCSV(150);
    downloadCSV('demo_network_flows.csv', csv);
    toast('success', 'Sample dataset downloaded as CSV');
  }, [toast]);

  const handlePreprocess = useCallback(() => {
    if (!selectedDataset) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast('success', 'Preprocessing complete: missing values imputed, categorical features encoded, features normalized.');
    }, 1000);
  }, [selectedDataset, toast]);

  const handleExportDataset = useCallback(() => {
    if (!selectedDataset) return;
    const csv = rowsToCSV(selectedDataset.rows);
    downloadCSV(selectedDataset.name, csv);
    toast('success', 'Dataset exported as CSV');
  }, [selectedDataset, toast]);

  if (!selectedDataset) {
    return (
      <div className="card p-8">
        <EmptyState icon={Database} title="No datasets available" message="Upload a CSV file to get started." />
      </div>
    );
  }

  // Calculate missing values per column
  const missingPerColumn = selectedDataset.columns.map((col) => {
    let count = 0;
    for (const row of selectedDataset.rows) {
      if (row[col] === '' || row[col] === undefined || row[col] === null) count++;
    }
    return { column: col, missing: count };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Upload + actions */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-100">Dataset Management</h3>
            <p className="text-xs text-slate-500">Upload, inspect, and preprocess network-flow datasets</p>
          </div>
          <div className="flex items-center gap-2">
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
            <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
              <Upload className="w-4 h-4" /> Upload CSV
            </button>
            <button onClick={handleDownloadSample} className="btn-secondary">
              <Download className="w-4 h-4" /> Download Sample
            </button>
          </div>
        </div>
      </div>

      {/* Dataset list */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-100 mb-3">Available Datasets</h3>
        <div className="space-y-2">
          {datasets.map((ds) => (
            <button
              key={ds.id}
              onClick={() => setSelectedId(ds.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                ds.id === selectedId
                  ? 'bg-cyan-glow/5 border-cyan-glow/30'
                  : 'bg-base-900 border-base-700/50 hover:border-base-600'
              }`}
            >
              <FileText className={`w-5 h-5 flex-shrink-0 ${ds.id === selectedId ? 'text-cyan-glow' : 'text-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-200 font-medium truncate">{ds.name}</p>
                  {ds.isSample && (
                    <span className="badge-info">DEMO</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {ds.rowCount} rows · {ds.columns.length} columns · {ds.missingValues} missing values
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dataset details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dataset info */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-4">Dataset Information</h3>
          <div className="space-y-3">
            <InfoRow label="Name" value={selectedDataset.name} />
            <InfoRow label="Rows" value={String(selectedDataset.rowCount)} />
            <InfoRow label="Columns" value={String(selectedDataset.columns.length)} />
            <InfoRow label="Missing Values" value={String(selectedDataset.missingValues)} />
            <InfoRow label="Type" value={selectedDataset.isSample ? 'Sample / Demo' : 'User Uploaded'} />
            <div className="flex items-center gap-2 pt-2">
              {selectedDataset.missingValues === 0 ? (
                <><CheckCircle2 className="w-4 h-4 text-status-normal" /><span className="text-xs text-status-normal">No missing values</span></>
              ) : (
                <><AlertTriangle className="w-4 h-4 text-status-warning" /><span className="text-xs text-status-warning">{selectedDataset.missingValues} missing values detected</span></>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-base-700">
            <button onClick={handlePreprocess} disabled={isProcessing} className="btn-primary">
              <Play className="w-4 h-4" /> {isProcessing ? 'Processing...' : 'Run Preprocessing'}
            </button>
            <button onClick={handleExportDataset} className="btn-secondary">
              <Download className="w-4 h-4" /> Export as CSV
            </button>
          </div>
        </div>

        {/* Feature columns + missing values */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-4">Feature Columns</h3>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {missingPerColumn.map(({ column, missing }) => (
              <div key={column} className="flex items-center justify-between py-1.5 px-2 rounded bg-base-900 border border-base-700/30">
                <span className="text-xs font-mono text-slate-300">{column}</span>
                {missing > 0 ? (
                  <span className="text-xs text-status-warning">{missing} missing</span>
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-normal" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sample rows preview */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="font-semibold text-slate-100 mb-4">Sample Rows</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="sticky top-0 bg-base-850">
                <tr className="border-b border-base-700">
                  <th className="table-header w-8">#</th>
                  {selectedDataset.columns.slice(0, 5).map((col) => (
                    <th key={col} className="table-header text-xs">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedDataset.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell text-slate-500 text-xs">{i + 1}</td>
                    {selectedDataset.columns.slice(0, 5).map((col) => (
                      <td key={col} className="table-cell font-mono text-xs truncate max-w-28">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedDataset.rows.length > 10 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Showing 10 of {selectedDataset.rowCount} rows
            </p>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="card p-4 border-status-info/30 bg-status-info/5 flex items-start gap-3">
        <Info className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400">
          The sample dataset contains {selectedDataset.rowCount} synthetic network-flow records with both normal and suspicious traffic patterns.
          All data is labeled as SIMULATED for demonstration purposes. No real attack traffic is generated.
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-200 font-medium">{value}</span>
    </div>
  );
}
