import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../theme/ThemeProvider';
import { useLinkage } from '../context/LinkageContext';
import { classNames, formatNumber, formatTime } from '../utils';
import { TimeSeriesData, ThresholdLine, BaseComponentProps, LegendItem } from '../types';
import { Empty } from './common/Empty';
import { Legend } from './common/Legend';

export interface HydrographProps extends BaseComponentProps {
  data: TimeSeriesData[];
  dataYoY?: TimeSeriesData[];
  dataMoM?: TimeSeriesData[];
  title?: string;
  unit?: string;
  unit2?: string;
  showSwitcher?: boolean;
  showYoY?: boolean;
  showMoM?: boolean;
  thresholdLines?: ThresholdLine[];
  showLegend?: boolean;
  yAxisName?: string;
  yAxisName2?: string;
  currentTime?: string;
  onTimeChange?: (time: string) => void;
  onDataClick?: (data: TimeSeriesData) => void;
}

export const Hydrograph: React.FC<HydrographProps> = ({
  data = [],
  dataYoY = [],
  dataMoM = [],
  title,
  unit = 'm',
  unit2 = 'm³/s',
  showSwitcher = true,
  showYoY = false,
  showMoM = false,
  thresholdLines = [],
  showLegend = true,
  yAxisName = '水位',
  yAxisName2 = '流量',
  currentTime,
  onTimeChange,
  onDataClick,
  className,
  style,
  onClick,
  onReady,
}) => {
  const { theme, mode } = useTheme();
  const { currentTime: linkageTime, setCurrentTime } = useLinkage();
  const chartRef = useRef<ReactECharts>(null);
  const [dataType, setDataType] = useState<'water' | 'flow' | 'both'>('water');
  const [legendItems, setLegendItems] = useState<LegendItem[]>([
    { name: '当前', color: theme.colors.primary, visible: true },
    { name: '同比', color: theme.colors.warning, visible: showYoY },
    { name: '环比', color: theme.colors.success, visible: showMoM },
  ]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const activeCurrentTime = currentTime || linkageTime;

  const chartOption = useMemo(() => {
    if (data.length === 0) return {};

    const xAxisData = data.map((d) => formatTime(d.time, 'HH:mm'));
    const series: any[] = [];

    const mainColor = theme.colors.primary;

    if (legendItems[0].visible) {
      if (dataType !== 'flow') {
        series.push({
          name: `${yAxisName}(${unit})`,
          type: 'line',
          data: data.map((d) => d.value),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: mainColor,
            width: 2,
          },
          itemStyle: {
            color: mainColor,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${mainColor}40` },
                { offset: 1, color: `${mainColor}05` },
              ],
            },
          },
          yAxisIndex: 0,
        });
      }

      if (dataType !== 'water' && data[0].value2 !== undefined) {
        series.push({
          name: `${yAxisName2}(${unit2})`,
          type: 'line',
          data: data.map((d) => d.value2),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: theme.colors.info,
            width: 2,
          },
          itemStyle: {
            color: theme.colors.info,
          },
          yAxisIndex: 1,
        });
      }
    }

    if (legendItems[1].visible && showYoY && dataYoY.length > 0) {
      series.push({
        name: `同比${yAxisName}`,
        type: 'line',
        data: dataYoY.map((d) => d.value),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: theme.colors.warning,
          width: 1.5,
          type: 'dashed',
        },
        itemStyle: {
          color: theme.colors.warning,
        },
        yAxisIndex: 0,
      });
    }

    if (legendItems[2].visible && showMoM && dataMoM.length > 0) {
      series.push({
        name: `环比${yAxisName}`,
        type: 'line',
        data: dataMoM.map((d) => d.value),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: theme.colors.success,
          width: 1.5,
          type: 'dotted',
        },
        itemStyle: {
          color: theme.colors.success,
        },
        yAxisIndex: 0,
      });
    }

    const markLine = {
      silent: false,
      symbol: 'none',
      data: thresholdLines.map((line) => ({
        yAxis: line.value,
        name: line.name,
        lineStyle: {
          color: line.color || theme.colors.danger,
          type: line.type || 'dashed',
          width: 2,
        },
        label: {
          formatter: line.name,
          color: line.color || theme.colors.danger,
          fontSize: 11,
        },
      })),
    };

    if (series.length > 0 && thresholdLines.length > 0) {
      series[0].markLine = markLine;
    }

    const yAxis: any[] = [
      {
        type: 'value',
        name: dataType === 'flow' ? '' : `${yAxisName}(${unit})`,
        position: 'left',
        axisLine: {
          lineStyle: { color: theme.colors.border },
        },
        axisLabel: {
          color: theme.colors.text.secondary,
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: theme.colors.border,
            type: 'dashed',
          },
        },
      },
    ];

    if (dataType === 'both' || dataType === 'flow') {
      yAxis.push({
        type: 'value',
        name: `${yAxisName2}(${unit2})`,
        position: 'right',
        axisLine: {
          lineStyle: { color: theme.colors.border },
        },
        axisLabel: {
          color: theme.colors.text.secondary,
          fontSize: 11,
        },
        splitLine: {
          show: false,
        },
      });
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        textStyle: {
          color: theme.colors.text.primary,
        },
        formatter: (params: any[]) => {
          const time = data[params[0]?.dataIndex]?.time;
          let result = `<div style="font-weight:bold;margin-bottom:4px">${formatTime(time || '')}</div>`;
          params.forEach((p) => {
            result += `<div>${p.marker} ${p.seriesName}: <b>${formatNumber(p.value)}</b></div>`;
          });
          return result;
        },
      },
      grid: {
        left: '3%',
        right: dataType === 'both' ? '10%' : '3%',
        top: '10%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: {
          lineStyle: { color: theme.colors.border },
        },
        axisLabel: {
          color: theme.colors.text.secondary,
          fontSize: 11,
          rotate: data.length > 20 ? 30 : 0,
        },
      },
      yAxis,
      series,
      dataZoom: activeCurrentTime
        ? [
            {
              type: 'inside',
              start: 0,
              end: 100,
            },
            {
              type: 'slider',
              start: 0,
              end: 100,
              height: 20,
              bottom: 5,
              borderColor: 'transparent',
              backgroundColor: `${theme.colors.border}50`,
              fillerColor: `${theme.colors.primary}30`,
              handleStyle: {
                color: theme.colors.primary,
              },
              textStyle: {
                color: theme.colors.text.secondary,
              },
            },
          ]
        : undefined,
    };
  }, [data, dataYoY, dataMoM, dataType, legendItems, thresholdLines, theme, mode, yAxisName, yAxisName2, unit, unit2, showYoY, showMoM, activeCurrentTime]);

  const onChartEvents = useMemo(
    () => ({
      click: (params: any) => {
        if (params.dataIndex !== undefined && data[params.dataIndex]) {
          const clickedData = data[params.dataIndex];
          onDataClick?.(clickedData);
          onClick?.(clickedData);
          if (onTimeChange) {
            onTimeChange(clickedData.time);
          }
          setCurrentTime(clickedData.time);
        }
      },
    }),
    [data, onDataClick, onClick, onTimeChange, setCurrentTime]
  );

  if (data.length === 0) {
    return (
      <div
        className={classNames('water-sdk-hydrograph', className)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          ...style,
        }}
      >
        <Empty text="暂无数据" />
      </div>
    );
  }

  return (
    <div
      className={classNames('water-sdk-hydrograph', className)}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
        {title && (
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
            {title}
          </h4>
        )}
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          {showSwitcher && (
            <div style={{ display: 'flex', borderRadius: theme.radius.sm, overflow: 'hidden', border: `1px solid ${theme.colors.border}` }}>
              {(['water', 'flow', 'both'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDataType(type)}
                  style={{
                    padding: '4px 12px',
                    border: 'none',
                    backgroundColor: dataType === type ? theme.colors.primary : 'transparent',
                    color: dataType === type ? '#fff' : theme.colors.text.secondary,
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s',
                  }}
                >
                  {type === 'water' ? '水位' : type === 'flow' ? '流量' : '双轴'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLegend && (
        <Legend
          items={legendItems}
          onChange={setLegendItems}
          position="top"
        />
      )}

      <ReactECharts
        ref={chartRef}
        option={chartOption}
        style={{ height: '300px', width: '100%' }}
        notMerge={true}
        onEvents={onChartEvents}
        theme={mode === 'dark' ? 'dark' : undefined}
      />
    </div>
  );
};
