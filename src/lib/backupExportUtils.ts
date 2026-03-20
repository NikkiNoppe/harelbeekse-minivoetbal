import { zipSync, strToU8 } from 'fflate';

/**
 * Convert an array of row objects to a CSV string.
 * Uses `;` delimiter and UTF-8 BOM for Excel compatibility.
 */
export function rowsToCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return '';
  
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(';'),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return str.includes(';') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(';')
    )
  ];
  return '\uFEFF' + csvLines.join('\n');
}

/**
 * Bundle multiple CSV strings into a single ZIP blob.
 */
export function buildCsvZip(files: Record<string, string>): Blob {
  const zipData: Record<string, Uint8Array> = {};
  for (const [filename, content] of Object.entries(files)) {
    zipData[filename] = strToU8(content);
  }
  const compressed = zipSync(zipData);
  return new Blob([compressed], { type: 'application/zip' });
}
