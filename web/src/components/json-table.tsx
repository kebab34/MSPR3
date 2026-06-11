"use client";

type Row = Record<string, unknown>;

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function JsonTable({
  rows,
  columns,
  emptyMessage = "Aucune donnée",
}: {
  rows: Row[];
  columns: string[];
  emptyMessage?: string;
}) {
  if (!rows.length) {
    return (
      <p className="text-zinc-500 text-sm py-8 text-center">{emptyMessage}</p>
    );
  }

  const cols =
    columns.length > 0
      ? columns.filter((c) => rows.some((r) => c in r))
      : Array.from(
          rows.reduce((acc, r) => {
            Object.keys(r).forEach((k) => acc.add(k));
            return acc;
          }, new Set<string>()),
        );

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 border-b border-zinc-800">
            {cols.map((c) => (
              <th
                key={c}
                className="text-left px-3 py-2 font-medium text-zinc-400 whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-zinc-800/80 hover:bg-zinc-900/50"
            >
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 text-zinc-300 max-w-xs truncate">
                  {formatCell(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
