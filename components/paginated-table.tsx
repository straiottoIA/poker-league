"use client";
import { useState } from "react";
import type { ReactNode } from "react";

interface PaginatedTableProps<T> {
  data: T[];
  pageSize?: number;
  renderHeader: () => ReactNode;
  renderRow: (item: T, globalIndex: number) => ReactNode;
  emptyMessage?: string;
}

export function PaginatedTable<T>({
  data,
  pageSize = 10,
  renderHeader,
  renderRow,
  emptyMessage = "Nenhum dado encontrado.",
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = data.slice(page * pageSize, (page + 1) * pageSize);

  if (data.length === 0) {
    return (
      <div className="border border-border-strong bg-surface px-8 py-12 text-center">
        <p className="font-body text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto border border-border-strong bg-surface">
        <table className="min-w-full">
          <thead>{renderHeader()}</thead>
          <tbody>
            {pageData.map((item, i) => renderRow(item, page * pageSize + i))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="font-body text-sm text-secondary transition-colors hover:text-crimson disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="font-body text-[11px] text-muted">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            className="font-body text-sm text-secondary transition-colors hover:text-crimson disabled:opacity-30"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
