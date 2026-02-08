import { useState, useMemo } from "react";
import type { QueryResult } from "../services/interfaces/database.service";

interface QueryResultTableProps {
  result: QueryResult;
  className?: string;
}

type SortOrder = "asc" | "desc" | null;

export function QueryResultTable({ result, className = "" }: QueryResultTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [filterText, setFilterText] = useState("");
  const [copied, setCopied] = useState(false);

  // Apply filter
  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return result.rows;

    const lowerFilter = filterText.toLowerCase();
    return result.rows.filter((row: any[]) =>
      row.some((cell: any) => String(cell ?? "").toLowerCase().includes(lowerFilter))
    );
  }, [result.rows, filterText]);

  // Apply sorting
  const sortedRows = useMemo(() => {
    if (sortColumn === null || sortOrder === null) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null values
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortOrder === "asc" ? 1 : -1;
      if (bVal === null) return sortOrder === "asc" ? -1 : 1;

      // String comparison
      const aStr = String(aVal);
      const bStr = String(bVal);

      // Try numeric comparison
      const aNum = parseFloat(aStr);
      const bNum = parseFloat(bStr);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      }

      // String comparison
      return sortOrder === "asc"
        ? aStr.localeCompare(bStr, "zh-CN")
        : bStr.localeCompare(aStr, "zh-CN");
    });
  }, [filteredRows, sortColumn, sortOrder]);

  // Apply pagination
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedRows.slice(startIndex, endIndex);
  }, [sortedRows, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      // Toggle order
      setSortOrder((prev) => {
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
      if (sortOrder === "desc") setSortColumn(null);
    } else {
      setSortColumn(columnIndex);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const handleCopy = async () => {
    const csvContent = [
      result.columns.join(","),
      ...result.rows.map((row: any[]) =>
        row.map((cell: any) =>
          cell === null ? "NULL" : `"${String(cell).replace(/"/g, '""')}"`
        ).join(",")
      )
    ].join("\n");

    try {
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      result.columns.join(","),
      ...result.rows.map((row: any[]) =>
        row.map((cell: any) =>
          cell === null ? "NULL" : `"${String(cell).replace(/"/g, '""')}"`
        ).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `query_result_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(
      result.rows.map((row: any[]) => {
        const obj: Record<string, any> = {};
        result.columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      }),
      null,
      2
    );

    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `query_result_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Determine cell type for styling
  const getCellType = (value: any): "string" | "number" | "boolean" | "null" | "date" => {
    if (value === null) return "null";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";

    const str = String(value);
    const dateMatch = str.match(/^\d{4}-\d{2}-\d{2}/);
    if (dateMatch && !isNaN(Date.parse(str))) return "date";

    // Check if it's a number string
    if (!isNaN(parseFloat(str)) && isFinite(str as any)) return "number";

    return "string";
  };

  const getCellClassName = (value: any): string => {
    const type = getCellType(value);

    const baseClasses = "px-3 py-2 text-sm";

    const typeClasses = {
      string: "text-slate-700 dark:text-slate-300",
      number: "text-blue-600 dark:text-blue-400 font-mono",
      boolean: "text-purple-600 dark:text-purple-400 font-medium",
      null: "text-slate-400 italic",
      date: "text-green-600 dark:text-green-400 font-mono",
    };

    return `${baseClasses} ${typeClasses[type]}`;
  };

  const formatCellValue = (value: any): string => {
    if (value === null) return "NULL";
    return String(value);
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header with stats and actions */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              查询结果
            </h4>
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span>执行时间: {result.executionTime}ms</span>
              {result.affectedRows !== undefined && (
                <span>影响行数: {result.affectedRows}</span>
              )}
              <span>总行数: {filteredRows.length}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="复制为CSV"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制
                </>
              )}
            </button>
            <div className="relative group">
              <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg"
                >
                  导出 CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-lg"
                >
                  导出 JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="筛选结果..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Data table */}
      {result.rows.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          查询执行成功，但未返回结果
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-100 dark:bg-slate-700">
              <tr>
                {result.columns.map((column: string, index: number) => (
                  <th
                    key={column}
                    onClick={() => handleSort(index)}
                    className="px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>{column}</span>
                      {sortColumn === index && sortOrder && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortOrder === "asc" ? (
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          ) : (
                            <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row: any[], rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className={`border-b border-slate-200 dark:border-slate-700 ${
                    rowIndex % 2 === 0
                      ? "bg-white dark:bg-slate-800"
                      : "bg-slate-50 dark:bg-slate-750"
                  }`}
                >
                  {row.map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className={getCellClassName(cell)}>
                      {formatCellValue(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {sortedRows.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                每页显示:
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                共 {sortedRows.length} 行
              </span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary-600 text-white"
                          : "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Current page info */}
            <span className="text-sm text-slate-600 dark:text-slate-400">
              第 {currentPage} / {totalPages} 页
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
