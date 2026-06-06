import React, { useState, useRef, useMemo } from 'react';
import {
  ThemeProvider,
  useTheme,
  LinkageProvider,
  DataProvider,
  MapLayer,
  StationCard,
  Hydrograph,
  WarningPanel,
  DispatchTimeline,
  SectionProfile,
  ReportTable,
  ThemeSwitcher,
  StationFilter,
  ScreenshotButton,
  useLinkage,
  useDataFilter,
} from '../src';
import {
  mockStations,
  mockHydrographData,
  mockHydrographYoY,
  mockHydrographMoM,
  mockWarnings,
  mockTimelineEvents,
  mockTimelineRange,
  mockSectionLayers,
  mockSectionPoints,
  mockReportData,
  mockReportColumns,
  mockAdminBoundaries,
  mockStationHydrographs,
} from './mockData';

const DemoContent: React.FC = () => {
  const { theme, mode } = useTheme();
  const { selectedStationId, setSelectedStationId, focusStationByWarning, compareStationIds, clearCompareStations } = useLinkage();
  const { filteredStations, filters, setSelectedStationIds, selectedStationIds } = useDataFilter();
  const pageRef = useRef<HTMLDivElement>(null);

  const selectedStation = useMemo(() => {
    if (filteredStations.length === 0) return undefined;
    const found = filteredStations.find((s) => s.id === selectedStationId);
    if (found) return found;
    if (filteredStations.length > 0) {
      setTimeout(() => setSelectedStationId(filteredStations[0].id), 0);
      return filteredStations[0];
    }
    return undefined;
  }, [selectedStationId, filteredStations, setSelectedStationId]);

  const stationHydrograph = useMemo(() => {
    if (!selectedStation?.id) return null;
    return mockStationHydrographs[selectedStation.id] || null;
  }, [selectedStation]);

  const compareHydrographs = useMemo(() => {
    const result: {
      stationId: string;
      stationName: string;
      color: string;
      data: any;
    }[] = [];
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
    compareStationIds.forEach((stationId, idx) => {
      const station = mockStations.find((s) => s.id === stationId);
      const hydrograph = mockStationHydrographs[stationId];
      if (station) {
        result.push({
          stationId,
          stationName: station.name,
          color: colors[idx % colors.length],
          data: hydrograph || null,
        });
      }
    });
    return result;
  }, [compareStationIds]);

  const filteredWarnings = useMemo(() => {
    return mockWarnings.filter((w) => {
      if (filters.selectedStationIds.length > 0) {
        if (!w.stationId || !filters.selectedStationIds.includes(w.stationId)) return false;
      }
      if (filters.selectedTypes.length > 0) {
        const station = mockStations.find((s) => s.id === w.stationId);
        if (!station || !filters.selectedTypes.includes(station.type)) return false;
      }
      if (filters.selectedStatuses.length > 0) {
        if (!filters.selectedStatuses.includes(w.level)) return false;
      }
      return true;
    });
  }, [filters]);

  const filteredReportData = useMemo(() => {
    if (filters.selectedStationIds.length > 0) {
      return mockReportData.filter((r) => filters.selectedStationIds.includes(r.stationId));
    }
    return mockReportData;
  }, [filters.selectedStationIds]);

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.xl,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: theme.colors.text.primary,
              }}
            >
              🌊 智慧水利可视化 SDK
            </h1>
            <p
              style={{
                margin: `${theme.spacing.xs} 0 0`,
                color: theme.colors.text.secondary,
                fontSize: '14px',
              }}
            >
              水雨情和工程运行展示组件库 · 增强版
            </p>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <ThemeSwitcher />
            <ScreenshotButton
              targetRef={pageRef}
              options={{ filename: '智慧水利可视化面板' }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginRight: theme.spacing.xs,
            }}
          >
            💡 提示：点击地图站点、预警项、表格行可联动所有组件
          </span>
          <div style={{ width: '280px', marginLeft: 'auto' }}>
            <StationFilter
              stations={mockStations.map((s) => ({ id: s.id, name: s.name, type: s.type }))}
              selectedIds={filters.selectedStationIds}
              onChange={setSelectedStationIds}
              placeholder="筛选站点（影响所有组件）"
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}
        >
          <div>
            <MapLayer
              stations={filteredStations}
              adminBoundaries={mockAdminBoundaries}
              useGlobalFilter={true}
              showLegend={true}
              style={{ height: '480px' }}
              onStationClick={(station) => console.log('Station clicked:', station)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            <StationCard
              station={selectedStation}
              showYoY={true}
              lastYearValue={24.8}
            />
            <DispatchTimeline
              events={mockTimelineEvents}
              startTime={mockTimelineRange.startTime}
              endTime={mockTimelineRange.endTime}
              autoPlay={false}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              overflow: 'hidden',
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
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
                {compareStationIds.length > 0 ? `多站点对比 (${compareStationIds.length}个站点)` : `${selectedStation?.name || '站点'} - 过程线`}
              </h4>
              {compareStationIds.length > 0 && (
                <button
                  onClick={clearCompareStations}
                  style={{
                    padding: '2px 10px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    color: theme.colors.text.secondary,
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  清空对比
                </button>
              )}
            </div>
            {stationHydrograph || compareHydrographs.length > 0 ? (
              compareHydrographs.length > 0 ? (
                <div style={{ height: '380px', padding: theme.spacing.md, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: theme.spacing.sm, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {compareHydrographs.map((item) => (
                      <div
                        key={item.stationId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: item.data ? `${item.color}15` : `${theme.colors.text.disabled}15`,
                          border: `1px solid ${item.data ? `${item.color}40` : theme.colors.border}`,
                          borderRadius: '10px',
                          color: theme.colors.text.secondary,
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: item.data ? item.color : theme.colors.text.disabled,
                          }}
                        />
                        {item.stationName}
                        {!item.data && (
                          <span style={{ color: theme.colors.text.disabled, fontSize: '10px' }}>
                            (无数据)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Hydrograph
                    title=""
                    data={[]}
                    compareDatasets={compareHydrographs.filter((h) => h.data).map((h) => ({
                      stationId: h.stationId,
                      stationName: h.stationName,
                      color: h.color,
                      data: h.data.data,
                    }))}
                    mode="water"
                    height={320}
                    showSwitcher={false}
                    showThresholdToggle={false}
                  />
                </div>
              ) : (
                <Hydrograph
                  title=""
                  data={stationHydrograph.data}
                  dataYoY={stationHydrograph.dataYoY}
                  dataMoM={stationHydrograph.dataMoM}
                  showYoY={!!stationHydrograph.dataYoY}
                  showMoM={!!stationHydrograph.dataMoM}
                  showThresholdToggle={true}
                  mode={stationHydrograph.mode || 'dual'}
                  thresholdLines={stationHydrograph.thresholdLines}
                  yAxisName={stationHydrograph.yAxisName}
                  yAxisName2={stationHydrograph.yAxisName2}
                  height={380}
                />
              )
            ) : (
              <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: theme.colors.text.secondary, fontSize: '13px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
                  {selectedStation ? '该站点暂无过程线数据' : '请选择站点查看过程线'}
                </div>
              </div>
            )}
          </div>
          <WarningPanel
            warnings={filteredWarnings}
            maxHeight={380}
            onWarningClick={(warning) => {
              console.log('Warning clicked:', warning);
              const stationId = warning.stationId;
              const isStationVisible = filteredStations.some((s) => s.id === stationId);
              
              if (!isStationVisible) {
                const useGlobalFilter = selectedStationIds.length > 0;
                if (useGlobalFilter) {
                  setSelectedStationIds([...selectedStationIds, stationId]);
                }
              }
              
              setTimeout(() => {
                focusStationByWarning(stationId, warning.time);
              }, 50);
            }}
            onHandle={(warning) => console.log('Handle warning:', warning)}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.lg,
          }}
        >
          <SectionProfile
            title="河道剖面示意图"
            layers={mockSectionLayers}
            points={mockSectionPoints}
            waterLevel={118.5}
            minElevation={80}
            maxElevation={125}
          />
          <ReportTable
            title="站点数据报表"
            columns={mockReportColumns as any}
            dataSource={mockReportData}
            useGlobalFilter={true}
            filterOptions={{
              typeField: 'type',
              statusField: 'status',
              timeField: 'updateTime',
              stationIdField: 'stationId',
            }}
            onRowClick={(record) => console.log('Row clicked:', record)}
          />
        </div>

        <div
          style={{
            marginTop: theme.spacing.xl,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '16px',
              color: theme.colors.text.primary,
            }}
          >
            ✨ 本次增强功能
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: theme.spacing.md,
              fontSize: '13px',
              color: theme.colors.text.secondary,
              lineHeight: 1.8,
            }}
          >
            <div>
              <strong style={{ color: theme.colors.primary }}>1. 全局站点筛选</strong>
              <p style={{ margin: '4px 0 0' }}>顶部筛选框勾选后，地图、卡片、预警、报表同步更新</p>
            </div>
            <div>
              <strong style={{ color: theme.colors.primary }}>2. 地图图例开关</strong>
              <p style={{ margin: '4px 0 0' }}>点击图例可隐藏/显示对应类型点位，与全局筛选独立</p>
            </div>
            <div>
              <strong style={{ color: theme.colors.primary }}>3. 业务化卡片展示</strong>
              <p style={{ margin: '4px 0 0' }}>水库/闸门/泵站/雨量站/水位站/风险点各有专属字段</p>
            </div>
            <div>
              <strong style={{ color: theme.colors.primary }}>4. 增强地图能力</strong>
              <p style={{ margin: '4px 0 0' }}>行政区边界、经纬度落位、聚合点展开列表</p>
            </div>
            <div>
              <strong style={{ color: theme.colors.primary }}>5. 深度组件联动</strong>
              <p style={{ margin: '4px 0 0' }}>站点↔过程线↔预警↔时间轴全方位联动</p>
            </div>
            <div>
              <strong style={{ color: theme.colors.primary }}>6. 过程线分析</strong>
              <p style={{ margin: '4px 0 0' }}>双轴显示、阈值开关、超阈值高亮、时间范围选择</p>
            </div>
            <div>
              <strong style={{ color: theme.colors.primary }}>7. 报表导出能力</strong>
              <p style={{ margin: '4px 0 0' }}>CSV导出、组合过滤、联动高亮</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider initialMode="light">
      <DataProvider stations={mockStations} warnings={mockWarnings}>
        <LinkageProvider>
          <DemoContent />
        </LinkageProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;
