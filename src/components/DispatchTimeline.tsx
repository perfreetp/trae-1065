import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useLinkage } from '../context/LinkageContext';
import { classNames, formatTime } from '../utils';
import { BaseComponentProps } from '../types';
import { Empty } from './common/Empty';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  type: 'dispatch' | 'warning' | 'operation' | 'observation';
  content?: string;
  stationId?: string;
  operator?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DispatchTimelineProps extends BaseComponentProps {
  events: TimelineEvent[];
  title?: string;
  startTime: string;
  endTime: string;
  currentTime?: string;
  autoPlay?: boolean;
  playSpeed?: number;
  showPlayback?: boolean;
  onTimeChange?: (time: string) => void;
  onEventClick?: (event: TimelineEvent) => void;
}

const typeColors: Record<string, string> = {
  dispatch: '#722ed1',
  warning: '#f5222d',
  operation: '#fa8c16',
  observation: '#1890ff',
};

const typeLabels: Record<string, string> = {
  dispatch: '调度',
  warning: '预警',
  operation: '操作',
  observation: '观测',
};

export const DispatchTimeline: React.FC<DispatchTimelineProps> = ({
  events = [],
  title = '调度时间轴',
  startTime,
  endTime,
  currentTime: propCurrentTime,
  autoPlay = false,
  playSpeed = 1,
  showPlayback = true,
  onTimeChange,
  onEventClick,
  className,
  style,
  onClick,
  onReady,
}) => {
  const { theme } = useTheme();
  const { currentTime: linkageTime, setCurrentTime } = useLinkage();
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [internalTime, setInternalTime] = useState<string>(
    propCurrentTime || linkageTime || startTime
  );
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const activeCurrentTime = propCurrentTime || linkageTime || internalTime;

  const timeRange = useMemo(() => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return { start, end, duration: end - start };
  }, [startTime, endTime]);

  const progress = useMemo(() => {
    const current = new Date(activeCurrentTime).getTime();
    if (timeRange.duration === 0) return 0;
    return Math.min(100, Math.max(0, ((current - timeRange.start) / timeRange.duration) * 100));
  }, [activeCurrentTime, timeRange]);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [events]);

  const handleTimeUpdate = useCallback(
    (time: string) => {
      setInternalTime(time);
      setCurrentTime(time);
      onTimeChange?.(time);
    },
    [setCurrentTime, onTimeChange]
  );

  useEffect(() => {
    if (isPlaying && showPlayback) {
      playIntervalRef.current = setInterval(() => {
        const current = new Date(activeCurrentTime).getTime();
        const next = current + 60000 * playSpeed;
        if (next >= timeRange.end) {
          setIsPlaying(false);
          handleTimeUpdate(endTime);
        } else {
          handleTimeUpdate(new Date(next).toISOString());
        }
      }, 1000);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, activeCurrentTime, timeRange, playSpeed, endTime, showPlayback, handleTimeUpdate]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const time = timeRange.start + (timeRange.duration * percent) / 100;
    handleTimeUpdate(new Date(time).toISOString());
  };

  const handleEventClick = (event: TimelineEvent) => {
    handleTimeUpdate(event.time);
    onEventClick?.(event);
    onClick?.(event);
  };

  if (!startTime || !endTime) {
    return (
      <div
        className={classNames('water-sdk-dispatch-timeline', className)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          ...style,
        }}
      >
        <Empty text="请设置时间范围" />
      </div>
    );
  }

  return (
    <div
      className={classNames('water-sdk-dispatch-timeline', className)}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        padding: theme.spacing.md,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>
          {title}
        </h4>
        <span style={{ fontSize: '12px', color: theme.colors.primary, fontWeight: 500 }}>
          {formatTime(activeCurrentTime)}
        </span>
      </div>

      {showPlayback && (
        <div style={{ marginBottom: theme.spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                padding: '6px 12px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.primary,
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                minWidth: '60px',
              }}
            >
              {isPlaying ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <button
              onClick={() => handleTimeUpdate(startTime)}
              style={{
                padding: '6px 10px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text.primary,
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ⏮ 重置
            </button>
            <span style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
              速度: {playSpeed}x
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: theme.colors.text.secondary }}>
              {formatTime(startTime, 'MM-DD HH:mm')}
            </span>
          </div>

          <div style={{ position: 'relative', padding: '0 4px' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSliderChange}
              style={{
                width: '100%',
                height: '6px',
                appearance: 'none',
                WebkitAppearance: 'none',
                borderRadius: '3px',
                background: `linear-gradient(to right, ${theme.colors.primary} 0%, ${theme.colors.primary} ${progress}%, ${theme.colors.border} ${progress}%, ${theme.colors.border} 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: ${theme.colors.primary};
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            `}</style>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: theme.colors.text.secondary }}>
              {formatTime(startTime, 'MM-DD HH:mm')}
            </span>
            <span style={{ fontSize: '10px', color: theme.colors.text.secondary }}>
              {formatTime(endTime, 'MM-DD HH:mm')}
            </span>
          </div>
        </div>
      )}

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {sortedEvents.length === 0 ? (
          <Empty text="暂无调度事件" />
        ) : (
          <div style={{ position: 'relative', paddingLeft: '20px' }}>
            <div
              style={{
                position: 'absolute',
                left: '8px',
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: theme.colors.border,
              }}
            />
            {sortedEvents.map((event) => {
              const eventTime = new Date(event.time).getTime();
              const currentTimeMs = new Date(activeCurrentTime).getTime();
              const isPast = eventTime <= currentTimeMs;
              const isCurrent = Math.abs(eventTime - currentTimeMs) < 60000;

              return (
                <div
                  key={event.id}
                  className={classNames(
                    'water-sdk-timeline-event',
                    isCurrent && 'water-sdk-timeline-event--current'
                  )}
                  onClick={() => handleEventClick(event)}
                  style={{
                    position: 'relative',
                    padding: `${theme.spacing.sm} 0 ${theme.spacing.sm} ${theme.spacing.md}`,
                    cursor: 'pointer',
                    opacity: isPast ? 1 : 0.5,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-16px',
                      top: '14px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: typeColors[event.type] || theme.colors.primary,
                      border: isCurrent ? `3px solid ${theme.colors.primary}` : '2px solid #fff',
                      boxShadow: isCurrent ? `0 0 0 4px ${theme.colors.primary}30` : 'none',
                      zIndex: 1,
                    }}
                  />
                  <div
                    style={{
                      backgroundColor: isCurrent ? `${theme.colors.primary}10` : 'transparent',
                      padding: theme.spacing.sm,
                      borderRadius: theme.radius.sm,
                      border: `1px solid ${isCurrent ? theme.colors.primary : theme.colors.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginBottom: '4px' }}>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          backgroundColor: `${typeColors[event.type]}20`,
                          color: typeColors[event.type] || theme.colors.primary,
                        }}
                      >
                        {typeLabels[event.type] || event.type}
                      </span>
                      <span style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
                        {formatTime(event.time, 'HH:mm')}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: theme.colors.text.primary }}>
                      {event.title}
                    </div>
                    {event.content && (
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: theme.colors.text.secondary }}>
                        {event.content}
                      </p>
                    )}
                    {event.operator && (
                      <span style={{ fontSize: '10px', color: theme.colors.text.secondary }}>
                        操作人：{event.operator}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
