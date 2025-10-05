import * as XLSX from "xlsx";

export interface ExportRow {
  type: string;
  text: string;
  chars: number;
  within: boolean;
}

export function downloadCSV(rows: ExportRow[], filename?: string) {
  const header = ["type", "text", "characters", "within_spec"];
  const csv = [header.join(",")]
    .concat(
      rows.map((r) =>
        [
          r.type,
          JSON.stringify(r.text),
          String(r.chars),
          r.within ? "true" : "false",
        ].join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename || `ad_copy_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

export function downloadXLSX(
  items: Array<{ data: string[]; limit: number; sheetName: string }>,
  filename?: string
) {
  const wb = XLSX.utils.book_new();
  
  items.forEach(({ data, limit, sheetName }) => {
    const ws = XLSX.utils.aoa_to_sheet([
      [sheetName, "Characters", `Within Spec (≤${limit})`],
      ...data.map((text) => [text, text.length, text.length <= limit]),
    ]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  XLSX.writeFile(wb, filename || `ad_copy_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export const softClamp = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 10 ? slice.slice(0, lastSpace) : slice).trim();
};
