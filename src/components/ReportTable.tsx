import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useLinkage } from '../context/LinkageContext';
import { useDataFilter } from '../context/DataContext';
import { classNames, formatNumber, formatTime, exportScreenshot } from '../utils';
import { BaseComponentProps, ExportOptions, WarningLevel, StationType } from '../types';
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
  exportable?: boolean;
}

export interface ReportFilter {
  types?: StationType[];
  statuses?: WarningLevel[];
  timeRange?: { start?: string; end?: string };
  timeField?: string;
  typeField?: string;
  statusField?: string;
  stationIds?: string[];
  stationIdField?: string;
}

export interface ReportTableProps extends BaseComponentProps {
  columns: ReportColumn[];
  dataSource: any[];
  title?: string;
  showIndex?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  showExport?: boolean;
  showFilter?: boolean;
  showSummary?: boolean;
  filterOptions?: ReportFilter;
  exportOptions?: ExportOptions;
  rowKey?: string;
  useGlobalFilter?: boolean;
  summaryFields?: { valueField: string; typeField?: string; statusField?: string }[];
  onRowClick?: (record: any, index: number) => void;
  onSort?: (field: string, order: 'asc' | 'desc' | null) => void;
  onFilter?: (filter: ReportFilter) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  columns = [],
  dataSource = [],
  title,
  showIndex = true,
  showPagination = true,
  pageSize = 10,
  showExport = true,
  showFilter = true,
  showSummary = true,
  filterOptions = {},
  exportOptions,
  rowKey = 'id',
  useGlobalFilter = false,
  summaryFields = [],
  onRowClick,
  onSort,
  onFilter,
  className,
  style,
  onClick,
  onReady,
}) => {
  const { theme, mode } = useTheme();
  const { selectedStationId, setSelectedStationId } = useLinkage();
  const { filters: globalFilters } = useDataFilter();
  const tableRef = React.useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [localFilter, setLocalFilter] = useState<ReportFilter>(filterOptions);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [exportMode, setExportMode] = useState<'detail' | 'summary' | 'both'>('detail');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const activeFilter = useMemo(() => {
    if (useGlobalFilter) {
      return {
        types: globalFilters.selectedTypes.length > 0 ? globalFilters.selectedTypes : undefined,
        statuses: globalFilters.selectedStatuses.length > 0 ? globalFilters.selectedStatuses : undefined,
        timeRange: globalFilters.timeRange,
        stationIds: globalFilters.selectedStationIds.length > 0 ? globalFilters.selectedStationIds : undefined,
        ...localFilter,
      };
    }
    return localFilter;
  }, [useGlobalFilter, globalFilters, localFilter]);

  const filteredData = useMemo(() => {
    return dataSource.filter((record) => {
      if (activeFilter.stationIds && activeFilter.stationIds.length > 0 && activeFilter.stationIdField) {
        if (!activeFilter.stationIds.includes(record[activeFilter.stationIdField])) return false;
      }
      if (activeFilter.types && activeFilter.types.length > 0 && activeFilter.typeField) {
        if (!activeFilter.types.includes(record[activeFilter.typeField])) return false;
      }
      if (activeFilter.statuses && activeFilter.statuses.length > 0 && activeFilter.statusField) {
        if (!activeFilter.statuses.includes(record[activeFilter.statusField])) return false;
      }
      if (activeFilter.timeRange && activeFilter.timeField) {
        const time = new Date(record[activeFilter.timeField]).getTime();
        if (activeFilter.timeRange.start) {
          const start = new Date(activeFilter.timeRange.start).getTime();
          if (time < start) return false;
        }
        if (activeFilter.timeRange.end) {
          const end = new Date(activeFilter.timeRange.end).getTime();
          if (time > end) return false;
        }
      }
      return true;
    });
  }, [dataSource, activeFilter]);

  const sortedData = useMemo(() => {
    if (!sortField || !sortOrder) return filteredData;
    const column = columns.find((c) => c.dataIndex === sortField);
    if (!column?.sorter) {
      return [...filteredData].sort((a, b) => {
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
    return [...filteredData].sort((a, b) => {
      const result = column.sorter!(a, b);
      return sortOrder === 'asc' ? result : -result;
    });
  }, [filteredData, sortField, sortOrder, columns]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const summaryByType = useMemo(() => {
    const typeField = filterOptions.typeField || 'type';
    const statusField = filterOptions.statusField || 'status';
    const result: Record<string, {
      count: number;
      valueRange: { min: number; max: number } | null;
      abnormalCount: number;
      typeName: string;
    }> = {};

    const typeNames: Record<string, string> = {
      rain: '雨量站',
      water: '水位站',
      reservoir: '水库',
      gate: '闸门',
      pump: '泵站',
      risk: '风险点',
    };

    filteredData.forEach((record) => {
      const type = record[typeField] || 'unknown';
      const status = record[statusField];
      const value = summaryFields.length > 0 ? record[summaryFields[0].valueField] : null;

      if (!result[type]) {
        result[type] = {
          count: 0,
          valueRange: null,
          abnormalCount: 0,
          typeName: typeNames[type] || type,
        };
      }

      result[type].count++;

      if (typeof value === 'number') {
        if (result[type].valueRange === null) {
          result[type].valueRange = { min: value, max: value };
        } else {
          result[type].valueRange.min = Math.min(result[type].valueRange.min, value);
          result[type].valueRange.max = Math.max(result[type].valueRange.max, value);
        }
      }

      if (status === 'warning' || status === 'danger' || status === '预警' || status === '危险') {
        result[type].abnormalCount++;
      }
    });

    return result;
  }, [filteredData, filterOptions, summaryFields]);

  const summaryByStatus = useMemo(() => {
    const statusField = filterOptions.statusField || 'status';
    const result: Record<string, number> = {
      normal: 0,
      attention: 0,
      warning: 0,
      danger: 0,
    };

    const statusMap: Record<string, string> = {
      正常: 'normal',
      注意: 'attention',
      预警: 'warning',
      危险: 'danger',
    };

    filteredData.forEach((record) => {
      const status = record[statusField];
      const mappedStatus = statusMap[status] || status || 'normal';
      if (result[mappedStatus] !== undefined) {
        result[mappedStatus]++;
      }
    });

    return result;
  }, [filteredData, filterOptions]);

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

  const exportToCSV = () => {
    const exportableColumns = columns.filter((c) => c.exportable !== false);
    let csvParts: string[] = [];

    if (exportMode === 'summary' || exportMode === 'both') {
      csvParts.push('=== 汇总统计 ===');
      csvParts.push('按类型统计:');
      csvParts.push('类型,数量,异常数,最小值,最大值');
      Object.entries(summaryByType).forEach(([type, data]) => {
        const minVal = data.valueRange ? data.valueRange.min : '-';
        const maxVal = data.valueRange ? data.valueRange.max : '-';
        csvParts.push(`${data.typeName},${data.count},${data.abnormalCount},${minVal},${maxVal}`);
      });
      csvParts.push('');
      csvParts.push('按状态统计:');
      csvParts.push('状态,数量');
      csvParts.push(`正常,${summaryByStatus.normal}`);
      csvParts.push(`注意,${summaryByStatus.attention}`);
      csvParts.push(`预警,${summaryByStatus.warning}`);
      csvParts.push(`危险,${summaryByStatus.danger}`);
      if (exportMode === 'both') csvParts.push('');
    }

    if (exportMode === 'detail' || exportMode === 'both') {
      if (exportMode === 'both') csvParts.push('=== 明细数据 ===');
      const headers = exportableColumns.map((c) => c.title).join(',');
      const rows = sortedData.map((record) =>
        exportableColumns
          .map((col) => {
            const value = record[col.dataIndex];
            if (value === null || value === undefined) return '';
            const strValue = String(value).replace(/"/g, '""');
            return `"${strValue}"`;
          })
          .join(',')
      );
      csvParts.push(headers, ...rows);
    }

    const csv = csvParts.join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title || '报表'}_${formatTime(new Date().toISOString(), 'YYYY-MM-DD')}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const handleExportScreenshot = async () => {
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
              backgroundColor:
                value === '正常' || value === 'normal'
                  ? `${theme.colors.success}20`
                  : `${theme.colors.warning}20`,
              color:
                value === '正常' || value === 'normal' ? theme.colors.success : theme.colors.warning,
            }}
          >
            {value}
          </span>
        );
      default:
        return value;
    }
  };

  const handleFilterChange = (key: keyof ReportFilter, value: any) => {
    const newFilter = { ...localFilter, [key]: value };
    setLocalFilter(newFilter);
    onFilter?.(newFilter);
    setCurrentPage(1);
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
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          {title && (
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
              {title}
            </h4>
          )}
          <span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
            共 {sortedData.length} 条
            {filteredData.length !== dataSource.length && ` (已筛选 ${filteredData.length})`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          {showFilter && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              style={{
                padding: '4px 12px',
                border: `1px solid ${showFilterPanel ? theme.colors.primary : theme.colors.border}`,
                borderRadius: theme.radius.sm,
                backgroundColor: showFilterPanel ? `${theme.colors.primary}10` : 'transparent',
                color: showFilterPanel ? theme.colors.primary : theme.colors.text.primary,
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🔍 筛选
            </button>
          )}
          {showExport && (
            <>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
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
                  📄 导出CSV ▾
                </button>
                {showExportMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.sm,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      minWidth: '140px',
                    }}
                  >
                    {[
                      { key: 'detail', label: '仅导出明细' },
                      { key: 'summary', label: '仅导出汇总' },
                      { key: 'both', label: '明细+汇总' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => {
                          setExportMode(item.key as 'detail' | 'summary' | 'both');
                          exportToCSV();
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: exportMode === item.key ? theme.colors.primary : theme.colors.text.primary,
                          backgroundColor: exportMode === item.key ? `${theme.colors.primary}10` : 'transparent',
                          borderBottom: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        {exportMode === item.key ? '✓ ' : ''} {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleExportScreenshot}
                style={{
                  padding: '4px 12px',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                📷 截图
              </button>
            </>
          )}
        </div>
      </div>

      {showFilterPanel && (
        <div
          style={{
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: mode === 'dark' ? '#1a1a1a' : '#fafafa',
            display: 'flex',
            gap: theme.spacing.md,
            flexWrap: 'wrap',
          }}
        >
          {filterOptions.typeField && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>
                站点类型
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['rain', 'water', 'reservoir', 'gate', 'pump'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const current = localFilter.types || [];
                      const next = current.includes(type as StationType)
                        ? current.filter((t) => t !== type)
                        : [...current, type as StationType];
                      handleFilterChange('types', next.length > 0 ? next : undefined);
                    }}
                    style={{
                      padding: '2px 10px',
                      borderRadius: '10px',
                      border: `1px solid ${
                        localFilter.types?.includes(type as StationType)
                          ? theme.colors.primary
                          : theme.colors.border
                      }`,
                      backgroundColor: localFilter.types?.includes(type as StationType)
                        ? `${theme.colors.primary}15`
                        : 'transparent',
                      color: localFilter.types?.includes(type as StationType)
                        ? theme.colors.primary
                        : theme.colors.text.secondary,
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    {type === 'rain'
                      ? '雨量站'
                      : type === 'water'
                      ? '水位站'
                      : type === 'reservoir'
                      ? '水库'
                      : type === 'gate'
                      ? '闸门'
                      : '泵站'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filterOptions.statusField && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>
                状态
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['normal', 'attention', 'warning', 'danger'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      const current = localFilter.statuses || [];
                      const next = current.includes(status as WarningLevel)
                        ? current.filter((s) => s !== status)
                        : [...current, status as WarningLevel];
                      handleFilterChange('statuses', next.length > 0 ? next : undefined);
                    }}
                    style={{
                      padding: '2px 10px',
                      borderRadius: '10px',
                      border: `1px solid ${
                        localFilter.statuses?.includes(status as WarningLevel)
                          ? theme.colors.primary
                          : theme.colors.border
                      }`,
                      backgroundColor: localFilter.statuses?.includes(status as WarningLevel)
                        ? `${theme.colors.primary}15`
                        : 'transparent',
                      color: localFilter.statuses?.includes(status as WarningLevel)
                        ? theme.colors.primary
                        : theme.colors.text.secondary,
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    {status === 'normal'
                      ? '正常'
                      : status === 'attention'
                      ? '注意'
                      : status === 'warning'
                      ? '预警'
                      : '危险'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filterOptions.timeField && (
            <div style={{ flex: 2, minWidth: '300px' }}>
              <div style={{ fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>
                时间范围
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="datetime-local"
                  value={
                    localFilter.timeRange?.start
                      ? localFilter.timeRange.start.slice(0, 16)
                      : ''
                  }
                  onChange={(e) => {
                    const next = {
                      ...localFilter.timeRange,
                      start: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    } as { start?: string; end?: string };
                    if (!next.start && !next.end) {
                      handleFilterChange('timeRange', undefined);
                    } else {
                      handleFilterChange('timeRange', next);
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '4px 8px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text.primary,
                    fontSize: '12px',
                  }}
                />
                <span style={{ color: theme.colors.text.secondary, fontSize: '12px' }}>至</span>
                <input
                  type="datetime-local"
                  value={
                    localFilter.timeRange?.end
                      ? localFilter.timeRange.end.slice(0, 16)
                      : ''
                  }
                  onChange={(e) => {
                    const next = {
                      ...localFilter.timeRange,
                      end: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    } as { start?: string; end?: string };
                    if (!next.start && !next.end) {
                      handleFilterChange('timeRange', undefined);
                    } else {
                      handleFilterChange('timeRange', next);
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '4px 8px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text.primary,
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>
          )}

          {(localFilter.types?.length || localFilter.statuses?.length || localFilter.timeRange) && (
            <button
              onClick={() => {
                setLocalFilter({});
                onFilter?.({});
                setCurrentPage(1);
              }}
              style={{
                padding: '2px 10px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '10px',
                backgroundColor: 'transparent',
                color: theme.colors.text.secondary,
                cursor: 'pointer',
                fontSize: '11px',
                alignSelf: 'flex-end',
              }}
            >
              重置筛选
            </button>
          )}
        </div>
      )}

      {showSummary && filteredData.length > 0 && (
        <div
          style={{
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: mode === 'dark' ? '#1f1f1f' : '#f5f5f5',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
            📊 汇总分析
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '6px' }}>按类型统计</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(summaryByType).map(([type, data]) => (
                  <div
                    key={type}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.sm,
                      minWidth: '120px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '2px' }}>
                      {data.typeName}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
                      {data.count} 个
                      {data.abnormalCount > 0 && (
                        <span style={{ fontSize: '11px', color: theme.colors.danger, marginLeft: '6px' }}>
                          异常 {data.abnormalCount}
                        </span>
                      )}
                    </div>
                    {data.valueRange && (
                      <div style={{ fontSize: '10px', color: theme.colors.text.secondary, marginTop: '2px' }}>
                        值范围: {data.valueRange.min.toFixed(1)} ~ {data.valueRange.max.toFixed(1)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 0, minWidth: '200px' }}>
              <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '6px' }}>按状态统计</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { key: 'normal', label: '正常', color: theme.colors.success },
                  { key: 'attention', label: '注意', color: theme.colors.warning },
                  { key: 'warning', label: '预警', color: '#faad14' },
                  { key: 'danger', label: '危险', color: theme.colors.danger },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.sm,
                      textAlign: 'center',
                      flex: 1,
                    }}
                  >
                    <div style={{ fontSize: '11px', color: item.color, marginBottom: '2px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
                      {summaryByStatus[item.key]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
              const isHighlighted = record.stationId && record.stationId === selectedStationId;
              return (
                <tr
                  key={record[rowKey] || index}
                  onClick={() => {
                    if (record.stationId) {
                      setSelectedStationId(record.stationId);
                    }
                    onRowClick?.(record, actualIndex);
                    onClick?.(record);
                  }}
                  style={{
                    cursor: onRowClick || onClick ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                    backgroundColor: isHighlighted ? `${theme.colors.primary}15` : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isHighlighted) {
                      e.currentTarget.style.backgroundColor = `${theme.colors.primary}08`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isHighlighted) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
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

      {sortedData.length === 0 && <Empty text="暂无符合条件的数据" />}

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
