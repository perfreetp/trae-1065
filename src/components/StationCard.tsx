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

  const renderReservoirContent = (extra: ReservoirExtra) => {
    const currentLevel = extra.currentLevel ?? extra.waterLevel;
    const currentStorage = extra.currentStorage ?? extra.storage;
    const storageRate = extra.storageRate ?? extra.storagePercent;
    const floodLimitLevel = extra.floodLimitLevel;
    const normalLevel = extra.normalLevel;
    const inflow = extra.inflow;
    const outflow = extra.outflow;
    const totalCapacity = extra.totalCapacity;

    return (
    <>
      {currentLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>当前水位</span>
          <span style={{ color: theme.colors.text.primary, fontWeight: 500 }}>
            {formatNumber(currentLevel)} m
          </span>
        </div>
      )}
      {currentStorage !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>当前库容</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(currentStorage)} 万m³
          </span>
        </div>
      )}
      {storageRate !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>蓄水率</span>
          <span style={{ color: storageRate > 80 ? theme.colors.warning : theme.colors.success }}>
            {formatNumber(storageRate, 1)} %
          </span>
        </div>
      )}
      {floodLimitLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>汛限水位</span>
          <span style={{ color: theme.colors.text.secondary }}>
            {formatNumber(floodLimitLevel)} m
          </span>
        </div>
      )}
      {normalLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>正常蓄水位</span>
          <span style={{ color: theme.colors.text.secondary }}>
            {formatNumber(normalLevel)} m
          </span>
        </div>
      )}
      {totalCapacity !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>总库容</span>
          <span style={{ color: theme.colors.text.secondary }}>
            {formatNumber(totalCapacity)} 万m³
          </span>
        </div>
      )}
      {inflow !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>入库流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(inflow)} m³/s
          </span>
        </div>
      )}
      {outflow !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>出库流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(outflow)} m³/s
          </span>
        </div>
      )}
    </>
  );
  };

  const renderGateContent = (extra: GateExtra) => {
    const openHeight = extra.openHeight ?? extra.opening;
    const openPercent = extra.openPercent ?? extra.openingPercent;
    const totalHoles = extra.totalHoles ?? extra.gateCount;
    const openHoles = extra.openHoles ?? extra.openCount;
    const dischargeFlow = extra.dischargeFlow ?? extra.discharge;
    const operationStatus = extra.operationStatus ?? extra.status;

    const statusLabel =
      operationStatus === 'open' || operationStatus === '全开'
        ? '全开'
        : operationStatus === 'closed' || operationStatus === '全关'
        ? '全关'
        : operationStatus === 'partial' || operationStatus === '部分开启'
        ? '部分开启'
        : operationStatus;

    return (
    <>
      {openHeight !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>开启高度</span>
          <span style={{ color: theme.colors.text.primary, fontWeight: 500 }}>
            {formatNumber(openHeight)} m
          </span>
        </div>
      )}
      {openPercent !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>开度</span>
          <span style={{ color: openPercent > 50 ? theme.colors.success : theme.colors.warning }}>
            {formatNumber(openPercent, 1)} %
          </span>
        </div>
      )}
      {totalHoles !== undefined && openHoles !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>闸门状态</span>
          <span style={{ color: theme.colors.text.primary }}>
            {openHoles}/{totalHoles} 孔开启
          </span>
        </div>
      )}
      {dischargeFlow !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>泄流流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(dischargeFlow)} m³/s
          </span>
        </div>
      )}
      {operationStatus && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>运行状态</span>
          <span
            style={{
              color:
                operationStatus === 'open' || operationStatus === '全开'
                  ? theme.colors.success
                  : operationStatus === 'closed' || operationStatus === '全关'
                  ? theme.colors.text.secondary
                  : theme.colors.warning,
            }}
          >
            {statusLabel}
          </span>
        </div>
      )}
    </>
  );
  };

  const renderPumpContent = (extra: PumpExtra) => {
    const runningPumps = extra.runningPumps ?? extra.runningCount;
    const totalPumps = extra.totalPumps ?? extra.totalCount;
    const totalFlow = extra.totalFlow ?? extra.flowRate;
    const totalPower = extra.totalPower ?? extra.power;
    const operationStatus = extra.operationStatus ?? extra.status;

    const statusLabel =
      operationStatus === 'running' || operationStatus === '运行中'
        ? '运行中'
        : operationStatus === 'stopped' || operationStatus === '已停机'
        ? '已停机'
        : operationStatus === 'partial' || operationStatus === '部分运行'
        ? '部分运行'
        : operationStatus;

    return (
    <>
      {runningPumps !== undefined && totalPumps !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>运行台数</span>
          <span style={{ color: theme.colors.text.primary, fontWeight: 500 }}>
            {runningPumps}/{totalPumps} 台
          </span>
        </div>
      )}
      {totalFlow !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>总流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(totalFlow)} m³/h
          </span>
        </div>
      )}
      {totalPower !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>总功率</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(totalPower)} kW
          </span>
        </div>
      )}
      {operationStatus && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>运行状态</span>
          <span
            style={{
              color:
                operationStatus === 'running' || operationStatus === '运行中'
                  ? theme.colors.success
                  : operationStatus === 'stopped' || operationStatus === '已停机'
                  ? theme.colors.text.secondary
                  : theme.colors.warning,
            }}
          >
            {statusLabel}
          </span>
        </div>
      )}
    </>
  );
  };

  const renderRainContent = (extra: RainExtra) => {
    const rain1h = extra.rain1h ?? extra.rainfall1h;
    const rain6h = extra.rain6h ?? extra.rainfall6h;
    const rain12h = extra.rain12h ?? extra.rainfall12h;
    const rain24h = extra.rain24h ?? extra.rainfall24h;
    const rainTotal = extra.rainTotal ?? extra.rainfallTotal;

    return (
    <>
      {rain1h !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>1小时降雨</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(rain1h)} mm
          </span>
        </div>
      )}
      {rain6h !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>6小时降雨</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(rain6h)} mm
          </span>
        </div>
      )}
      {rain12h !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>12小时降雨</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(rain12h)} mm
          </span>
        </div>
      )}
      {rain24h !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>24小时降雨</span>
          <span style={{ color: theme.colors.primary, fontWeight: 500 }}>
            {formatNumber(rain24h)} mm
          </span>
        </div>
      )}
      {rainTotal !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>累计降雨</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(rainTotal)} mm
          </span>
        </div>
      )}
    </>
  );
  };

  const renderWaterContent = (extra: WaterExtra) => {
    const currentLevel = extra.currentLevel ?? extra.waterLevel;
    const currentFlow = extra.currentFlow ?? extra.flowRate;
    const currentVelocity = extra.currentVelocity ?? extra.velocity;
    const waterTemp = extra.waterTemp ?? extra.waterTemperature;
    const warningLevel = extra.warningLevel;
    const guaranteeLevel = extra.guaranteeLevel;

    return (
    <>
      {currentLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>当前水位</span>
          <span style={{ color: theme.colors.text.primary, fontWeight: 500 }}>
            {formatNumber(currentLevel)} m
          </span>
        </div>
      )}
      {currentFlow !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>流量</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(currentFlow)} m³/s
          </span>
        </div>
      )}
      {currentVelocity !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>流速</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(currentVelocity)} m/s
          </span>
        </div>
      )}
      {waterTemp !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>水温</span>
          <span style={{ color: theme.colors.text.primary }}>
            {formatNumber(waterTemp)} °C
          </span>
        </div>
      )}
      {warningLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>警戒水位</span>
          <span style={{ color: theme.colors.warning }}>
            {formatNumber(warningLevel)} m
          </span>
        </div>
      )}
      {guaranteeLevel !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>保证水位</span>
          <span style={{ color: theme.colors.danger }}>
            {formatNumber(guaranteeLevel)} m
          </span>
        </div>
      )}
    </>
  );
  };

  const renderRiskContent = (extra: RiskExtra) => {
    const affectedPopulation = extra.affectedPopulation ?? extra.affectedPeople;
    const displacement = extra.displacement;
    const displacementRate = extra.displacementRate;
    const riskType = extra.riskType;
    const riskLevel = extra.riskLevel;
    const monitoringPoints = extra.monitoringPoints;
    const affectedArea = extra.affectedArea;

    return (
    <>
      {riskType && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>风险类型</span>
          <span style={{ color: theme.colors.text.primary }}>{riskType}</span>
        </div>
      )}
      {riskLevel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>风险等级</span>
          <span style={{ color: theme.colors.danger, fontWeight: 500 }}>{riskLevel}</span>
        </div>
      )}
      {affectedPopulation !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>影响人口</span>
          <span style={{ color: theme.colors.text.primary }}>{affectedPopulation} 人</span>
        </div>
      )}
      {affectedArea !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>影响面积</span>
          <span style={{ color: theme.colors.text.primary }}>{affectedArea} km²</span>
        </div>
      )}
      {displacement !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>位移量</span>
          <span style={{ color: theme.colors.warning }}>{formatNumber(displacement)} mm</span>
        </div>
      )}
      {displacementRate !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.colors.text.secondary }}>位移速率</span>
          <span style={{ color: theme.colors.warning }}>{formatNumber(displacementRate)} mm/h</span>
        </div>
      )}
      {monitoringPoints !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>监测点数量</span>
          <span style={{ color: theme.colors.text.primary }}>{monitoringPoints} 个</span>
        </div>
      )}
    </>
  );
  };

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
