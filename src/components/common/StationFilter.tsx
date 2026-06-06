import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { classNames } from '../../utils';

interface StationFilterProps {
  stations: { id: string; name: string; type: string }[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const StationFilter: React.FC<StationFilterProps> = ({
  stations,
  selectedIds,
  onChange,
  placeholder = '搜索站点...',
  className,
  style,
}) => {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStations.length) {
      onChange([]);
    } else {
      onChange(filteredStations.map((s) => s.id));
    }
  };

  return (
    <div
      className={classNames('water-sdk-station-filter', className)}
      style={{ position: 'relative', ...style }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.sm,
          cursor: 'pointer',
          minHeight: '36px',
        }}
      >
        <span style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
          {selectedIds.length > 0 ? `已选 ${selectedIds.length} 个站点` : placeholder}
        </span>
        <span style={{ color: theme.colors.text.secondary }}>▼</span>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: '4px',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: theme.spacing.sm, borderBottom: `1px solid ${theme.colors.border}` }}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                fontSize: '13px',
                backgroundColor: 'transparent',
                color: theme.colors.text.primary,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              padding: theme.spacing.sm,
              borderBottom: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              fontSize: '13px',
              color: theme.colors.text.secondary,
            }}
            onClick={handleSelectAll}
          >
            <input
              type="checkbox"
              checked={selectedIds.length === filteredStations.length && filteredStations.length > 0}
              readOnly
              style={{ marginRight: theme.spacing.sm }}
            />
            全选
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredStations.length === 0 ? (
              <div
                style={{
                  padding: theme.spacing.md,
                  textAlign: 'center',
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                }}
              >
                无匹配站点
              </div>
            ) : (
              filteredStations.map((station) => (
                <div
                  key={station.id}
                  onClick={() => handleToggle(station.id)}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: theme.colors.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(station.id)}
                    readOnly
                  />
                  <span>{station.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
