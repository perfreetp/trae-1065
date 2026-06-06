import React, { useState, useRef } from 'react';
import {
  ThemeProvider,
  useTheme,
  LinkageProvider,
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
} from './mockData';

const DemoContent: React.FC = () => {
  const { theme, mode } = useTheme();
  const { selectedStationId } = useLinkage();
  const pageRef = useRef<HTMLDivElement>(null);
  const [visibleTypes, setVisibleTypes] = useState<string[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);

  const selectedStation = mockStations.find((s) => s.id === selectedStationId);

  const filterOptions = [
    { label: '雨量站', value: 'rain' },
    { label: '水位站', value: 'water' },
    { label: '水库', value: 'reservoir' },
    { label: '闸门', value: 'gate' },
    { label: '泵站', value: 'pump' },
    { label: '风险点', value: 'risk' },
  ];

  const handleTypeToggle = (type: string) => {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

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
              水雨情和工程运行展示组件库
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
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: theme.colors.text.secondary,
              display: 'flex',
              alignItems: 'center',
              marginRight: theme.spacing.xs,
            }}
          >
            图层筛选：
          </span>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTypeToggle(opt.value)}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: `1px solid ${
                  visibleTypes.includes(opt.value) || visibleTypes.length === 0
                    ? theme.colors.primary
                    : theme.colors.border
                }`,
                backgroundColor:
                  visibleTypes.includes(opt.value) || visibleTypes.length === 0
                    ? `${theme.colors.primary}15`
                    : 'transparent',
                color:
                  visibleTypes.includes(opt.value) || visibleTypes.length === 0
                    ? theme.colors.primary
                    : theme.colors.text.secondary,
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          ))}
          <div style={{ width: '200px', marginLeft: 'auto' }}>
            <StationFilter
              stations={mockStations.map((s) => ({ id: s.id, name: s.name, type: s.type }))}
              selectedIds={selectedStationIds}
              onChange={setSelectedStationIds}
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
              stations={mockStations}
              visibleTypes={visibleTypes.length > 0 ? visibleTypes : undefined}
              style={{ height: '450px' }}
              onStationClick={(station) => console.log('Station clicked:', station)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            <StationCard
              station={selectedStation || mockStations[0]}
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
          <Hydrograph
            title="水位流量过程线"
            data={mockHydrographData}
            dataYoY={mockHydrographYoY}
            dataMoM={mockHydrographMoM}
            showYoY={true}
            showMoM={true}
            thresholdLines={[
              { name: '警戒水位', value: 28, color: '#faad14', type: 'dashed' },
              { name: '保证水位', value: 30, color: '#f5222d', type: 'dashed' },
            ]}
          />
          <WarningPanel
            warnings={mockWarnings}
            maxHeight={380}
            onWarningClick={(warning) => console.log('Warning clicked:', warning)}
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
            📖 快速开始
          </h3>
          <pre
            style={{
              margin: 0,
              padding: theme.spacing.md,
              backgroundColor: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              borderRadius: theme.radius.sm,
              fontSize: '12px',
              overflowX: 'auto',
              color: theme.colors.text.primary,
            }}
          >
{`import { ThemeProvider, MapLayer, Hydrograph, StationCard } from '@water-conservancy/visual-sdk';

function App() {
  return (
    <ThemeProvider initialMode="dark">
      <MapLayer stations={stations} />
      <Hydrograph data={data} thresholdLines={[{ name: '警戒水位', value: 28 }]} />
      <StationCard station={station} showYoY={true} />
    </ThemeProvider>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider initialMode="light">
      <LinkageProvider>
        <DemoContent />
      </LinkageProvider>
    </ThemeProvider>
  );
};

export default App;
