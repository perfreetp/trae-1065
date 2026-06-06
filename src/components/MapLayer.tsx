import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useLinkage } from '../context/LinkageContext';
import { useDataFilter } from '../context/DataContext';
import {
  classNames,
  formatNumber,
  formatTime,
  getWarningColor,
  getStationColor,
} from '../utils';
import { Station, BaseComponentProps, LegendItem, StationType, MapBounds, AdminBoundary } from '../types';
import { Empty } from './common/Empty';

export interface MapLayerProps extends BaseComponentProps {
  stations?: Station[];
  showLegend?: boolean;
  enableAggregation?: boolean;
  aggregationThreshold?: number;
  enableFlashing?: boolean;
  showTooltip?: boolean;
  visibleTypes?: StationType[];
  backgroundImage?: string;
  mapBounds?: MapBounds;
  adminBoundaries?: AdminBoundary[];
  useGlobalFilter?: boolean;
  onStationClick?: (station: Station) => void;
  onStationHover?: (station: Station | null) => void;
  onLegendChange?: (items: LegendItem[]) => void;
}

interface AggregatedCluster {
  id: string;
  x: number;
  y: number;
  lng: number;
  lat: number;
  count: number;
  stations: Station[];
}

const stationTypeNames: Record<StationType, string> = {
  rain: '雨量站',
  water: '水位站',
  reservoir: '水库',
  gate: '闸门',
  pump: '泵站',
  risk: '风险点',
};

