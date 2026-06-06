import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Station, WarningLevel, StationType } from '../types';

interface FilterState {
  selectedStationIds: string[];
  selectedTypes: StationType[];
  selectedStatuses: WarningLevel[];
  timeRange: { start: string; end: string } | null;
}

interface DataContextType {
  allStations: Station[];
  allWarnings: { id: string; stationId?: string }[];
  filteredStations: Station[];
  filters: FilterState;
  setSelectedStationIds: (ids: string[]) => void;
  setSelectedTypes: (types: StationType[]) => void;
  setSelectedStatuses: (statuses: WarningLevel[]) => void;
  setTimeRange: (range: { start: string; end: string } | null) => void;
  toggleType: (type: StationType) => void;
  toggleStation: (stationId: string) => void;
  isTypeVisible: (type: StationType) => boolean;
  isStationVisible: (stationId: string) => boolean;
  resetFilters: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{
  children: React.ReactNode;
  stations?: Station[];
  warnings?: { id: string; stationId?: string }[];
}> = ({ children, stations = [], warnings = [] }) => {
  const [filters, setFilters] = useState<FilterState>({
    selectedStationIds: [],
    selectedTypes: [],
    selectedStatuses: [],
    timeRange: null,
  });

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(station.type)) {
        return false;
      }
      if (filters.selectedStationIds.length > 0 && !filters.selectedStationIds.includes(station.id)) {
        return false;
      }
      if (filters.selectedStatuses.length > 0 && station.status && !filters.selectedStatuses.includes(station.status)) {
        return false;
      }
      return true;
    });
  }, [stations, filters]);

  const setSelectedStationIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, selectedStationIds: ids }));
  }, []);

  const setSelectedTypes = useCallback((types: StationType[]) => {
    setFilters((prev) => ({ ...prev, selectedTypes: types }));
  }, []);

  const setSelectedStatuses = useCallback((statuses: WarningLevel[]) => {
    setFilters((prev) => ({ ...prev, selectedStatuses: statuses }));
  }, []);

  const setTimeRange = useCallback((range: { start: string; end: string } | null) => {
    setFilters((prev) => ({ ...prev, timeRange: range }));
  }, []);

  const toggleType = useCallback((type: StationType) => {
    setFilters((prev) => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter((t) => t !== type)
        : [...prev.selectedTypes, type],
    }));
  }, []);

  const toggleStation = useCallback((stationId: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedStationIds: prev.selectedStationIds.includes(stationId)
        ? prev.selectedStationIds.filter((id) => id !== stationId)
        : [...prev.selectedStationIds, stationId],
    }));
  }, []);

  const isTypeVisible = useCallback(
    (type: StationType) => {
      return filters.selectedTypes.length === 0 || filters.selectedTypes.includes(type);
    },
    [filters.selectedTypes]
  );

  const isStationVisible = useCallback(
    (stationId: string) => {
      return filters.selectedStationIds.length === 0 || filters.selectedStationIds.includes(stationId);
    },
    [filters.selectedStationIds]
  );

  const resetFilters = useCallback(() => {
    setFilters({
      selectedStationIds: [],
      selectedTypes: [],
      selectedStatuses: [],
      timeRange: null,
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        allStations: stations,
        allWarnings: warnings,
        filteredStations,
        filters,
        setSelectedStationIds,
        setSelectedTypes,
        setSelectedStatuses,
        setTimeRange,
        toggleType,
        toggleStation,
        isTypeVisible,
        isStationVisible,
        resetFilters,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataFilter = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    return {
      allStations: [],
      allWarnings: [],
      filteredStations: [],
      filters: {
        selectedStationIds: [],
        selectedTypes: [],
        selectedStatuses: [],
        timeRange: null,
      },
      setSelectedStationIds: () => {},
      setSelectedTypes: () => {},
      setSelectedStatuses: () => {},
      setTimeRange: () => {},
      toggleType: () => {},
      toggleStation: () => {},
      isTypeVisible: () => true,
      isStationVisible: () => true,
      resetFilters: () => {},
    };
  }
  return context;
};
