import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { classNames } from '../../utils';

interface ThemeSwitcherProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className, style }) => {
  const { mode, setMode, theme } = useTheme();

  return (
    <button
      className={classNames('water-sdk-theme-switcher', className)}
      onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
      style={{
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.sm,
        cursor: 'pointer',
        fontSize: '12px',
        color: theme.colors.text.primary,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.xs,
        ...style,
      }}
    >
      {mode === 'light' ? '🌙 深色' : '☀️ 浅色'}
    </button>
  );
};
