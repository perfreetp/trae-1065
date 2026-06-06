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
import { Station, BaseComponentProps, ReservoirExtra, GateExtra, PumpExtra, RainExtra, WaterExtra, RiskExtra } from '../types';
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

  const renderReservoirContent = (extra: ReservoirExtra) => (
    <>
      {extra.waterLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>当前水位</span>
          <span style={{ color: theme.colors.text.primary, fontWeight: 500 }}>
            {formatNumber(extra.waterLevel)} m
          </span>
        </div>
      )}
      {extra.storage !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>当前库容</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.storage)} 万m³
          </span>
        </div>
      )}
      {extra.storagePercent !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>蓄水率</span>
          <span style={{ color: extra.storagePercent > 80 ? theme.colors.warning : theme.colors.success }}>
            {formatNumber(extra.storagePercent, 1)} %
          </span>
        </div>
      )}
      {extra.floodLimitLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>汛限水位</span>
          <span style={{ color: theme.colors.text.secondary }}>
            {formatNumber(extra.floodLimitLevel)} m
          </span>
        </div>
      )}
      {extra.normalLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>正常蓄水位</span>
          <span style={{ color: theme.colors.text.secondary }}>
            {formatNumber(extra.normalLevel)} m
          </span>
        </div>
      )}
      {extra.inflow !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>入库流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.inflow)} m³/s
          </span>
        </div>
      )}
      {extra.outflow !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>出库流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.outflow)} m³/s
          </span>
        </div>
      )}
    </>
  );

  const renderGateContent = (extra: GateExtra) => (
    <>
      {extra.opening !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>开启高度</span>
          <span style={{ color: theme.colors.text.primary, fontWeight: 500 }}>
            {formatNumber(extra.opening)} m
          </span>
        </div>
      )}
      {extra.openingPercent !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>开度</span>
          <span style={{ color: extra.openingPercent > 50 ? theme.colors.success : theme.colors.warning }}>
            {formatNumber(extra.openingPercent, 1)} %
          </span>
        </div>
      )}
      {extra.gateCount !== undefined && extra.openCount !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>闸门状态</span>
          <span style={{ color: theme.colors.text.primary }}>
            {extra.openCount}/{extra.gateCount} 孔开启
          </span>
        </div>
      )}
      {extra.discharge !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>泄流流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.discharge)} m³/s
          </span>
        </div>
      )}
      {extra.status && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>运行状态</span>
          <span
            style={{
              color: extra.status === 'open' ? theme.colors.success : extra.status === 'closed' ? theme.colors.text.secondary : theme.colors.warning,
            }}
          >
            {extra.status === 'open' ? '全开' : extra.status === 'closed' ? '全关' : '部分开启'}
          </span>
        </div>
      )}
    </>
  );

  const renderPumpContent = (extra: PumpExtra) => (
    <>
      {extra.runningCount !== undefined && extra.totalCount !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>运行台数</span>
          <span style={{ color: theme.colors.text.primary, fontWeight: 500 }}>
            {extra.runningCount}/{extra.totalCount} 台
          </span>
        </div>
      )}
      {extra.flowRate !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>总流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.flowRate)} m³/h
          </span>
        </div>
      )}
      {extra.power !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>总功率</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.power)} kW
          </span>
        </div>
      )}
      {extra.status && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>运行状态</span>
          <span
            style={{
              color: extra.status === 'running' ? theme.colors.success : extra.status === 'stopped' ? theme.colors.text.secondary : theme.colors.warning,
            }}
          >
            {extra.status === 'running' ? '运行中' : extra.status === 'stopped' ? '已停机' : '部分运行'}
          </span>
        </div>
      )}
    </>
  );

  const renderRainContent = (extra: RainExtra) => (
    <>
      {extra.rainfall1h !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>1小时降雨</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.rainfall1h)} mm
          </span>
        </div>
      )}
      {extra.rainfall6h !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>6小时降雨</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.rainfall6h)} mm
          </span>
        </div>
      )}
      {extra.rainfall24h !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>24小时降雨</span>
          <span style={{ color: theme.colors.primary, fontWeight: 500 }}>
            {formatNumber(extra.rainfall24h)} mm
          </span>
        </div>
      )}
      {extra.rainfallTotal !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>累计降雨</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.rainfallTotal)} mm
          </span>
        </div>
      )}
    </>
  );

  const renderWaterContent = (extra: WaterExtra) => (
    <>
      {extra.waterLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>水位</span>
          <span style={{ color: theme.colors.text.primary, fontWeight: 500 }}>
            {formatNumber(extra.waterLevel)} m
          </span>
        </div>
      )}
      {extra.flowRate !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.flowRate)} m³/s
          </span>
        </div>
      )}
      {extra.velocity !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>流速</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.velocity)} m/s
          </span>
        </div>
      )}
      {extra.waterTemperature !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>水温</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(extra.waterTemperature)} °C
          </span>
        </div>
      )}
    </>
  );

  const renderRiskContent = (extra: RiskExtra) => (
    <>
      {extra.riskType && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>风险类型</span>
          <span style={{ color: theme.colors.text.primary }}>{extra.riskType}</span>
        </div>
      )}
      {extra.riskLevel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>风险等级</span>
          <span style={{ color: theme.colors.danger, fontWeight: 500 }}>{extra.riskLevel}</span>
        </div>
      )}
      {extra.affectedPeople !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>影响人口</span>
          <span style={{ color: theme.colors.text.primary }}>{extra.affectedPeople} 人</span>
        </div>
      )}
      {extra.displacement !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>位移量</span>
          <span style={{ color: theme.colors.warning }}>{formatNumber(extra.displacement)} mm</span>
        </div>
      )}
    </>
  );

  const renderTypedContent = () => {
    if (!station?.extra) return null;
    switch (station.type) {
      case 'reservoir':
        return renderReservoirContent(station.extra as ReservoirExtra);
      case 'gate':
        return renderGateContent(station.extra as GateExtra);
      case 'pump':
        return renderPumpContent(station.extra as PumpExtra);
      case 'rain':
        return renderRainContent(station.extra as RainExtra);
      case 'water':
        return renderWaterContent(station.extra as WaterExtra);
      case 'risk':
        return renderRiskContent(station.extra as RiskExtra);
      default:
        return null;
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

  const mainValue = station.value;
  const mainUnit = station.unit || (station.type === 'rain' ? 'mm' : station.type === 'water' ? 'm' : '');

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

      {mainValue !== undefined && (
        <div style={{ marginBottom: theme.spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing.xs }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: typeColor }}>
              {formatNumber(mainValue)}
            </span>
            <span style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
              {mainUnit}
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
          {renderTypedContent()}

          {extraFields.map((field) => (
            <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
              <span style={{ color: theme.colors.text.secondary }}>{field.label}</span>
              <span style={{ color: theme.colors.text.primary }}>
                {station[field.key] !== undefined ? formatNumber(station[field.key]) : '--'}
                {field.unit || ''}
              </span>
            </div>
          ))}

          {station.updateTime && !station.extra && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
              <span style={{ color: theme.colors.text.secondary }}>更新时间</span>
              <span style={{ color: theme.colors.text.primary }}>
                {formatTime(station.updateTime, 'MM-DD HH:mm')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
