"use client";
import React, { type ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
};

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="p-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-rec-bg-subtle" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Sin resultados",
  onRowClick,
}: Props<T>) {
  return (
    <div className="overflow-x-auto sec-table">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="p-2 text-left">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonRows cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td className="p-3 text-center" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className={`border-t border-rec-border-default${onRowClick ? " cursor-pointer" : ""}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-2">
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as ReactNode) ?? ""}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
