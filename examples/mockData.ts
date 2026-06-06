import { Station, TimeSeriesData, WarningItem, TimelineEvent, SectionLayer, SectionPoint, AdminBoundary } from '../src/types';

export const mockStations: Station[] = [
  {
    id: 's1',
    name: '李家巷雨量站',
    type: 'rain',
    lng: 118.78,
    lat: 32.05,
    value: 45.2,
    unit: 'mm',
    status: 'normal',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      rain1h: 12.5,
      rain6h: 28.3,
      rain12h: 38.7,
      rain24h: 45.2,
      rainTotal: 156.8,
    },
  },
  {
    id: 's2',
    name: '王家坝水位站',
    type: 'water',
    lng: 118.85,
    lat: 32.12,
    value: 28.5,
    value2: 1250,
    unit: 'm',
    status: 'warning',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      currentLevel: 28.5,
      currentFlow: 1250,
      currentVelocity: 1.8,
      waterTemp: 23.5,
      warningLevel: 28.0,
      guaranteeLevel: 29.5,
    },
  },
  {
    id: 's3',
    name: '光明水库',
    type: 'reservoir',
    lng: 118.92,
    lat: 31.98,
    value: 125.8,
    value2: 8500,
    unit: 'm',
    status: 'attention',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      currentLevel: 125.8,
      currentStorage: 8500,
      floodLimitLevel: 127.0,
      normalLevel: 128.5,
      deadLevel: 120.0,
      totalCapacity: 12000,
      storageRate: 70.8,
      inflow: 85,
      outflow: 50,
    },
  },
  {
    id: 's4',
    name: '东河闸',
    type: 'gate',
    lng: 118.72,
    lat: 32.18,
    value: 1,
    status: 'normal',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      openHeight: 2.5,
      openPercent: 50,
      totalHoles: 5,
      openHoles: 3,
      dischargeFlow: 120,
      operationStatus: 'partial',
      gateType: '弧形闸',
    },
  },
  {
    id: 's5',
    name: '西泵站',
    type: 'pump',
    lng: 118.65,
    lat: 32.08,
    value: 1,
    status: 'normal',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      totalPumps: 4,
      runningPumps: 2,
      totalFlow: 320,
      totalPower: 450,
      operationStatus: 'running',
      pumpType: '轴流泵',
      singlePumpFlow: 160,
    },
  },
  {
    id: 's6',
    name: '南山风险点',
    type: 'risk',
    lng: 118.88,
    lat: 31.88,
    value: 0,
    status: 'danger',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      riskType: '滑坡',
      riskLevel: 'high',
      affectedPopulation: 230,
      displacement: 12.5,
      displacementRate: 0.8,
      monitoringPoints: 6,
    },
  },
  {
    id: 's7',
    name: '张村雨量站',
    type: 'rain',
    lng: 118.58,
    lat: 32.15,
    value: 32.1,
    unit: 'mm',
    status: 'normal',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      rain1h: 8.2,
      rain6h: 18.5,
      rain12h: 26.8,
      rain24h: 32.1,
      rainTotal: 102.3,
    },
  },
  {
    id: 's8',
    name: '刘湾水位站',
    type: 'water',
    lng: 118.95,
    lat: 32.22,
    value: 32.1,
    value2: 2100,
    unit: 'm',
    status: 'normal',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      currentLevel: 32.1,
      currentFlow: 2100,
      currentVelocity: 2.2,
      waterTemp: 22.8,
      warningLevel: 33.0,
      guaranteeLevel: 34.5,
    },
  },
  {
    id: 's9',
    name: '北岭水库',
    type: 'reservoir',
    lng: 119.02,
    lat: 32.02,
    value: 98.5,
    value2: 5200,
    unit: 'm',
    status: 'normal',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      currentLevel: 98.5,
      currentStorage: 5200,
      floodLimitLevel: 100.0,
      normalLevel: 101.5,
      deadLevel: 95.0,
      totalCapacity: 8000,
      storageRate: 65.0,
      inflow: 45,
      outflow: 30,
    },
  },
  {
    id: 's10',
    name: '南河风险点',
    type: 'risk',
    lng: 118.82,
    lat: 31.82,
    value: 0,
    status: 'severe',
    updateTime: '2024-06-15 14:30:00',
    extra: {
      riskType: '山洪',
      riskLevel: 'extreme',
      affectedPopulation: 580,
      affectedArea: 12.5,
      rainfallIntensity: 85,
      monitoringPoints: 8,
    },
  },
];