export const MapLayer: React.FC<MapLayerProps> = ({
  stations: propStations,
  showLegend = true,
  enableAggregation = true,
  aggregationThreshold = 50,
  enableFlashing = true,
  showTooltip = true,
  visibleTypes: propVisibleTypes,
  backgroundImage,
  mapBounds: propMapBounds,
  adminBoundaries = [],
  useGlobalFilter = false,
  className,
  style,
  onStationClick,
  onStationHover,
  onLegendChange,
  onClick,
  onReady,
}) => {
  const { theme, mode } = useTheme();
  const { selectedStationId, setSelectedStationId } = useLinkage();
  const { filteredStations, isTypeVisible, toggleType } = useDataFilter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [expandedCluster, setExpandedCluster] = useState<AggregatedCluster | null>(null);
  const [legendItems, setLegendItems] = useState<LegendItem[]>([
    { name: stationTypeNames.rain, color: getStationColor('rain'), visible: true, type: 'rain' },
    { name: stationTypeNames.water, color: getStationColor('water'), visible: true, type: 'water' },
    { name: stationTypeNames.reservoir, color: getStationColor('reservoir'), visible: true, type: 'reservoir' },
    { name: stationTypeNames.gate, color: getStationColor('gate'), visible: true, type: 'gate' },
    { name: stationTypeNames.pump, color: getStationColor('pump'), visible: true, type: 'pump' },
    { name: stationTypeNames.risk, color: getStationColor('risk'), visible: true, type: 'risk' },
  ]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const effectiveStations = useMemo(() => {
    const baseStations = useGlobalFilter ? filteredStations : (propStations || []);
    const legendVisibleTypes = legendItems.filter((i) => i.visible).map((i) => i.type as StationType);
    const propTypes = propVisibleTypes && propVisibleTypes.length > 0 ? propVisibleTypes : null;

    return baseStations.filter((station) => {
      if (!legendVisibleTypes.includes(station.type)) return false;
      if (propTypes && !propTypes.includes(station.type)) return false;
      if (useGlobalFilter && !isTypeVisible(station.type)) return false;
      return true;
    });
  }, [propStations, useGlobalFilter, filteredStations, legendItems, propVisibleTypes, isTypeVisible]);

  const computedBounds = useMemo((): MapBounds => {
    if (propMapBounds) return propMapBounds;

    let allLngs: number[] = [];
    let allLats: number[] = [];

    if (effectiveStations.length > 0) {
      allLngs = effectiveStations.map((s) => s.lng);
      allLats = effectiveStations.map((s) => s.lat);
    }

    adminBoundaries.forEach((boundary) => {
      const boundaryPoints = boundary.points || boundary.coordinates?.map(([lng, lat]) => ({ lng, lat })) || [];
      boundaryPoints.forEach((p) => {
        allLngs.push(p.lng);
        allLats.push(p.lat);
      });
    });

    if (allLngs.length === 0) {
      return { minLng: 0, minLat: 0, maxLng: 100, maxLat: 100 };
    }

    const padding = 2;
    return {
      minLng: Math.min(...allLngs) - padding,
      minLat: Math.min(...allLats) - padding,
      maxLng: Math.max(...allLngs) + padding,
      maxLat: Math.max(...allLats) + padding,
    };
  }, [propMapBounds, effectiveStations, adminBoundaries]);

  const clusters = useMemo((): (Station | AggregatedCluster)[] => {
    if (!enableAggregation || effectiveStations.length <= aggregationThreshold) {
      return effectiveStations;
    }

    const gridSizeLng = (computedBounds.maxLng - computedBounds.minLng) / 10;
    const gridSizeLat = (computedBounds.maxLat - computedBounds.minLat) / 10;
    const clusterMap = new Map<string, AggregatedCluster>();

    effectiveStations.forEach((station) => {
      const gridX = Math.floor((station.lng - computedBounds.minLng) / gridSizeLng);
      const gridY = Math.floor((station.lat - computedBounds.minLat) / gridSizeLat);
      const key = `${gridX}-${gridY}`;

      if (!clusterMap.has(key)) {
        clusterMap.set(key, {
          id: `cluster-${key}`,
          x: gridX * gridSizeLng + gridSizeLng / 2 + computedBounds.minLng,
          y: gridY * gridSizeLat + gridSizeLat / 2 + computedBounds.minLat,
          lng: 0,
          lat: 0,
          count: 0,
          stations: [],
        });
      }

      const cluster = clusterMap.get(key)!;
      cluster.count++;
      cluster.stations.push(station);
      cluster.lng += station.lng;
      cluster.lat += station.lat;
    });

    return Array.from(clusterMap.values()).map((cluster) => ({
      ...cluster,
      lng: cluster.lng / cluster.count,
      lat: cluster.lat / cluster.count,
    }));
  }, [effectiveStations, enableAggregation, aggregationThreshold, computedBounds]);

  const lngToX = (lng: number) => {
    return ((lng - computedBounds.minLng) / (computedBounds.maxLng - computedBounds.minLng)) * 100;
  };

  const latToY = (lat: number) => {
    return 100 - ((lat - computedBounds.minLat) / (computedBounds.maxLat - computedBounds.minLat)) * 100;
  };

  const handleLegendChange = (items: LegendItem[]) => {
    setLegendItems(items);
    onLegendChange?.(items);
    if (useGlobalFilter) {
      items.forEach((item) => {
        if (item.type) {
          if (!item.visible && isTypeVisible(item.type)) {
            toggleType(item.type);
          } else if (item.visible && !isTypeVisible(item.type)) {
            toggleType(item.type);
          }
        }
      });
    }
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
    setExpandedCluster(null);
    onStationClick?.(station);
    onClick?.(station);
  };

  const handleClusterClick = (cluster: AggregatedCluster) => {
    setExpandedCluster(expandedCluster?.id === cluster.id ? null : cluster);
  };

  const renderMarker = (station: Station) => {
    const x = lngToX(station.lng);
    const y = latToY(station.lat);
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
          left: `${x}%`,
          top: `${y}%`,
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
            width: station.type === 'reservoir' ? '24px' : '18px',
            height: station.type === 'reservoir' ? '24px' : '18px',
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
              backgroundColor: 'rgba(0,0,0,0.75)',
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
    const x = lngToX(cluster.lng);
    const y = latToY(cluster.lat);
    const size = Math.min(48, 24 + cluster.count);

    return (
      <div
        key={cluster.id}
        className="water-sdk-map-cluster"
        onClick={() => handleClusterClick(cluster)}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: `${theme.colors.primary}90`,
          border: '3px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 5,
        }}
      >
        {cluster.count}
      </div>
    );
  };

  const renderBoundary = (boundary: AdminBoundary, index: number) => {
    const boundaryPoints = boundary.points || boundary.coordinates?.map(([lng, lat]) => ({ lng, lat })) || [];
    if (boundaryPoints.length === 0) return null;

    const points = boundaryPoints
      .map((p) => `${lngToX(p.lng)}%,${latToY(p.lat)}%`)
      .join(' ');

    const fill = boundary.fillColor || boundary.color || `${theme.colors.primary}10`;
    const stroke = boundary.strokeColor || boundary.color || theme.colors.primary;
    const strokeWidth = boundary.strokeWidth || 2;
    const strokeDasharray = boundary.strokeDasharray || 'none';

    return (
      <polygon
        key={`boundary-${index}`}
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    );
  };

  const hasAnyFilterActive = useGlobalFilter ||
    (propVisibleTypes && propVisibleTypes.length > 0) ||
    legendItems.some((i) => !i.visible);

  const hasContent = useMemo(() => {
    if (effectiveStations.length > 0) return true;
    if (adminBoundaries.length > 0 && !hasAnyFilterActive) return true;
    return false;
  }, [effectiveStations, adminBoundaries, hasAnyFilterActive]);

  if (!hasContent) {
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
        <Empty text="暂无地图数据" />
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
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.sm,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {legendItems.map((item, index) => (
                <div
                  key={item.name}
                  onClick={() => {
                    const newItems = [...legendItems];
                    newItems[index] = { ...newItems[index], visible: !newItems[index].visible };
                    handleLegendChange(newItems);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    cursor: 'pointer',
                    opacity: item.visible ? 1 : 0.4,
                  }}
                >
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: item.type === 'reservoir' ? '2px' : '50%',
                      backgroundColor: item.color,
                    }}
                  />
                  <span style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
                    {item.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={item.visible}
                    readOnly
                    style={{ marginLeft: 'auto', transform: 'scale(0.8)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '450px',
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundColor: mode === 'dark' ? '#0f1a24' : '#e6f3f7',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <defs>
            <pattern id="mapGrid" width="5%" height="5%" patternUnits="userSpaceOnUse">
              <path
                d="M 5% 0 L 0 0 0 5%"
                fill="none"
                stroke={theme.colors.border}
                strokeWidth="0.5"
                opacity="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGrid)" />

          {adminBoundaries.map((boundary, index) => renderBoundary(boundary, index))}
        </svg>

        {clusters.map((item) => {
          if ('count' in item) {
            return renderCluster(item as AggregatedCluster);
          }
          return renderMarker(item as Station);
        })}

        {expandedCluster && (
          <div
            style={{
              position: 'absolute',
              left: `${lngToX(expandedCluster.lng)}%`,
              top: `${latToY(expandedCluster.lat)}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-10px',
              zIndex: 50,
              minWidth: '200px',
              maxWidth: '300px',
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                padding: theme.spacing.sm,
                borderBottom: `1px solid ${theme.colors.border}`,
                fontSize: '12px',
                fontWeight: 600,
                color: theme.colors.text.primary,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>聚合站点 ({expandedCluster.count})</span>
              <button
                onClick={() => setExpandedCluster(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: theme.colors.text.secondary,
                  fontSize: '14px',
                }}
              >
                ×
              </button>
            </div>
            <div>
              {expandedCluster.stations.map((station) => (
                <div
                  key={station.id}
                  onClick={(e) => handleStationClick(e, station)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                  }}
                  onMouseEnter={() => setHoveredStation(station)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: getStationColor(station.type),
                    }}
                  />
                  <span style={{ fontSize: '12px', color: theme.colors.text.primary, flex: 1 }}>
                    {station.name}
                  </span>
                  {station.value !== undefined && (
                    <span style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
                      {formatNumber(station.value)}{station.unit || ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTooltip && hoveredStation && (
        <div
          className="water-sdk-map-tooltip"
          style={{
            position: 'fixed',
            left: tooltipPos.x + 12,
            top: tooltipPos.y + 12,
            zIndex: 1000,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '12px',
            maxWidth: '220px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: theme.spacing.xs, color: theme.colors.text.primary }}>
            {hoveredStation.name}
          </div>
          <div style={{ color: theme.colors.text.secondary, marginBottom: '2px' }}>
            类型：{stationTypeNames[hoveredStation.type] || hoveredStation.type}
          </div>
          {hoveredStation.value !== undefined && (
            <div style={{ color: theme.colors.text.secondary, marginBottom: '2px' }}>
              数值：{formatNumber(hoveredStation.value)}{hoveredStation.unit || ''}
            </div>
          )}
          {hoveredStation.status && (
            <div style={{ color: getWarningColor(hoveredStation.status), marginBottom: '2px' }}>
              状态：{hoveredStation.status}
            </div>
          )}
          {hoveredStation.updateTime && (
            <div style={{ color: theme.colors.text.secondary, fontSize: '11px', marginTop: '4px' }}>
              更新：{formatTime(hoveredStation.updateTime, 'MM-DD HH:mm')}
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
