import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../theme/ThemeProvider';
import { useLinkage } from '../context/LinkageContext';
import { useDataFilter } from '../context/DataContext';
import { classNames, formatNumber, formatTime } from '../utils';
import { TimeSeriesData, ThresholdLine, BaseComponentProps, StationType } from '../types';
import { Empty } from './common/Empty';

export interface CompareDataset {
  stationId: string;
  stationName: string;
  color: string;
  data: TimeSeriesData[];
  mode?: 'water' | 'flow' | 'dual';
  unit?: string;
  hasData?: boolean;
}

export interface HydrographProps extends BaseComponentProps {
  data?: TimeSeriesData[];
  dataYoY?: TimeSeriesData[];
  dataMoM?: TimeSeriesData[];
  compareDatasets?: CompareDataset[];
  title?: string;
  unit?: string;
  unit2?: string;
  showSwitcher?: boolean;
  showYoY?: boolean;
  showMoM?: boolean;
  thresholdLines?: ThresholdLine[];
  showLegend?: boolean;
  showThresholdToggle?: boolean;
  yAxisName?: string;
  yAxisName2?: string;
  timeRange?: { start: string; end: string };
  showTimeRangePicker?: boolean;
  highlightOverThreshold?: boolean;
  useGlobalFilter?: boolean;
  currentTime?: string;
  onTimeRangeChange?: (range: { start: string; end: string }) => void;
  onTimeChange?: (time: string) => void;
  onDataClick?: (data: TimeSeriesData) => void;
}

