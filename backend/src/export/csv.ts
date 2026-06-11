export function toCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

export function csvCell(value: unknown) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
