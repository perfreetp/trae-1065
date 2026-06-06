import { ThemeMode, ThemeConfig } from './types';
import { getTheme, mergeTheme } from './theme';

interface SDKConfig {
  defaultTheme: ThemeMode;
  customTheme?: Partial<ThemeConfig>;
  enableLinkage: boolean;
  locale: 'zh-CN' | 'en-US';
}

class WaterVisualSDK {
  private config: SDKConfig = {
    defaultTheme: 'light',
    enableLinkage: true,
    locale: 'zh-CN',
  };

  private initialized = false;

  constructor() {}

  init(config?: Partial<SDKConfig>): void {
    if (this.initialized) {
      console.warn('WaterVisualSDK already initialized');
      return;
    }
    this.config = { ...this.config, ...config };
    this.initialized = true;
  }

  getConfig(): SDKConfig {
    return { ...this.config };
  }

  setTheme(mode: ThemeMode): void {
    this.config.defaultTheme = mode;
  }

  getTheme() {
    const baseTheme = getTheme(this.config.defaultTheme);
    if (this.config.customTheme) {
      return mergeTheme(baseTheme, this.config.customTheme);
    }
    return baseTheme;
  }

  version: string = '1.0.0';
}

export const sdk = new WaterVisualSDK();
export default WaterVisualSDK;
