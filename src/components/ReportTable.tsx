import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { classNames, formatNumber, formatTime, exportScreenshot } from '../utils';
import { BaseComponentProps, ExportOptions } from '../types';
import { Empty } from './common/Empty';

export interface ReportColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter?: (a: any, b: any) => number;
  type?: 'number' | 'text' | 'time' | 'status';
  unit?: string;
  decimals?: number;
}

export interface ReportTableProps extends BaseComponentProps {
  columns: ReportColumn[];
  dataSource: any[];
  title?: string;
  showIndex?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  showExport?: boolean;
  exportOptions?: ExportOptions;
  rowKey?: string;
  onRowClick?: (record: any, index: number) => void;
  onSort?: (field: string, order: 'asc' | 'desc' | null) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  columns = [],
  dataSource = [],
  title,
  showIndex = true,
  showPagination = true,
  pageSize = 10,
  showExport = true,
  exportOptions,
  rowKey = 'id',
  onRowClick,
  onSort,
  className,
  style,
  onClick,
  onReady,
}) => {
  const { theme, mode } = useTheme();
  const tableRef = React.useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const sortedData = useMemo(() => {
    if (!sortField || !sortOrder) return dataSource;
    const column = columns.find((c) => c.dataIndex === sortField);
    if (!column?.sorter) {
      return [...dataSource].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortOrder === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    return [...dataSource].sort((a, b) => {
      const result = column.sorter!(a, b);
      return sortOrder === 'asc' ? result : -result;
    });
  }, [dataSource, sortField, sortOrder, columns]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (column: ReportColumn) => {
    if (column.sorter === undefined && column.type === undefined) return;

    let newOrder: 'asc' | 'desc' | null = 'asc';
    if (sortField === column.dataIndex) {
      if (sortOrder === 'asc') newOrder = 'desc';
      else if (sortOrder === 'desc') newOrder = null;
    }

    setSortField(newOrder ? column.dataIndex : null);
    setSortOrder(newOrder);
    onSort?.(column.dataIndex, newOrder);
  };

  const handleExport = async () => {
    if (tableRef.current) {
      await exportScreenshot(tableRef.current, {
        filename: `${title || '报表'}`,
        ...exportOptions,
      });
    }
  };

  const renderCell = (column: ReportColumn, record: any, index: number) => {
    const value = record[column.dataIndex];

    if (column.render) {
      return column.render(value, record, index);
    }

    if (value === null || value === undefined) return '--';

    switch (column.type) {
      case 'number':
        return (
          <span style={{ fontFamily: 'monospace' }}>
            {formatNumber(value, column.decimals)}
            {column.unit ? ` ${column.unit}` : ''}
          </span>
        );
      case 'time':
        return formatTime(value);
      case 'status':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              backgroundColor: value === '正常' ? `${theme.colors.success}20` : `${theme.colors.warning}20`,
              color: value === '正常' ? theme.colors.success : theme.colors.warning,
            }}
          >
            {value}
          </span>
        );
      default:
        return value;
    }
  };

  if (dataSource.length === 0) {
    return (
      <div
        ref={tableRef}
        className={classNames('water-sdk-report-table', className)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          ...style,
        }}
      >
        <Empty text="暂无报表数据" />
      </div>
    );
  }

  return (
    <div
      ref={tableRef}
      className={classNames('water-sdk-report-table', className)}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {title && (
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
            {title}
          </h4>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
            共 {dataSource.length} 条
          </span>
          {showExport && (
            <button
              onClick={handleExport}
              style={{
                padding: '4px 12px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                backgroundColor: 'transparent',
                color: theme.colors.text.primary,
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              📷 导出
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: mode === 'dark' ? '#2a2a2a' : '#fafafa' }}>
              {showIndex && (
                <th
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.colors.text.secondary,
                    borderBottom: `1px solid ${theme.colors.border}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  序号
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key || column.dataIndex}
                  onClick={() => handleSort(column)}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    textAlign: column.align || 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.colors.text.secondary,
                    borderBottom: `1px solid ${theme.colors.border}`,
                    whiteSpace: 'nowrap',
                    cursor: column.sorter !== undefined || column.type ? 'pointer' : 'default',
                    width: column.width,
                  }}
                >
                  {column.title}
                  {sortField === column.dataIndex && sortOrder && (
                    <span style={{ marginLeft: '4px' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((record, index) => {
              const actualIndex = (currentPage - 1) * pageSize + index;
              return (
                <tr
                  key={record[rowKey] || index}
                  onClick={() => {
                    onRowClick?.(record, actualIndex);
                    onClick?.(record);
                  }}
                  style={{
                    cursor: onRowClick || onClick ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.colors.primary}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {showIndex && (
                    <td
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        textAlign: 'center',
                        fontSize: '12px',
                        color: theme.colors.text.secondary,
                        borderBottom: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      {actualIndex + 1}
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key || column.dataIndex}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        textAlign: column.align || 'left',
                        fontSize: '12px',
                        color: theme.colors.text.primary,
                        borderBottom: `1px solid ${theme.colors.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {renderCell(column, record, actualIndex)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: theme.spacing.xs,
          }}
        >
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            style={{
              padding: '4px 8px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: currentPage === 1 ? theme.colors.text.disabled : theme.colors.text.primary,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
          >
            首页
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '4px 8px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: currentPage === 1 ? theme.colors.text.disabled : theme.colors.text.primary,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
          >
            上一页
          </button>
          <span style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '0 8px' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '4px 8px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: currentPage === totalPages ? theme.colors.text.disabled : theme.colors.text.primary,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
          >
            下一页
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              padding: '4px 8px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: currentPage === totalPages ? theme.colors.text.disabled : theme.colors.text.primary,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
          >
            末页
          </button>
        </div>
      )}
    </div>
  );
};
