export function escapeCsvCell(value: unknown): string {
  const stringValue = String(value ?? "");
  const normalized = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildCsv(rows: Array<Array<unknown>>): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}