export const Hydrograph: React.FC<HydrographProps> = ({
  data: propData = [],
  dataYoY = [],
  dataMoM = [],
  compareDatasets = [],
  title,
  unit = 'm',
  unit2 = 'm³/s',
  showSwitcher = true,
  showYoY = false,
  showMoM = false,
  thresholdLines: propThresholdLines = [],
  showLegend = true,
  showThresholdToggle = true,
  yAxisName = '水位',
  yAxisName2 = '流量',
  timeRange: propTimeRange,
  showTimeRangePicker = true,
  highlightOverThreshold = true,
  useGlobalFilter = false,
  currentTime: propCurrentTime,
  onTimeRangeChange,
  onTimeChange,
  onDataClick,
  className,
  style,
  onClick,
  onReady,
}) => {
  const { theme, mode } = useTheme();
  const { currentTime: linkageTime, setCurrentTime, selectedTimeRange, setSelectedTimeRange } = useLinkage();
  const chartRef = useRef<ReactECharts>(null);
  const [dataType, setDataType] = useState<'water' | 'flow' | 'both'>('water');
  const [showYoYLine, setShowYoY] = useState(showYoY);
  const [showMoMLine, setShowMoM] = useState(showMoM);
  const [thresholdLines, setThresholdLines] = useState<ThresholdLine[]>(
    propThresholdLines.map((t) => ({ ...t, enabled: t.enabled !== false }))
  );
  const [localTimeRange, setLocalTimeRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    setThresholdLines(propThresholdLines.map((t) => ({ ...t, enabled: t.enabled !== false })));
  }, [propThresholdLines]);

  const activeTimeRange = propTimeRange || selectedTimeRange || localTimeRange;
  const activeCurrentTime = propCurrentTime || linkageTime;

  const filteredData = useMemo(() => {
    if (!activeTimeRange) return propData;
    const start = new Date(activeTimeRange.start).getTime();
    const end = new Date(activeTimeRange.end).getTime();
    return propData.filter((d) => {
      const t = new Date(d.time).getTime();
      return t >= start && t <= end;
    });
  }, [propData, activeTimeRange]);

  const enabledThresholds = useMemo(
    () => thresholdLines.filter((t) => t.enabled),
    [thresholdLines]
  );

  const dataWithThresholdFlag = useMemo(() => {
    if (!highlightOverThreshold || enabledThresholds.length === 0) {
      return filteredData.map((d) => ({ ...d, isOverThreshold: false }));
    }
    const maxThreshold = Math.max(...enabledThresholds.map((t) => t.value));
    return filteredData.map((d) => ({
      ...d,
      isOverThreshold: (d.value || 0) > maxThreshold,
    }));
  }, [filteredData, enabledThresholds, highlightOverThreshold]);

  const chartOption = useMemo(() => {
    if (compareDatasets.length > 0) {
      const validDatasets = compareDatasets.filter((ds) => ds.hasData !== false && ds.data && ds.data.length > 0);
      if (validDatasets.length === 0) return {};

      const allTimes = new Set<string>();
      validDatasets.forEach((ds) => {
        ds.data.forEach((d) => allTimes.add(d.time));
      });
      const sortedTimes = Array.from(allTimes).sort();

      const series: any[] = validDatasets.map((ds) => ({
        name: ds.stationName,
        type: 'line',
        data: ds.data.map((d) => [d.time, d.value]),
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          color: ds.color,
          width: 2,
        },
        itemStyle: {
          color: ds.color,
        },
        yAxisIndex: 0,
      }));

      return {
        tooltip: {
          trigger: 'axis',
          backgroundColor: mode === 'dark' ? '#2a2a2a' : '#fff',
          borderColor: theme.colors.border,
          textStyle: { color: theme.colors.text.primary, fontSize: 11 },
        },
        legend: {
          show: false,
        },
        grid: {
          left: '50px',
          right: '20px',
          top: '20px',
          bottom: '40px',
        },
        xAxis: {
          type: 'time',
          axisLine: { lineStyle: { color: theme.colors.border } },
          axisLabel: {
            color: theme.colors.text.secondary,
            fontSize: 10,
            formatter: (value: any) => formatTime(value, 'HH:mm'),
          },
        },
        yAxis: [
          {
            type: 'value',
            position: 'left',
            axisLine: { lineStyle: { color: theme.colors.border } },
            axisLabel: { color: theme.colors.text.secondary, fontSize: 10 },
            splitLine: { lineStyle: { color: theme.colors.border, type: 'dashed' } },
          },
        ],
        series,
      };
    }

    if (dataWithThresholdFlag.length === 0) return {};

    const xAxisData = dataWithThresholdFlag.map((d) => formatTime(d.time, 'HH:mm'));
    const series: any[] = [];

    const mainColor = theme.colors.primary;

    if (dataType !== 'flow') {
      const values = dataWithThresholdFlag.map((d) => [d.time, d.value]);
      series.push({
        name: `${yAxisName}(${unit})`,
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: mainColor,
          width: 2,
        },
        itemStyle: {
          color: (params: any) => {
            const d = dataWithThresholdFlag[params.dataIndex];
            return d?.isOverThreshold ? theme.colors.danger : mainColor;
          },
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
        markLine:
          enabledThresholds.length > 0
            ? {
                silent: false,
                symbol: 'none',
                data: enabledThresholds.map((line) => ({
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
              }
            : undefined,
      });

      if (highlightOverThreshold && enabledThresholds.length > 0) {
        const maxThreshold = Math.max(...enabledThresholds.map((t) => t.value));
        const overThresholdData = dataWithThresholdFlag.map((d) =>
          d.isOverThreshold ? [d.time, d.value] : null
        );
        series.push({
          name: '超阈值',
          type: 'line',
          data: overThresholdData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: theme.colors.danger,
            width: 3,
          },
          itemStyle: {
            color: theme.colors.danger,
          },
          yAxisIndex: 0,
          silent: true,
        });
      }
    }

    if (dataType !== 'water' && dataWithThresholdFlag[0]?.value2 !== undefined) {
      series.push({
        name: `${yAxisName2}(${unit2})`,
        type: 'line',
        data: dataWithThresholdFlag.map((d) => [d.time, d.value2]),
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

    if (showYoYLine && dataYoY.length > 0) {
      series.push({
        name: `同比${yAxisName}`,
        type: 'line',
        data: dataYoY.map((d) => [d.time, d.value]),
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

    if (showMoMLine && dataMoM.length > 0) {
      series.push({
        name: `环比${yAxisName}`,
        type: 'line',
        data: dataMoM.map((d) => [d.time, d.value]),
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
          if (params.length === 0) return '';
          const time = params[0]?.value?.[0];
          let result = `<div style="font-weight:bold;margin-bottom:4px">${formatTime(time || '')}</div>`;
          params.forEach((p) => {
            if (p.value !== null && p.value !== undefined) {
              const val = Array.isArray(p.value) ? p.value[1] : p.value;
              result += `<div>${p.marker} ${p.seriesName}: <b>${formatNumber(val)}</b></div>`;
            }
          });
          return result;
        },
      },
      grid: {
        left: '3%',
        right: dataType === 'both' ? '10%' : '3%',
        top: '10%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: { color: theme.colors.border },
        },
        axisLabel: {
          color: theme.colors.text.secondary,
          fontSize: 11,
          formatter: (value: number) => formatTime(new Date(value).toISOString(), 'HH:mm'),
        },
      },
      yAxis,
      series,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 24,
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
          labelFormatter: (value: number) => formatTime(new Date(value).toISOString(), 'MM-DD HH:mm'),
        },
      ],
    };
  }, [
    dataWithThresholdFlag,
    dataYoY,
    dataMoM,
    dataType,
    showYoYLine,
    showMoMLine,
    enabledThresholds,
    theme,
    mode,
    yAxisName,
    yAxisName2,
    unit,
    unit2,
    highlightOverThreshold,
  ]);

  const onChartEvents = useMemo(
    () => ({
      click: (params: any) => {
        if (params.dataIndex !== undefined && dataWithThresholdFlag[params.dataIndex]) {
          const clickedData = dataWithThresholdFlag[params.dataIndex];
          onDataClick?.(clickedData);
          onClick?.(clickedData);
          if (onTimeChange) {
            onTimeChange(clickedData.time);
          }
          setCurrentTime(clickedData.time);
        }
      },
      dataZoom: (params: any) => {
        const chart = chartRef.current?.getEchartsInstance();
        if (chart) {
          const option = chart.getOption() as any;
          const dataZoom = option.dataZoom?.[0];
          if (dataZoom && dataZoom.startValue !== undefined && dataZoom.endValue !== undefined) {
            const range = {
              start: new Date(dataZoom.startValue).toISOString(),
              end: new Date(dataZoom.endValue).toISOString(),
            };
            setLocalTimeRange(range);
            setSelectedTimeRange(range);
            onTimeRangeChange?.(range);
          }
        }
      },
    }),
    [dataWithThresholdFlag, onDataClick, onClick, onTimeChange, onTimeRangeChange, setCurrentTime, setSelectedTimeRange]
  );

  const toggleThreshold = (index: number) => {
    const newLines = [...thresholdLines];
    newLines[index] = { ...newLines[index], enabled: !newLines[index].enabled };
    setThresholdLines(newLines);
  };

  if (dataWithThresholdFlag.length === 0) {
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: theme.spacing.md, flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <div>
          {title && (
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
              {title}
            </h4>
          )}
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

        <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setShowYoY(!showYoYLine)}
            style={{
              padding: '3px 10px',
              borderRadius: '12px',
              border: `1px solid ${showYoYLine ? theme.colors.warning : theme.colors.border}`,
              backgroundColor: showYoYLine ? `${theme.colors.warning}15` : 'transparent',
              color: showYoYLine ? theme.colors.warning : theme.colors.text.secondary,
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            同比
          </button>
          <button
            onClick={() => setShowMoM(!showMoMLine)}
            style={{
              padding: '3px 10px',
              borderRadius: '12px',
              border: `1px solid ${showMoMLine ? theme.colors.success : theme.colors.border}`,
              backgroundColor: showMoMLine ? `${theme.colors.success}15` : 'transparent',
              color: showMoMLine ? theme.colors.success : theme.colors.text.secondary,
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            环比
          </button>
        </div>
      </div>

      {showThresholdToggle && thresholdLines.length > 0 && (
        <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: theme.colors.text.secondary, display: 'flex', alignItems: 'center' }}>
            阈值线：
          </span>
          {thresholdLines.map((line, index) => (
            <button
              key={line.name}
              onClick={() => toggleThreshold(index)}
              style={{
                padding: '2px 10px',
                borderRadius: '10px',
                border: `1px solid ${line.enabled ? (line.color || theme.colors.danger) : theme.colors.border}`,
                backgroundColor: line.enabled ? `${line.color || theme.colors.danger}10` : 'transparent',
                color: line.enabled ? (line.color || theme.colors.danger) : theme.colors.text.disabled,
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              {line.name} ({line.value})
            </button>
          ))}
        </div>
      )}

      {showTimeRangePicker && (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm, fontSize: '12px' }}>
          <span style={{ color: theme.colors.text.secondary }}>时间范围：</span>
          <span style={{ color: theme.colors.text.primary }}>
            {activeTimeRange
              ? `${formatTime(activeTimeRange.start, 'MM-DD HH:mm')} ~ ${formatTime(activeTimeRange.end, 'MM-DD HH:mm')}`
              : '全部'}
          </span>
          {activeTimeRange && (
            <button
              onClick={() => {
                setLocalTimeRange(null);
                setSelectedTimeRange(null);
                onTimeRangeChange?.({ start: '', end: '' } as any);
              }}
              style={{
                padding: '1px 8px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '10px',
                backgroundColor: 'transparent',
                color: theme.colors.text.secondary,
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              重置
            </button>
          )}
        </div>
      )}

      {activeCurrentTime && (
        <div style={{ fontSize: '12px', color: theme.colors.primary, marginBottom: theme.spacing.sm }}>
          📍 当前时间：{formatTime(activeCurrentTime)}
        </div>
      )}

      <ReactECharts
        ref={chartRef}
        option={chartOption}
        style={{ height: '320px', width: '100%' }}
        notMerge={true}
        onEvents={onChartEvents}
        theme={mode === 'dark' ? 'dark' : undefined}
      />
    </div>
  );
};
