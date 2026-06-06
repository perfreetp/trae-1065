import React, { useRef } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { classNames, exportScreenshot } from '../../utils';
import { ExportOptions } from '../../types';

interface ScreenshotButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  options?: ExportOptions;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const ScreenshotButton: React.FC<ScreenshotButtonProps> = ({
  targetRef,
  options,
  className,
  style,
  children = '导出截图',
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = React.useState(false);

  const handleExport = async () => {
    if (!targetRef.current) return;
    setLoading(true);
    try {
      await exportScreenshot(targetRef.current, options);
    } catch (error) {
      console.error('导出截图失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={classNames('water-sdk-screenshot-btn', className)}
      onClick={handleExport}
      disabled={loading}
      style={{
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        backgroundColor: theme.colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: theme.radius.sm,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '12px',
        opacity: loading ? 0.7 : 1,
        ...style,
      }}
    >
      {loading ? '导出中...' : children}
    </button>
  );
};
