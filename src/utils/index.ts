import html2canvas from 'html2canvas';
import { ExportOptions } from '../types';

export const classNames = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === null || num === undefined || isNaN(num)) return '--';
  return Number(num).toFixed(decimals);
};

export const formatTime = (time: string, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!time) return '--';
  try {
    const date = new Date(time);
    const map: Record<string, string> = {
      YYYY: date.getFullYear().toString(),
      MM: (date.getMonth() + 1).toString().padStart(2, '0'),
      DD: date.getDate().toString().padStart(2, '0'),
      HH: date.getHours().toString().padStart(2, '0'),
      mm: date.getMinutes().toString().padStart(2, '0'),
      ss: date.getSeconds().toString().padStart(2, '0'),
    };
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
  } catch {
    return time;
  }
};

export const calculateYoY = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const calculateMoM = (current: number, previous: number): number => {
  return calculateYoY(current, previous);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const exportScreenshot = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'screenshot',
    format = 'png',
    quality = 0.92,
    backgroundColor,
  } = options;

  const canvas = await html2canvas(element, {
    backgroundColor: backgroundColor || null,
    useCORS: true,
    scale: 2,
  });

  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = canvas.toDataURL(`image/${format}`, quality);
  link.click();
};

export const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getWarningColor = (level: string): string => {
  const colorMap: Record<string, string> = {
    normal: '#52c41a',
    attention: '#1890ff',
    warning: '#faad14',
    danger: '#f5222d',
    severe: '#722ed1',
  };
  return colorMap[level] || '#52c41a';
};

export const getStationColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    rain: '#1890ff',
    water: '#13c2c2',
    reservoir: '#722ed1',
    gate: '#fa8c16',
    pump: '#52c41a',
    risk: '#f5222d',
  };
  return colorMap[type] || '#1890ff';
};
