import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useLinkage } from '../context/LinkageContext';
import {
  classNames,
  formatNumber,
  formatTime,
  getWarningColor,
  getStationColor,
} from '../utils';
import { Station, BaseComponentProps, LegendItem } from '../types';
import { Empty } from './common/Empty';
import { Legend } from './common/Legend';

export interface MapLayerProps extends BaseComponentProps {
  stations: Station[];
  showLegend?: boolean;
  enableAggregation?: boolean;
  aggregationThreshold?: number;
  enableFlashing?: boolean;
  showTooltip?: boolean;
  visibleTypes?: string[];
  backgroundImage?: string;
  mapBounds?: { minX: number; minY: number; maxX: number; maxY: number };
  onStationClick?: (station: Station) => void;
  onStationHover?: (station: Station | null) => void;
}

interface AggregatedCluster {
  id: string;
  x: number;
  y: number;
  count: number;
  stations: Station[];
  centerLng: number;
  centerLat: number;
}

export const MapLayer: React.FC<MapLayerProps> = ({
  stations = [],
  showLegend = true,
  enableAggregation = true,
  aggregationThreshold = 50,
  enableFlashing = true,
  showTooltip = true,
  visibleTypes,
  backgroundImage,
  mapBounds,
  className,
  style,
  onStationClick,
  onStationHover,
  onClick,
  onReady,
}) => {
  const { theme, mode } = useTheme();
  const { selectedStationId, setSelectedStationId } = useLinkage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const filteredStations = useMemo(() => {
    if (!visibleTypes || visibleTypes.length === 0) return stations;
    return stations.filter((s) => visibleTypes.includes(s.type));
  }, [stations, visibleTypes]);

  const clusters = useMemo((): (Station | AggregatedCluster)[] => {
    if (!enableAggregation || filteredStations.length <= aggregationThreshold) {
      return filteredStations;
    }

    const gridSize = 50;
    const clusterMap = new Map<string, AggregatedCluster>();

    filteredStations.forEach((station) => {
      const gridX = Math.floor(station.lng / gridSize);
      const gridY = Math.floor(station.lat / gridSize);
      const key = `${gridX}-${gridY}`;

      if (!clusterMap.has(key)) {
        clusterMap.set(key, {
          id: `cluster-${key}`,
          x: gridX * gridSize + gridSize / 2,
          y: gridY * gridSize + gridSize / 2,
          count: 0,
          stations: [],
          centerLng: 0,
          centerLat: 0,
        });
      }

      const cluster = clusterMap.get(key)!;
      cluster.count++;
      cluster.stations.push(station);
      cluster.centerLng += station.lng;
      cluster.centerLat += station.lat;
    });

    return Array.from(clusterMap.values()).map((cluster) => ({
      ...cluster,
      centerLng: cluster.centerLng / cluster.count,
      centerLat: cluster.centerLat / cluster.count,
    }));
  }, [filteredStations, enableAggregation, aggregationThreshold]);

  const legendItems: LegendItem[] = [
    { name: '雨量站', color: getStationColor('rain'), visible: true },
    { name: '水位站', color: getStationColor('water'), visible: true },
    { name: '水库', color: getStationColor('reservoir'), visible: true },
    { name: '闸门', color: getStationColor('gate'), visible: true },
    { name: '泵站', color: getStationColor('pump'), visible: true },
    { name: '风险点', color: getStationColor('risk'), visible: true },
  ];

  const getPosition = (station: Station) => {
    if (mapBounds) {
      const x = ((station.lng - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX)) * 100;
      const y = ((station.lat - mapBounds.minY) / (mapBounds.maxY - mapBounds.minY)) * 100;
      return { x: `${x}%`, y: `${y}%` };
    }
    return { x: `${(station.lng % 100)}%`, y: `${(station.lat % 100)}%` };
  };

  const handleMouseEnter = (e: React.MouseEvent, station: Station) => {
    e.stopPropagation();
    setHoveredStation(station);
    setTooltipPos({ x: e.clientX, y: e.clientY });
    onStationHover?.(station);
  };

  const handleMouseLeave = () => {
    setHoveredStation(null);
    onStationHover?.(null);
  };

  const handleStationClick = (e: React.MouseEvent, station: Station) => {
    e.stopPropagation();
    setSelectedStationId(station.id);
    onStationClick?.(station);
    onClick?.(station);
  };

  const renderMarker = (station: Station) => {
    const pos = getPosition(station);
    const isSelected = selectedStationId === station.id;
    const isRisk = station.type === 'risk';
    const color = getStationColor(station.type);

    return (
      <div
        key={station.id}
        className={classNames(
          'water-sdk-map-marker',
          isSelected && 'water-sdk-map-marker--selected',
          isRisk && enableFlashing && 'water-sdk-map-marker--flashing'
        )}
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: isSelected ? 10 : 1,
        }}
        onMouseEnter={(e) => handleMouseEnter(e, station)}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => handleStationClick(e, station)}
      >
        <div
          style={{
            width: station.type === 'reservoir' ? '24px' : '16px',
            height: station.type === 'reservoir' ? '24px' : '16px',
            borderRadius: station.type === 'reservoir' ? '4px' : '50%',
            backgroundColor: color,
            border: `2px solid ${isSelected ? theme.colors.primary : '#fff'}`,
            boxShadow: isSelected
              ? `0 0 0 4px ${theme.colors.primary}40`
              : '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            animation: isRisk && enableFlashing ? 'flash 1s infinite' : 'none',
          }}
        >
          {station.type === 'gate' && '闸'}
          {station.type === 'pump' && '泵'}
        </div>
        {station.value !== undefined && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '2px',
              padding: '1px 4px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontSize: '10px',
              borderRadius: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            {formatNumber(station.value)}{station.unit || ''}
          </div>
        )}
      </div>
    );
  };

  const renderCluster = (cluster: AggregatedCluster) => {
    const pos = { x: `${cluster.x % 100}%`, y: `${cluster.y % 100}%` };
    const size = Math.min(40, 20 + cluster.count / 5);

    return (
      <div
        key={cluster.id}
        className="water-sdk-map-cluster"
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, -50%)',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: `${theme.colors.primary}90`,
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        onClick={() => {
          setZoom((z) => z * 1.5);
        }}
      >
        {cluster.count}
      </div>
    );
  };

  if (filteredStations.length === 0) {
    return (
      <div
        ref={containerRef}
        className={classNames('water-sdk-map-layer', className)}
        style={{
          position: 'relative',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          ...style,
        }}
      >
        <Empty text="暂无站点数据" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={classNames('water-sdk-map-layer', className)}
      style={{
        position: 'relative',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        ...style,
      }}
    >
      {showLegend && (
        <div style={{ position: 'absolute', top: theme.spacing.sm, right: theme.spacing.sm, zIndex: 20 }}>
          <Legend items={legendItems} />
        </div>
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '400px',
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: mode === 'dark' ? '#1a2733' : '#e8f4f8',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transition: 'transform 0.3s ease',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.3,
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={theme.colors.border} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {clusters.map((item) => {
          if ('count' in item) {
            return renderCluster(item as AggregatedCluster);
          }
          return renderMarker(item as Station);
        })}
      </div>

      {showTooltip && hoveredStation && (
        <div
          className="water-sdk-map-tooltip"
          style={{
            position: 'fixed',
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
            zIndex: 1000,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '12px',
            maxWidth: '200px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: theme.spacing.xs, color: theme.colors.text.primary }}>
            {hoveredStation.name}
          </div>
          <div style={{ color: theme.colors.text.secondary }}>
            类型：{hoveredStation.type}
          </div>
          {hoveredStation.value !== undefined && (
            <div style={{ color: theme.colors.text.secondary }}>
              数值：{formatNumber(hoveredStation.value)}{hoveredStation.unit || ''}
            </div>
          )}
          {hoveredStation.value2 !== undefined && (
            <div style={{ color: theme.colors.text.secondary }}>
              数值2：{formatNumber(hoveredStation.value2)}
            </div>
          )}
          {hoveredStation.status && (
            <div style={{ color: getWarningColor(hoveredStation.status) }}>
              状态：{hoveredStation.status}
            </div>
          )}
          {hoveredStation.updateTime && (
            <div style={{ color: theme.colors.text.secondary, marginTop: '4px' }}>
              更新时间：{formatTime(hoveredStation.updateTime)}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes flash {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.7); }
          50% { opacity: 0.7; box-shadow: 0 0 0 8px rgba(245, 34, 45, 0); }
        }
        .water-sdk-map-marker--flashing {
          animation: flash 1s infinite;
        }
      `}</style>
    </div>
  );
};