const generateTimeSeriesData = (
  hours: number = 24,
  baseValue: number = 25,
  variance: number = 5,
  baseValue2: number = 1000,
  variance2: number = 300
): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const value = baseValue + (Math.random() - 0.5) * variance;
    data.push({
      time: time.toISOString(),
      value,
      value2: baseValue2 + (Math.random() - 0.5) * variance2,
      isOverThreshold: value > baseValue + variance * 0.6,
    });
  }
  return data;
};

export const mockHydrographData = generateTimeSeriesData(24, 28, 3, 1200, 200);
export const mockHydrographYoY = generateTimeSeriesData(24, 26, 2, 1100, 150);
export const mockHydrographMoM = generateTimeSeriesData(24, 27, 2, 1150, 180);

export const mockWarnings: WarningItem[] = [
  {
    id: 'w1',
    title: '王家坝水位超警戒',
    level: 'warning',
    content: '王家坝水位站水位达到28.5米，超过警戒水位0.5米，请密切关注。',
    stationId: 's2',
    stationName: '王家坝水位站',
    time: '2024-06-15 12:30:00',
    handled: false,
    type: 'water',
    value: 28.5,
    threshold: 28.0,
    unit: 'm',
  },
  {
    id: 'w2',
    title: '南河山洪风险预警',
    level: 'severe',
    content: '南河区域发生山洪风险极高，请立即组织人员转移。',
    stationId: 's10',
    stationName: '南河风险点',
    time: '2024-06-15 10:15:00',
    handled: false,
    type: 'risk',
  },
  {
    id: 'w3',
    title: '光明水库水位上涨',
    level: 'attention',
    content: '光明水库水位持续上涨，目前水位125.8米，距汛限水位1.2米。',
    stationId: 's3',
    stationName: '光明水库',
    time: '2024-06-15 08:00:00',
    handled: true,
    handler: '张工',
    handleTime: '2024-06-15 09:30:00',
    type: 'reservoir',
    value: 125.8,
    threshold: 127.0,
    unit: 'm',
  },
  {
    id: 'w4',
    title: '南山边坡位移异常',
    level: 'danger',
    content: '南山边坡监测点位移速率超过阈值，可能发生滑坡。',
    stationId: 's6',
    stationName: '南山风险点',
    time: '2024-06-15 06:45:00',
    handled: false,
    type: 'risk',
  },
  {
    id: 'w5',
    title: '李家巷累计降雨量较大',
    level: 'attention',
    content: '李家巷雨量站过去24小时累计降雨45.2mm，请注意防范。',
    stationId: 's1',
    stationName: '李家巷雨量站',
    time: '2024-06-15 05:00:00',
    handled: true,
    handler: '李工',
    handleTime: '2024-06-15 07:00:00',
    type: 'rain',
    value: 45.2,
    threshold: 50.0,
    unit: 'mm',
  },
];

const now = new Date();
const startTime = new Date(now.getTime() - 12 * 3600000).toISOString();
const endTime = new Date(now.getTime() + 12 * 3600000).toISOString();

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'e1',
    time: new Date(now.getTime() - 10 * 3600000).toISOString(),
    title: '启动防汛Ⅳ级响应',
    type: 'dispatch',
    content: '根据气象预报，启动全市防汛Ⅳ级应急响应。',
    operator: '指挥部',
    status: 'completed',
  },
  {
    id: 'e2',
    time: new Date(now.getTime() - 8 * 3600000).toISOString(),
    title: '光明水库预泄',
    type: 'operation',
    content: '光明水库开启泄洪洞预泄，流量50m³/s。',
    stationId: 's3',
    operator: '王调度',
    status: 'completed',
  },
  {
    id: 'e3',
    time: new Date(now.getTime() - 5 * 3600000).toISOString(),
    title: '王家坝水位超警',
    type: 'warning',
    content: '王家坝水位超过警戒水位0.3米。',
    stationId: 's2',
    status: 'processing',
  },
  {
    id: 'e4',
    time: new Date(now.getTime() - 2 * 3600000).toISOString(),
    title: '东河闸全开',
    type: 'operation',
    content: '东河闸全部开启泄洪。',
    stationId: 's4',
    operator: '李值班',
    status: 'completed',
  },
  {
    id: 'e5',
    time: new Date(now.getTime() + 2 * 3600000).toISOString(),
    title: '预计洪峰到达',
    type: 'observation',
    content: '预计洪峰将于2小时后到达王家坝断面。',
    stationId: 's2',
    status: 'pending',
  },
  {
    id: 'e6',
    time: new Date(now.getTime() + 6 * 3600000).toISOString(),
    title: '启动泵站运行',
    type: 'dispatch',
    content: '根据水情，启动西泵站进行排涝。',
    stationId: 's5',
    operator: '张工',
    status: 'pending',
  },
];

