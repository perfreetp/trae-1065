import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ThemeConfig, ThemeMode } from '../types';
import { getTheme, mergeTheme } from './index';

interface ThemeContextType {
  theme: ThemeConfig;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: ThemeMode;
  customTheme?: Partial<ThemeConfig>;
}> = ({ children, initialMode = 'light', customTheme }) => {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [customConfig, setCustomConfig] = useState<Partial<ThemeConfig>>(customTheme || {});

  const theme = useMemo(() => {
    const baseTheme = getTheme(mode);
    return mergeTheme(baseTheme, customConfig);
  }, [mode, customConfig]);

  const handleSetTheme = useCallback((newTheme: Partial<ThemeConfig>) => {
    setCustomConfig(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    const defaultTheme = getTheme('light');
    return {
      theme: defaultTheme,
      mode: 'light',
      setMode: () => {},
      setTheme: () => {},
    };
  }
  return context;
};
