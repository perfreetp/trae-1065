import React, { useEffect, useMemo } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useLinkage } from '../context/LinkageContext';
import {
  classNames,
  formatNumber,
  formatTime,
  getWarningColor,
  getStationColor,
  calculateYoY,
} from '../utils';
import { Station, BaseComponentProps } from '../types';
import { Empty } from './common/Empty';

export interface StationCardProps extends BaseComponentProps {
  station?: Station;
  showYoY?: boolean;
  lastYearValue?: number;
  showDetails?: boolean;
  extraFields?: { label: string; key: string; unit?: string }[];
}

const stationTypeLabels: Record<string, string> = {
  rain: '雨量站',
  water: '水位站',
  reservoir: '水库',
  gate: '闸门',
  pump: '泵站',
  risk: '风险点',
};

export const StationCard: React.FC<StationCardProps> = ({
  station,
  showYoY = false,
  lastYearValue,
  showDetails = true,
  extraFields = [],
  className,
  style,
  onClick,
  onReady,
}) => {
  const { theme } = useTheme();
  const { selectedStationId, setSelectedStationId } = useLinkage();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const yoyValue = useMemo(() => {
    if (!showYoY || !station?.value || lastYearValue === undefined) return null;
    return calculateYoY(station.value, lastYearValue);
  }, [showYoY, station?.value, lastYearValue]);

  const isSelected = station && selectedStationId === station.id;
  const typeColor = station ? getStationColor(station.type) : theme.colors.primary;

  const handleClick = () => {
    if (station) {
      setSelectedStationId(station.id);
      onClick?.(station);
    }
  };

  if (!station) {
    return (
      <div
        className={classNames('water-sdk-station-card', className)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border}`,
          ...style,
        }}
      >
        <Empty text="请选择站点" />
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'water-sdk-station-card',
        isSelected && 'water-sdk-station-card--selected',
        className
      )}
      onClick={handleClick}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
        padding: theme.spacing.md,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? `0 0 0 2px ${theme.colors.primary}30` : 'none',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: typeColor,
          }}
        />
        <span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
          {stationTypeLabels[station.type] || station.type}
        </span>
        {station.status && (
          <span
            style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              backgroundColor: `${getWarningColor(station.status)}20`,
              color: getWarningColor(station.status),
            }}
          >
            {station.status}
          </span>
        )}
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.md,
        }}
      >
        {station.name}
      </h3>

      {station.value !== undefined && (
        <div style={{ marginBottom: theme.spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing.xs }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: typeColor }}>
              {formatNumber(station.value)}
            </span>
            <span style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
              {station.unit || ''}
            </span>
          </div>
          {yoyValue !== null && (
            <div style={{ fontSize: '12px', color: yoyValue >= 0 ? theme.colors.danger : theme.colors.success, marginTop: '4px' }}>
              {yoyValue >= 0 ? '↑' : '↓'} 同比 {Math.abs(yoyValue).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      {showDetails && (
        <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.sm }}>
          {station.value2 !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: theme.colors.text.secondary }}>流量</span>
              <span style={{ color: theme.colors.text.primary }}>
                {formatNumber(station.value2)} m³/s
              </span>
            </div>
          )}
          {station.updateTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: theme.colors.text.secondary }}>更新时间</span>
              <span style={{ color: theme.colors.text.primary }}>
                {formatTime(station.updateTime, 'MM-DD HH:mm')}
              </span>
            </div>
          )}
          {extraFields.map((field) => (
            <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
              <span style={{ color: theme.colors.text.secondary }}>{field.label}</span>
              <span style={{ color: theme.colors.text.primary }}>
                {station[field.key] !== undefined ? formatNumber(station[field.key]) : '--'}
                {field.unit || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
