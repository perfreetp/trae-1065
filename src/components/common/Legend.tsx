import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { classNames } from '../../utils';

interface LegendProps {
  items: { name: string; color: string; visible: boolean }[];
  onChange?: (items: { name: string; color: string; visible: boolean }[]) => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export const Legend: React.FC<LegendProps> = ({
  items,
  onChange,
  position = 'top',
  className,
  style,
}) => {
  const { theme } = useTheme();

  const handleToggle = (index: number) => {
    if (!onChange) return;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], visible: !newItems[index].visible };
    onChange(newItems);
  };

  const flexDirection = position === 'left' || position === 'right' ? 'column' : 'row';

  return (
    <div
      className={classNames('water-sdk-legend', className)}
      style={{
        display: 'flex',
        flexDirection,
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        padding: theme.spacing.sm,
        ...style,
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.name}
          onClick={() => handleToggle(index)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            cursor: onChange ? 'pointer' : 'default',
            opacity: item.visible ? 1 : 0.4,
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: item.color,
            }}
          />
          <span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
};
