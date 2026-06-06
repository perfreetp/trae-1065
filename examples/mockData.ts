import { Station, TimeSeriesData, WarningItem, TimelineEvent, SectionLayer, SectionPoint } from '../src/types';

export const mockStations: Station[] = [
  { id: 's1', name: '李家巷雨量站', type: 'rain', lng: 15, lat: 20, value: 45.2, unit: 'mm', status: 'normal', updateTime: '2024-06-15 14:30:00' },
  { id: 's2', name: '王家坝水位站', type: 'water', lng: 35, lat: 35, value: 28.5, value2: 1250, unit: 'm', status: 'warning', updateTime: '2024-06-15 14:30:00' },
  { id: 's3', name: '光明水库', type: 'reservoir', lng: 55, lat: 25, value: 125.8, value2: 8500, unit: 'm', status: 'attention', updateTime: '2024-06-15 14:30:00' },
  { id: 's4', name: '东河闸', type: 'gate', lng: 25, lat: 55, value: 1, status: 'normal', updateTime: '2024-06-15 14:30:00' },
  { id: 's5', name: '西泵站', type: 'pump', lng: 70, lat: 45, value: 1, status: 'normal', updateTime: '2024-06-15 14:30:00' },
  { id: 's6', name: '南山风险点', type: 'risk', lng: 45, lat: 65, value: 0, status: 'danger', updateTime: '2024-06-15 14:30:00' },
  { id: 's7', name: '张村雨量站', type: 'rain', lng: 10, lat: 40, value: 32.1, unit: 'mm', status: 'normal', updateTime: '2024-06-15 14:30:00' },
  { id: 's8', name: '刘湾水位站', type: 'water', lng: 60, lat: 70, value: 32.1, value2: 2100, unit: 'm', status: 'normal', updateTime: '2024-06-15 14:30:00' },
  { id: 's9', name: '北岭水库', type: 'reservoir', lng: 80, lat: 30, value: 98.5, value2: 5200, unit: 'm', status: 'normal', updateTime: '2024-06-15 14:30:00' },
  { id: 's10', name: '南河风险点', type: 'risk', lng: 50, lat: 15, value: 0, status: 'severe', updateTime: '2024-06-15 14:30:00' },
];

const generateTimeSeriesData = (hours: number = 24, baseValue: number = 25, variance: number = 5): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: time.toISOString(),
      value: baseValue + (Math.random() - 0.5) * variance,
      value2: 1000 + Math.random() * 500,
    });
  }
  return data;
};

export const mockHydrographData = generateTimeSeriesData(24, 28, 3);
export const mockHydrographYoY = generateTimeSeriesData(24, 26, 2);
export const mockHydrographMoM = generateTimeSeriesData(24, 27, 2);

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

export const mockReportData = [
  { id: 'r1', station: '李家巷雨量站', type: '雨量站', rainfall: 45.2, waterLevel: null, status: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r2', station: '王家坝水位站', type: '水位站', rainfall: null, waterLevel: 28.5, status: '预警', updateTime: '2024-06-15 14:30:00' },
  { id: 'r3', station: '光明水库', type: '水库', rainfall: null, waterLevel: 125.8, status: '注意', updateTime: '2024-06-15 14:30:00' },
  { id: 'r4', station: '东河闸', type: '闸门', rainfall: null, waterLevel: null, status: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r5', station: '西泵站', type: '泵站', rainfall: null, waterLevel: null, status: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r6', station: '张村雨量站', type: '雨量站', rainfall: 32.1, waterLevel: null, status: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r7', station: '刘湾水位站', type: '水位站', rainfall: null, waterLevel: 32.1, status: '正常', updateTime: '2024-06-15 14:30:00' },
  { id: 'r8', station: '北岭水库', type: '水库', rainfall: null, waterLevel: 98.5, status: '正常', updateTime: '2024-06-15 14:30:00' },
];

export const mockReportColumns = [
  { key: 'station', title: '站点名称', dataIndex: 'station', width: 150 },
  { key: 'type', title: '站点类型', dataIndex: 'type', width: 100 },
  { key: 'rainfall', title: '降雨量(mm)', dataIndex: 'rainfall', type: 'number', width: 120, decimals: 1, align: 'right' as const },
  { key: 'waterLevel', title: '水位(m)', dataIndex: 'waterLevel', type: 'number', width: 100, decimals: 2, align: 'right' as const },
  { key: 'status', title: '状态', dataIndex: 'status', type: 'status' as const, width: 80, align: 'center' as const },
  { key: 'updateTime', title: '更新时间', dataIndex: 'updateTime', type: 'time' as const, width: 160 },
];
