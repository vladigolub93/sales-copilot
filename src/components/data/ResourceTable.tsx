import type { ReactNode } from 'react';
import { Badge } from '@components/ui/Badge';
import { Card, CardContent } from '@components/ui/Card';

export interface ColumnConfig<T> {
  header: string;
  accessor: keyof T;
  cell?: (row: T) => ReactNode;
}

interface ResourceTableProps<T extends { id: string }> {
  title: string;
  description?: string;
  columns: Array<ColumnConfig<T>>;
  rows: T[];
  emptyState?: ReactNode;
}

export function ResourceTable<T extends { id: string }>({
  title,
  description,
  columns,
  rows,
  emptyState
}: ResourceTableProps<T>) {
  return (
    <Card>
      <CardContent>
        <header className="mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description ? <p className="text-sm text-slate-400">{description}</p> : null}
        </header>
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.accessor)}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-400">
                    {emptyState ?? <Badge tone="info">No records yet</Badge>}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900">
                    {columns.map((column) => (
                      <td key={String(column.accessor)} className="px-4 py-3 text-sm text-slate-200">
                        {column.cell ? column.cell(row) : String(row[column.accessor] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
