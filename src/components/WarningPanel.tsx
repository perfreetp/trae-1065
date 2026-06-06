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
  onHandle?: (warning: WarningItem) => void;
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
  const { setSelectedStationId } = useLinkage();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [onlyUnhandled, setOnlyUnhandled] = useState(false);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const filteredWarnings = useMemo(() => {
    return warnings.filter((w) => {
      if (filterLevel !== 'all' && w.level !== filterLevel) return false;
      if (onlyUnhandled && w.handled) return false;
      return true;
    });
  }, [warnings, filterLevel, onlyUnhandled]);

  const warningCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: warnings.length,
      normal: 0,
      attention: 0,
      warning: 0,
      danger: 0,
      severe: 0,
      unhandled: warnings.filter((w) => !w.handled).length,
    };
    warnings.forEach((w) => {
      counts[w.level] = (counts[w.level] || 0) + 1;
    });
    return counts;
  }, [warnings]);

  const handleWarningClick = (warning: WarningItem) => {
    if (warning.stationId) {
      setSelectedStationId(warning.stationId);
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
          <button
            onClick={() => setOnlyUnhandled(!onlyUnhandled)}
            style={{
              padding: '2px 10px',
              border: `1px solid ${onlyUnhandled ? theme.colors.primary : theme.colors.border}`,
              borderRadius: '12px',
              backgroundColor: onlyUnhandled ? `${theme.colors.primary}15` : 'transparent',
              color: onlyUnhandled ? theme.colors.primary : theme.colors.text.secondary,
              cursor: 'pointer',
              fontSize: '11px',
              marginLeft: 'auto',
            }}
          >
            仅显示未处理
          </button>
        </div>
      )}

      <div style={{ maxHeight, overflowY: 'auto' }}>
        {filteredWarnings.length === 0 ? (
          <Empty text="暂无符合条件的预警" />
        ) : (
          filteredWarnings.map((warning) => (
            <div
              key={warning.id}
              className={classNames(
                'water-sdk-warning-item',
                warning.handled && 'water-sdk-warning-item--handled'
              )}
              onClick={() => handleWarningClick(warning)}
              style={{
                padding: theme.spacing.md,
                borderBottom: `1px solid ${theme.colors.border}`,
                cursor: 'pointer',
                opacity: warning.handled ? 0.6 : 1,
                transition: 'all 0.2s',
                backgroundColor: `${getWarningColor(warning.level)}08`,
                borderLeft: `3px solid ${getWarningColor(warning.level)}`,
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

              {warning.handled ? (
                <div style={{ fontSize: '11px', color: theme.colors.success, marginTop: '6px' }}>
                  ✓ 已处理 {warning.handler ? `by ${warning.handler}` : ''}
                  {warning.handleTime && ` at ${formatTime(warning.handleTime, 'MM-DD HH:mm')}`}
                </div>
              ) : (
                onHandle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHandle(warning);
                    }}
                    style={{
                      marginTop: '8px',
                      padding: '4px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: theme.colors.primary,
                      color: '#fff',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    处理
                  </button>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