export const mockTimelineRange = { startTime, endTime };

export const mockSectionLayers: SectionLayer[] = [
  { name: '水体', top: 120, bottom: 115, color: '#1890ff', type: 'water' },
  { name: '淤泥层', top: 115, bottom: 110, color: '#8b7355', type: 'sediment' },
  { name: '粘土层', top: 110, bottom: 100, color: '#d4a373', type: 'earth' },
  { name: '砂层', top: 100, bottom: 90, color: '#e9c46a', type: 'earth' },
  { name: '基岩', top: 90, bottom: 80, color: '#6c757d', type: 'bedrock' },
];

export const mockSectionPoints: SectionPoint[] = [
  { name: '监测点A', x: 20, y: 118, value: 118.5, unit: 'm', markerColor: '#52c41a' },
  { name: '监测点B', x: 50, y: 116, value: 116.2, unit: 'm', markerColor: '#faad14' },
  { name: '监测点C', x: 80, y: 117, value: 117.8, unit: 'm', markerColor: '#52c41a' },
];

export const mockAdminBoundaries: AdminBoundary[] = [
  {
    name: '东区',
    points: [
      { lng: 118.55, lat: 31.8 },
      { lng: 119.05, lat: 31.8 },
      { lng: 119.05, lat: 32.25 },
      { lng: 118.55, lat: 32.25 },
    ],
    fillColor: '#1890ff10',
    strokeColor: '#1890ff',
    strokeWidth: 2,
  },
];

export const mockReportData = [
  { id: 'r1', stationId: 's1', station: '李家巷雨量站', type: 'rain', typeName: '雨量站', rainfall: 45.2, waterLevel: null, status: 'normal', statusName: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r2', stationId: 's2', station: '王家坝水位站', type: 'water', typeName: '水位站', rainfall: null, waterLevel: 28.5, status: 'warning', statusName: '预警', updateTime: '2024-06-15 14:30:00' },
  { id: 'r3', stationId: 's3', station: '光明水库', type: 'reservoir', typeName: '水库', rainfall: null, waterLevel: 125.8, status: 'attention', statusName: '注意', updateTime: '2024-06-15 14:30:00' },
  { id: 'r4', stationId: 's4', station: '东河闸', type: 'gate', typeName: '闸门', rainfall: null, waterLevel: null, status: 'normal', statusName: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r5', stationId: 's5', station: '西泵站', type: 'pump', typeName: '泵站', rainfall: null, waterLevel: null, status: 'normal', statusName: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r6', stationId: 's7', station: '张村雨量站', type: 'rain', typeName: '雨量站', rainfall: 32.1, waterLevel: null, status: 'normal', statusName: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r7', stationId: 's8', station: '刘湾水位站', type: 'water', typeName: '水位站', rainfall: null, waterLevel: 32.1, status: 'normal', statusName: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r8', stationId: 's9', station: '北岭水库', type: 'reservoir', typeName: '水库', rainfall: null, waterLevel: 98.5, status: 'normal', statusName: '正常', updateTime: '2024-06-15 14:30:00' },
];

export const mockReportColumns = [
  { key: 'station', title: '站点名称', dataIndex: 'station', width: 150 },
  { key: 'typeName', title: '站点类型', dataIndex: 'typeName', width: 100 },
  { key: 'rainfall', title: '降雨量(mm)', dataIndex: 'rainfall', type: 'number' as const, width: 120, decimals: 1, align: 'right' as const },
  { key: 'waterLevel', title: '水位(m)', dataIndex: 'waterLevel', type: 'number' as const, width: 100, decimals: 2, align: 'right' as const },
  { key: 'statusName', title: '状态', dataIndex: 'statusName', type: 'status' as const, width: 80, align: 'center' as const },
  { key: 'updateTime', title: '更新时间', dataIndex: 'updateTime', type: 'time' as const, width: 160 },
];
