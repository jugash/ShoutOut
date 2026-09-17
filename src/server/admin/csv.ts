export interface Column<T> {
  header: string;
  value: (row: T) => string | number | boolean | Date | null | undefined;
}

/** Neutralises spreadsheet formulas (CSV injection) and quotes when needed. */
export function csvCell(value: string | number | boolean | Date | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(rows: T[], columns: Column<T>[]): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(c.value(row))).join(","));
  return `${lines.join("\r\n")}\r\n`;
}
