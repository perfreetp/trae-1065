import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { classNames, formatNumber } from '../utils';
import { BaseComponentProps } from '../types';
import { Empty } from './common/Empty';

export interface SectionLayer {
  name: string;
  top: number;
  bottom: number;
  color: string;
  type?: 'water' | 'sediment' | 'bedrock' | 'earth' | 'structure';
}

export interface SectionPoint {
  name: string;
  x: number;
  y: number;
  value?: number;
  unit?: string;
  markerColor?: string;
}

export interface SectionProfileProps extends BaseComponentProps {
  title?: string;
  layers: SectionLayer[];
  points?: SectionPoint[];
  waterLevel?: number;
  minElevation?: number;
  maxElevation?: number;
  width?: number;
  height?: number;
  unit?: string;
  showGrid?: boolean;
  showWaterLevel?: boolean;
  onPointClick?: (point: SectionPoint) => void;
}

export const SectionProfile: React.FC<SectionProfileProps> = ({
  title = '剖面示意',
  layers = [],
  points = [],
  waterLevel,
  minElevation,
  maxElevation,
  width = 600,
  height = 300,
  unit = 'm',
  showGrid = true,
  showWaterLevel = true,
  onPointClick,
  className,
  style,
  onClick,
  onReady,
}) => {
  const { theme, mode } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState<SectionPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const elevations = useMemo(() => {
    const all = layers.flatMap((l) => [l.top, l.bottom]);
    if (waterLevel !== undefined) all.push(waterLevel);
    points.forEach((p) => all.push(p.y));
    const min = minElevation !== undefined ? minElevation : Math.min(...all) - 5;
    const max = maxElevation !== undefined ? maxElevation : Math.max(...all) + 5;
    return { min, max, range: max - min };
  }, [layers, waterLevel, points, minElevation, maxElevation]);

  const yToPx = (y: number) => {
    return height - ((y - elevations.min) / elevations.range) * (height - 40) - 20;
  };

  const xToPx = (x: number) => {
    return (x / 100) * (width - 40) + 20;
  };

  const handlePointMouseEnter = (e: React.MouseEvent, point: SectionPoint) => {
    setHoveredPoint(point);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointClick = (point: SectionPoint) => {
    onPointClick?.(point);
    onClick?.(point);
  };

  if (layers.length === 0) {
    return (
      <div
        className={classNames('water-sdk-section-profile', className)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          ...style,
        }}
      >
        <Empty text="暂无剖面数据" />
      </div>
    );
  }

  const gridLines = [];
  const gridLabels = [];
  const step = Math.ceil(elevations.range / 5);
  for (let y = Math.floor(elevations.min / step) * step; y <= elevations.max; y += step) {
    gridLines.push(
      <line
        key={`grid-${y}`}
        x1="20"
        y1={yToPx(y)}
        x2={width - 20}
        y2={yToPx(y)}
        stroke={theme.colors.border}
        strokeWidth="0.5"
        strokeDasharray="4,4"
      />
    );
    gridLabels.push(
      <text
        key={`label-${y}`}
        x="15"
        y={yToPx(y) + 4}
        textAnchor="end"
        fontSize="10"
        fill={theme.colors.text.secondary}
      >
        {y}
      </text>
    );
  }

  return (
    <div
      className={classNames('water-sdk-section-profile', className)}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        padding: theme.spacing.md,
        ...style,
      }}
    >
      {title && (
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
          {title}
        </h4>
      )}

      <div style={{ overflowX: 'auto' }}>
        <svg width={width} height={height} style={{ display: 'block' }}>
          {showGrid && gridLines}
          {showGrid && gridLabels}

          {layers.map((layer, index) => {
            const yTop = yToPx(layer.top);
            const yBottom = yToPx(layer.bottom);
            const layerHeight = yBottom - yTop;

            return (
              <g key={`layer-${index}`}>
                <rect
                  x="20"
                  y={yTop}
                  width={width - 40}
                  height={layerHeight}
                  fill={layer.color}
                  opacity={0.8}
                />
                <line
                  x1="20"
                  y1={yTop}
                  x2={width - 20}
                  y2={yTop}
                  stroke={mode === 'dark' ? '#ffffff30' : '#00000030'}
                  strokeWidth="1"
                />
                <text
                  x="30"
                  y={yTop + layerHeight / 2 + 4}
                  fontSize="11"
                  fill={mode === 'dark' ? '#ffffffcc' : '#000000cc'}
                >
                  {layer.name}
                </text>
              </g>
            );
          })}

          {showWaterLevel && waterLevel !== undefined && (
            <g>
              <line
                x1="20"
                y1={yToPx(waterLevel)}
                x2={width - 20}
                y2={yToPx(waterLevel)}
                stroke={theme.colors.info}
                strokeWidth="2"
                strokeDasharray="8,4"
              />
              <rect
                x="20"
                y={yToPx(waterLevel)}
                width={width - 40}
                height={yToPx(elevations.min) - yToPx(waterLevel)}
                fill={theme.colors.info}
                opacity={0.2}
              />
              <text
                x={width - 30}
                y={yToPx(waterLevel) - 5}
                fontSize="11"
                fill={theme.colors.info}
                textAnchor="end"
              >
                水位 {formatNumber(waterLevel)}{unit}
              </text>
            </g>
          )}

          {points.map((point, index) => (
            <g
              key={`point-${index}`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handlePointMouseEnter(e, point)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => handlePointClick(point)}
            >
              <circle
                cx={xToPx(point.x)}
                cy={yToPx(point.y)}
                r="6"
                fill={point.markerColor || theme.colors.warning}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={xToPx(point.x)}
                y={yToPx(point.y) - 10}
                fontSize="10"
                fill={theme.colors.text.primary}
                textAnchor="middle"
              >
                {point.name}
              </text>
              {point.value !== undefined && (
                <text
                  x={xToPx(point.x)}
                  y={yToPx(point.y) - 22}
                  fontSize="10"
                  fill={theme.colors.primary}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {formatNumber(point.value)}{point.unit || unit}
                </text>
              )}
            </g>
          ))}

          <line
            x1="20"
            y1="20"
            x2="20"
            y2={height - 20}
            stroke={theme.colors.border}
            strokeWidth="1"
          />
          <line
            x1="20"
            y1={height - 20}
            x2={width - 20}
            y2={height - 20}
            stroke={theme.colors.border}
            strokeWidth="1"
          />

          <text
            x="10"
            y="15"
            fontSize="10"
            fill={theme.colors.text.secondary}
          >
            高程({unit})
          </text>
        </svg>
      </div>

      {hoveredPoint && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
            zIndex: 1000,
            padding: '8px 12px',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: theme.colors.text.primary }}>
            {hoveredPoint.name}
          </div>
          <div style={{ color: theme.colors.text.secondary }}>
            高程：{formatNumber(hoveredPoint.y)}{unit}
          </div>
          {hoveredPoint.value !== undefined && (
            <div style={{ color: theme.colors.primary }}>
              数值：{formatNumber(hoveredPoint.value)}{hoveredPoint.unit || unit}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
