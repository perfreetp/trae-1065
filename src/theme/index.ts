import { ThemeConfig, ThemeMode } from '../types';

export const lightTheme: ThemeConfig = {
  mode: 'light',
  colors: {
    primary: '#1890ff',
    secondary: '#722ed1',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#f5222d',
    info: '#13c2c2',
    background: '#f0f2f5',
    surface: '#ffffff',
    border: '#e8e8e8',
    text: {
      primary: '#262626',
      secondary: '#595959',
      disabled: '#bfbfbf',
    },
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

export const darkTheme: ThemeConfig = {
  mode: 'dark',
  colors: {
    primary: '#177ddc',
    secondary: '#9254de',
    success: '#49aa19',
    warning: '#d89614',
    danger: '#d32029',
    info: '#08979c',
    background: '#141414',
    surface: '#1f1f1f',
    border: '#303030',
    text: {
      primary: '#ffffff',
      secondary: '#a6a6a6',
      disabled: '#595959',
    },
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

export const getTheme = (mode: ThemeMode): ThemeConfig => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

export const mergeTheme = (base: ThemeConfig, custom: Partial<ThemeConfig>): ThemeConfig => {
  return {
    ...base,
    ...custom,
    colors: {
      ...base.colors,
      ...custom.colors,
      text: {
        ...base.colors.text,
        ...custom.colors?.text,
      },
    },
    radius: {
      ...base.radius,
      ...custom.radius,
    },
    spacing: {
      ...base.spacing,
      ...custom.spacing,
    },
  };
};
