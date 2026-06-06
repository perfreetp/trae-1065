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
  [key: string]: any;
}

export interface TimeSeriesData {
  time: string;
  value: number;
  value2?: number;
}

export interface ThresholdLine {
  name: string;
  value: number;
  color?: string;
  type?: 'solid' | 'dashed' | 'dotted';
}

export interface LegendItem {
  name: string;
  color: string;
  visible: boolean;
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
  format?: 'png' | 'jpeg';
  quality?: number;
  backgroundColor?: string;
}
