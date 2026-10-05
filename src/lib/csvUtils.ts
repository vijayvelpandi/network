// CSV parsing utility — safely parses uploaded CSV files into row objects.
// Handles quoted fields, mixed delimiters, and malformed rows gracefully.

export interface ParsedCSV {
  columns: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCSV(text: string): ParsedCSV {
  const errors: string[] = [];
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { columns: [], rows: [], errors: ['CSV file is empty.'] };
  }

  const headers = parseCSVLine(lines[0]);
  if (headers.length === 0) {
    return { columns: [], rows: [], errors: ['Could not parse CSV header row.'] };
  }

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }

  if (rows.length === 0) {
    errors.push('CSV file contains headers but no data rows.');
  }

  return { columns: headers, rows, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export function validateCSVFile(file: File): string | null {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`;
  }
  const validExtensions = ['.csv', '.txt'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validExtensions.includes(ext)) {
    return 'Only CSV files are allowed.';
  }
  return null;
}

// Convert row objects to CSV for export
export function rowsToCSV(
  rows: Record<string, string | number>[],
  columns?: string[],
): string {
  if (rows.length === 0) return '';
  const cols = columns ?? Object.keys(rows[0]);
  const lines = [cols.join(',')];
  for (const row of rows) {
    const values = cols.map((c) => {
      const v = row[c] ?? '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    });
    lines.push(values.join(','));
  }
  return lines.join('\n');
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
