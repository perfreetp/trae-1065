import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

interface LinkageContextType {
  selectedStationId: string | null;
  selectedTimeRange: { start: string; end: string } | null;
  currentTime: string | null;
  highlightedWarningId: string | null;
  focusedStationId: string | null;
  setSelectedStationId: (id: string | null) => void;
  setSelectedTimeRange: (range: { start: string; end: string } | null) => void;
  setCurrentTime: (time: string | null) => void;
  setHighlightedWarningId: (id: string | null) => void;
  setFocusedStationId: (id: string | null) => void;
  focusStationByWarning: (stationId: string, warningTime: string) => void;
  subscribe: (callback: () => void) => () => void;
}

const LinkageContext = createContext<LinkageContextType | undefined>(undefined);

export const LinkageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: string; end: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [highlightedWarningId, setHighlightedWarningId] = useState<string | null>(null);
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);
  const [listeners, setListeners] = useState<(() => void)[]>([]);

  const notifyListeners = useCallback(() => {
    listeners.forEach((cb) => cb());
  }, [listeners]);

  const handleSetSelectedStationId = useCallback(
    (id: string | null) => {
      setSelectedStationId(id);
      setFocusedStationId(id);
      notifyListeners();
    },
    [notifyListeners]
  );

  const handleSetSelectedTimeRange = useCallback(
    (range: { start: string; end: string } | null) => {
      setSelectedTimeRange(range);
      notifyListeners();
    },
    [notifyListeners]
  );

  const handleSetCurrentTime = useCallback(
    (time: string | null) => {
      setCurrentTime(time);
      notifyListeners();
    },
    [notifyListeners]
  );

  const handleSetHighlightedWarningId = useCallback(
    (id: string | null) => {
      setHighlightedWarningId(id);
      notifyListeners();
    },
    [notifyListeners]
  );

  const handleSetFocusedStationId = useCallback(
    (id: string | null) => {
      setFocusedStationId(id);
      notifyListeners();
    },
    [notifyListeners]
  );

  const focusStationByWarning = useCallback(
    (stationId: string, warningTime: string) => {
      setSelectedStationId(stationId);
      setFocusedStationId(stationId);
      setCurrentTime(warningTime);
      notifyListeners();
    },
    [notifyListeners]
  );

  const subscribe = useCallback((callback: () => void) => {
    setListeners((prev) => [...prev, callback]);
    return () => {
      setListeners((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  return (
    <LinkageContext.Provider
      value={{
        selectedStationId,
        selectedTimeRange,
        currentTime,
        highlightedWarningId,
        focusedStationId,
        setSelectedStationId: handleSetSelectedStationId,
        setSelectedTimeRange: handleSetSelectedTimeRange,
        setCurrentTime: handleSetCurrentTime,
        setHighlightedWarningId: handleSetHighlightedWarningId,
        setFocusedStationId: handleSetFocusedStationId,
        focusStationByWarning,
        subscribe,
      }}
    >
      {children}
    </LinkageContext.Provider>
  );
};

export const useLinkage = (): LinkageContextType => {
  const context = useContext(LinkageContext);
  if (!context) {
    return {
      selectedStationId: null,
      selectedTimeRange: null,
      currentTime: null,
      highlightedWarningId: null,
      focusedStationId: null,
      setSelectedStationId: () => {},
      setSelectedTimeRange: () => {},
      setCurrentTime: () => {},
      setHighlightedWarningId: () => {},
      setFocusedStationId: () => {},
      focusStationByWarning: () => {},
      subscribe: () => () => {},
    };
  }
  return context;
};
