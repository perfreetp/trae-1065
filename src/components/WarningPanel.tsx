import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useLinkage } from '../context/LinkageContext';
import { classNames, formatTime, getWarningColor } from '../utils';
import { BaseComponentProps } from '../types';
import { Empty } from './common/Empty';

export interface WarningItem {
  id: string;
  title: string;
  level: 'normal' | 'attention' | 'warning' | 'danger' | 'severe';
  content: string;
  stationId?: string;
  stationName?: string;
  time: string;
  handleStatus?: 'unhandled' | 'handling' | 'handled';
  handled?: boolean;
  handler?: string;
  handleTime?: string;
  type?: string;
  value?: number;
  threshold?: number;
  unit?: string;
}

export interface WarningPanelProps extends BaseComponentProps {
  warnings: WarningItem[];
  title?: string;
  showCount?: boolean;
  showFilter?: boolean;
  maxHeight?: number;
  onWarningClick?: (warning: WarningItem) => void;
  onHandle?: (warning: WarningItem, newStatus: 'handling' | 'handled') => void;
}

const levelLabels: Record<string, string> = {
  normal: '正常',
  attention: '注意',
  warning: '预警',
  danger: '危险',
  severe: '特急',
};

export const WarningPanel: React.FC<WarningPanelProps> = ({
  warnings = [],
  title = '预警信息',
  showCount = true,
  showFilter = true,
  maxHeight = 400,
  onWarningClick,
  onHandle,
  className,
  style,
  onClick,
  onReady,
}) => {
  const { theme } = useTheme();
  const { setSelectedStationId, highlightedWarningId, setHighlightedWarningId, focusStationByWarning, selectedStationId } = useLinkage();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterHandleStatus, setFilterHandleStatus] = useState<'all' | 'unhandled' | 'handling' | 'handled'>('all');

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const getEffectiveHandleStatus = (w: WarningItem): 'unhandled' | 'handling' | 'handled' => {
    if (w.handleStatus) return w.handleStatus;
    return w.handled ? 'handled' : 'unhandled';
  };

  const filteredWarnings = useMemo(() => {
    return warnings.filter((w) => {
      if (filterLevel !== 'all' && w.level !== filterLevel) return false;
      if (filterHandleStatus !== 'all' && getEffectiveHandleStatus(w) !== filterHandleStatus) return false;
      return true;
    });
  }, [warnings, filterLevel, filterHandleStatus]);

  const warningCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: warnings.length,
      normal: 0,
      attention: 0,
      warning: 0,
      danger: 0,
      severe: 0,
      unhandled: 0,
      handling: 0,
      handled: 0,
    };
    warnings.forEach((w) => {
      counts[w.level] = (counts[w.level] || 0) + 1;
      const status = getEffectiveHandleStatus(w);
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [warnings]);

  const handleWarningClick = (warning: WarningItem) => {
    setHighlightedWarningId(warning.id);
    if (warning.stationId) {
      focusStationByWarning(warning.stationId, warning.time);
    }
    onWarningClick?.(warning);
    onClick?.(warning);
  };

  if (warnings.length === 0) {
    return (
      <div
        className={classNames('water-sdk-warning-panel', className)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          ...style,
        }}
      >
        <Empty text="暂无预警信息" />
      </div>
    );
  }

  return (
    <div
      className={classNames('water-sdk-warning-panel', className)}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
            {title}
          </span>
          {showCount && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                backgroundColor: `${theme.colors.danger}20`,
                color: theme.colors.danger,
              }}
            >
              {warningCounts.unhandled} 未处理
            </span>
          )}
        </div>
      </div>

      {showFilter && (
        <div
          style={{
            padding: theme.spacing.sm,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            gap: theme.spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          {(['all', 'severe', 'danger', 'warning', 'attention', 'normal'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              style={{
                padding: '2px 10px',
                border: `1px solid ${filterLevel === level ? getWarningColor(level) : theme.colors.border}`,
                borderRadius: '12px',
                backgroundColor: filterLevel === level ? `${getWarningColor(level)}15` : 'transparent',
                color: filterLevel === level ? getWarningColor(level) : theme.colors.text.secondary,
                cursor: 'pointer',
                fontSize: '11px',
                transition: 'all 0.2s',
              }}
            >
              {levelLabels[level] || '全部'}
              {showCount && ` (${warningCounts[level] || 0})`}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {(['all', 'unhandled', 'handling', 'handled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterHandleStatus(status)}
              style={{
                padding: '2px 10px',
                border: `1px solid ${filterHandleStatus === status ? theme.colors.primary : theme.colors.border}`,
                borderRadius: '12px',
                backgroundColor: filterHandleStatus === status ? `${theme.colors.primary}15` : 'transparent',
                color: filterHandleStatus === status ? theme.colors.primary : theme.colors.text.secondary,
                cursor: 'pointer',
                fontSize: '11px',
                transition: 'all 0.2s',
              }}
            >
              {status === 'all' ? '全部' : status === 'unhandled' ? '未处理' : status === 'handling' ? '处理中' : '已处理'}
              {showCount && ` (${warningCounts[status] || 0})`}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxHeight, overflowY: 'auto' }}>
        {filteredWarnings.length === 0 ? (
          <Empty text="暂无符合条件的预警" />
        ) : (
          filteredWarnings.map((warning) => {
            const handleStatus = getEffectiveHandleStatus(warning);
            const isHighlighted =
              warning.id === highlightedWarningId ||
              (selectedStationId && warning.stationId === selectedStationId);
            return (
              <div
                key={warning.id}
                className={classNames(
                  'water-sdk-warning-item',
                  handleStatus === 'handled' && 'water-sdk-warning-item--handled'
                )}
                onClick={() => handleWarningClick(warning)}
                style={{
                  padding: theme.spacing.md,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  cursor: 'pointer',
                  opacity: handleStatus === 'handled' ? 0.6 : 1,
                  transition: 'all 0.2s',
                  backgroundColor: isHighlighted
                    ? `${theme.colors.primary}20`
                    : `${getWarningColor(warning.level)}08`,
                  borderLeft: `3px solid ${
                    isHighlighted ? theme.colors.primary : getWarningColor(warning.level)
                  }`,
                  boxShadow: isHighlighted ? `0 0 0 1px ${theme.colors.primary}40` : 'none',
                }}
              >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: '6px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: `${getWarningColor(warning.level)}20`,
                    color: getWarningColor(warning.level),
                  }}
                >
                  {levelLabels[warning.level] || warning.level}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: theme.colors.text.primary, flex: 1 }}>
                  {warning.title}
                </span>
                <span style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
                  {formatTime(warning.time, 'MM-DD HH:mm')}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '12px', color: theme.colors.text.secondary, lineHeight: 1.6 }}>
                {warning.content}
              </p>

              {warning.stationName && (
                <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginTop: '6px' }}>
                  站点：{warning.stationName}
                  {warning.value !== undefined && warning.threshold !== undefined && (
                    <span style={{ marginLeft: '12px' }}>
                      当前值：{warning.value}{warning.unit || ''} / 阈值：{warning.threshold}{warning.unit || ''}
                    </span>
                  )}
                </div>
              )}

              {handleStatus === 'handled' ? (
                <div style={{ fontSize: '11px', color: theme.colors.success, marginTop: '6px' }}>
                  ✓ 已处理 {warning.handler ? `by ${warning.handler}` : ''}
                  {warning.handleTime && ` · ${formatTime(warning.handleTime, 'MM-DD HH:mm')}`}
                </div>
              ) : handleStatus === 'handling' ? (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: theme.colors.warning }}>
                    🔄 处理中 {warning.handler ? `by ${warning.handler}` : ''}
                    {warning.handleTime && ` · ${formatTime(warning.handleTime, 'MM-DD HH:mm')}`}
                  </span>
                  {onHandle && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onHandle(warning, 'handled');
                      }}
                      style={{
                        padding: '2px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: theme.colors.success,
                        color: '#fff',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      标记完成
                    </button>
                  )}
                </div>
              ) : (
                onHandle && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onHandle(warning, 'handling');
                      }}
                      style={{
                        padding: '4px 10px',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: theme.colors.text.secondary,
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      开始处理
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onHandle(warning, 'handled');
                      }}
                      style={{
                        padding: '4px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: theme.colors.success,
                        color: '#fff',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      直接完成
                    </button>
                  </div>
                )
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};
