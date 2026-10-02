"use client";

import { useState } from "react";

import { DataTable, type TableCell } from "./ui-bits";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

/** A paginated wrapper around `DataTable` with rows-per-page selector. */
export function PaginatedDataTable({
  columns,
  rows,
  rowActions,
  rowActionDisabled,
  defaultPageSize = 10,
  onRowAction,
}: {
  columns: string[];
  rows: TableCell[][];
  rowActions?: string[];
  rowActionDisabled?: (rowIndex: number, action: string) => boolean;
  defaultPageSize?: number;
  onRowAction?: (rowIndex: number, action: string) => void;
}) {
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [requestedPage, setRequestedPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;
  const visibleRows = rows.slice(start, start + pageSize);

  return (
    <div>
      <DataTable
        columns={columns}
        rows={visibleRows}
        rowActions={rowActions}
        rowActionDisabled={
          rowActionDisabled ? (i, action) => rowActionDisabled(start + i, action) : undefined
        }
        onRowAction={onRowAction ? (i, action) => onRowAction(start + i, action) : undefined}
      />
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-5 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setRequestedPage(1);
                }}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setRequestedPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-input px-3 py-1 text-xs font-semibold transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setRequestedPage((p) => Math.min(pageCount, p + 1))}
                className="rounded-full border border-input px-3 py-1 text-xs font-semibold transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
