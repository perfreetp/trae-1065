import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { classNames } from '../../utils';

interface EmptyProps {
  text?: string;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Empty: React.FC<EmptyProps> = ({
  text = '暂无数据',
  icon,
  className,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={classNames('water-sdk-empty', className)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        color: theme.colors.text.secondary,
        ...style,
      }}
    >
      {icon || (
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          style={{ marginBottom: theme.spacing.md, opacity: 0.5 }}
        >
          <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" />
          <path d="M20 32h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <span style={{ fontSize: '14px' }}>{text}</span>
    </div>
  );
};
