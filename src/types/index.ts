export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    background: string;
    surface: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export type StationType = 'rain' | 'water' | 'reservoir' | 'gate' | 'pump' | 'risk';

export type WarningLevel = 'normal' | 'attention' | 'warning' | 'danger' | 'severe';

export interface ReservoirExtra {
  waterLevel?: number;
  storage?: number;
  storagePercent?: number;
  floodLimitLevel?: number;
  normalLevel?: number;
  deadLevel?: number;
  inflow?: number;
  outflow?: number;
}

export interface GateExtra {
  opening?: number;
  openingPercent?: number;
  gateCount?: number;
  openCount?: number;
  discharge?: number;
  status?: 'open' | 'closed' | 'partial';
}

export interface PumpExtra {
  runningCount?: number;
  totalCount?: number;
  flowRate?: number;
  power?: number;
  status?: 'running' | 'stopped' | 'partial';
}

export interface RainExtra {
  rainfall1h?: number;
  rainfall6h?: number;
  rainfall12h?: number;
  rainfall24h?: number;
  rainfallTotal?: number;
}

export interface WaterExtra {
  waterLevel?: number;
  flowRate?: number;
  velocity?: number;
  waterTemperature?: number;
}

export interface RiskExtra {
  riskType?: string;
  riskLevel?: string;
  affectedPeople?: number;
  displacement?: number;
}

export interface Station {
  id: string;
  name: string;
  type: StationType;
  lng: number;
  lat: number;
  value?: number;
  value2?: number;
  unit?: string;
  status?: WarningLevel;
  updateTime?: string;
  extra?: ReservoirExtra | GateExtra | PumpExtra | RainExtra | WaterExtra | RiskExtra;
  [key: string]: any;
}

export interface TimeSeriesData {
  time: string;
  value: number;
  value2?: number;
  isOverThreshold?: boolean;
}

export interface ThresholdLine {
  name: string;
  value: number;
  color?: string;
  type?: 'solid' | 'dashed' | 'dotted';
  enabled?: boolean;
}

export interface LegendItem {
  name: string;
  color: string;
  visible: boolean;
  type?: StationType;
}

export interface FilterOption {
  label: string;
  value: string;
  checked: boolean;
}

export interface BaseComponentProps {
  theme?: ThemeMode | Partial<ThemeConfig>;
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
  onClick?: (data: any) => void;
}

export interface ExportOptions {
  filename?: string;
  format?: 'png' | 'jpeg' | 'csv' | 'excel';
  quality?: number;
  backgroundColor?: string;
}

export interface MapBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface AdminBoundary {
  name: string;
  coordinates: [number, number][];
  color?: string;
}

