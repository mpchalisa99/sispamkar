/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TNI_AU_BASES } from './data/tniAuBases';
import { BaseThreatSummary, DataSourceProvider, FilterConfig, FireHotspot, LanudBase } from './types';
import {
  DEFAULT_NASA_MAP_KEY,
  fetchLiveFirmsData,
  SatelliteSensor,
} from './services/firmsApi';
import {
  fetchLiveGfwFireAlerts,
  getReferenceGfwHotspots,
} from './services/gfwApi';
import { evaluateBaseThreats } from './utils/geoMath';
import { alarmAudio } from './utils/audioAlarm';
import { TopBar } from './components/TopBar';
import { AlarmHUD } from './components/AlarmHUD';
import { FilterToolbar } from './components/FilterToolbar';
import { TacticalMap, DEFAULT_CARTO_API_KEY } from './components/TacticalMap';
import { LightweightTacticalMap } from './components/LightweightTacticalMap';
import { BaseThreatDetailModal } from './components/BaseThreatDetailModal';
import { SitrepReportModal } from './components/SitrepReportModal';
import { MapKeySettingsModal } from './components/MapKeySettingsModal';
import { ThreatsListView } from './components/ThreatsListView';
import { AirbasesDirectory } from './components/AirbasesDirectory';
import { AlertCircle, RefreshCw, Flame, Sparkles } from 'lucide-react';

/**
 * Combines hotspots from NASA FIRMS and Global Forest Watch
 * Deduplicates by spatial proximity (~1.5 km) and preserves GFW peatland flags
 */
function mergeAndDeduplicateHotspots(firmsList: FireHotspot[], gfwList: FireHotspot[]): FireHotspot[] {
  const result: FireHotspot[] = gfwList.map((g) => ({ ...g }));

  for (const f of firmsList) {
    const existing = result.find(
      (g) => Math.abs(g.latitude - f.latitude) < 0.015 && Math.abs(g.longitude - f.longitude) < 0.015
    );
    if (!existing) {
      result.push({ ...f, source: 'FIRMS' });
    } else {
      if (f.frp > existing.frp) {
        existing.frp = f.frp;
      }
      existing.source = 'COMBINED';
    }
  }

  return result;
}

export default function App() {
  // Application State
  const [mapKey, setMapKey] = useState<string>(() => {
    return localStorage.getItem('tni_au_firms_map_key') || DEFAULT_NASA_MAP_KEY;
  });

  const [cartoApiKey, setCartoApiKey] = useState<string>(() => {
    return localStorage.getItem('tni_au_carto_api_key') || DEFAULT_CARTO_API_KEY;
  });

  const [gfwApiKey, setGfwApiKey] = useState<string>(() => {
    return localStorage.getItem('tni_au_gfw_api_key') || '';
  });

  const [dataSource, setDataSource] = useState<DataSourceProvider>(() => {
    const saved = localStorage.getItem('tni_au_data_source');
    return saved === 'FIRMS' || saved === 'GFW' || saved === 'COMBINED' ? saved : 'COMBINED';
  });

  const [peatlandOnly, setPeatlandOnly] = useState<boolean>(false);

  const [dangerRadiusKm, setDangerRadiusKm] = useState<number>(5);
  const [warningRadiusKm, setWarningRadiusKm] = useState<number>(15);
  const [advisoryRadiusKm, setAdvisoryRadiusKm] = useState<number>(30);

  const [satelliteSource, setSatelliteSource] = useState<SatelliteSensor>('VIIRS_SNPP_NRT');
  const [alarmAudioEnabled, setAlarmAudioEnabled] = useState<boolean>(true);
  const [mapMode, setMapMode] = useState<'lightweight' | 'carto' | 'satellite'>('lightweight');

  // Filter States
  const [selectedKoopsud, setSelectedKoopsud] = useState<FilterConfig['koopsud']>('ALL');
  const [selectedBaseType, setSelectedBaseType] = useState<FilterConfig['baseType']>('ALL');
  const [selectedThreatLevel, setSelectedThreatLevel] = useState<FilterConfig['threatLevel']>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'map' | 'bases' | 'threats'>('map');

  // Modals & Selections
  const [selectedBase, setSelectedBase] = useState<LanudBase | null>(null);
  const [selectedDetailSummary, setSelectedDetailSummary] = useState<BaseThreatSummary | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Data Loading
  const [rawHotspots, setRawHotspots] = useState<FireHotspot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  // Fetch Fire Data (supporting FIRMS, GFW, and COMBINED)
  const loadFireData = useCallback(
    async (force: boolean = false) => {
      setIsLoading(true);
      setFetchError(null);
      setInfoNotice(null);

      try {
        if (dataSource === 'FIRMS') {
          const result = await fetchLiveFirmsData(mapKey, satelliteSource, 1, force);
          setRawHotspots(result.data.map((h) => ({ ...h, source: 'FIRMS' })));
          setIsCached(result.isCached);
          setLastFetchedAt(result.fetchedAt);
        } else if (dataSource === 'GFW') {
          const gfwResult = await fetchLiveGfwFireAlerts(gfwApiKey, 2000, force);
          setRawHotspots(gfwResult.data);
          setIsCached(gfwResult.isCached);
          setLastFetchedAt(gfwResult.fetchedAt);
          if (gfwResult.error) {
            setInfoNotice(gfwResult.error);
          }
        } else {
          // COMBINED (Multi-Sensor: FIRMS + GFW)
          const [firmsRes, gfwRes] = await Promise.allSettled([
            fetchLiveFirmsData(mapKey, satelliteSource, 1, force),
            fetchLiveGfwFireAlerts(gfwApiKey, 2000, force),
          ]);

          let firmsList: FireHotspot[] = [];
          let gfwList: FireHotspot[] = [];
          let cached = false;
          let latestTime = new Date();

          if (firmsRes.status === 'fulfilled') {
            firmsList = firmsRes.value.data.map((h) => ({ ...h, source: 'FIRMS' as const }));
            cached = firmsRes.value.isCached;
            latestTime = firmsRes.value.fetchedAt;
          } else {
            console.warn('FIRMS fetch failed in combined mode:', firmsRes.reason);
          }

          if (gfwRes.status === 'fulfilled') {
            gfwList = gfwRes.value.data;
            if (gfwRes.value.error) {
              setInfoNotice(gfwRes.value.error);
            }
          } else {
            console.warn('GFW fetch failed in combined mode, using reference:', gfwRes.reason);
            gfwList = getReferenceGfwHotspots();
          }

          const combined = mergeAndDeduplicateHotspots(firmsList, gfwList);
          setRawHotspots(combined);
          setIsCached(cached);
          setLastFetchedAt(latestTime);
        }
      } catch (err: unknown) {
        console.error('Failed to load fire data:', err);
        const errMsg = err instanceof Error ? err.message : 'Gagal terhubung ke API titik api';
        setFetchError(errMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [dataSource, mapKey, satelliteSource, gfwApiKey]
  );

  // Initial Load & re-fetch when parameters change
  useEffect(() => {
    loadFireData(false);
  }, [loadFireData]);

  // Active Hotspots with Peatland filter
  const activeHotspots = useMemo(() => {
    if (!peatlandOnly) return rawHotspots;
    return rawHotspots.filter((h) => h.isPeatland);
  }, [rawHotspots, peatlandOnly]);

  const peatlandCount = useMemo(() => {
    return rawHotspots.filter((h) => h.isPeatland).length;
  }, [rawHotspots]);

  // Evaluate Threat Summaries for all TNI AU bases
  const allThreatSummaries = useMemo(() => {
    return evaluateBaseThreats(
      TNI_AU_BASES,
      activeHotspots,
      dangerRadiusKm,
      warningRadiusKm,
      advisoryRadiusKm
    );
  }, [activeHotspots, dangerRadiusKm, warningRadiusKm, advisoryRadiusKm]);

  // Filtered Bases
  const filteredBases = useMemo(() => {
    return TNI_AU_BASES.filter((b) => {
      if (selectedKoopsud !== 'ALL' && b.koopsud !== selectedKoopsud) return false;
      if (selectedBaseType !== 'ALL' && b.type !== selectedBaseType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.province.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [selectedKoopsud, selectedBaseType, searchQuery]);

  // Filtered Threat Summaries (incorporates threat level filter)
  const filteredThreatSummaries = useMemo(() => {
    const summaryMap = new Map<string, BaseThreatSummary>();
    allThreatSummaries.forEach((s) => summaryMap.set(s.base.id, s));

    return filteredBases
      .map((b) => summaryMap.get(b.id)!)
      .filter((s) => {
        if (!s) return false;
        if (selectedThreatLevel !== 'ALL' && s.threatLevel !== selectedThreatLevel) {
          return false;
        }
        return true;
      });
  }, [allThreatSummaries, filteredBases, selectedThreatLevel]);

  // Critical & Warning base lists for Alarms
  const criticalSummaries = useMemo(() => {
    return allThreatSummaries.filter((s) => s.threatLevel === 'CRITICAL');
  }, [allThreatSummaries]);

  const warningSummaries = useMemo(() => {
    return allThreatSummaries.filter((s) => s.threatLevel === 'WARNING');
  }, [allThreatSummaries]);

  // Audio Siren Management
  useEffect(() => {
    if (criticalSummaries.length > 0 && alarmAudioEnabled) {
      alarmAudio.setMuted(false);
      alarmAudio.startAlarm();
    } else {
      alarmAudio.stopAlarm();
    }

    return () => {
      alarmAudio.stopAlarm();
    };
  }, [criticalSummaries.length, alarmAudioEnabled]);

  const handleToggleMute = () => {
    const nextMuted = alarmAudioEnabled;
    setAlarmAudioEnabled(!nextMuted);
    alarmAudio.setMuted(nextMuted);
  };

  const handleTestAlarm = () => {
    alarmAudio.playAlarmTest(2000);
  };

  const handleSelectBaseFromAnywhere = (base: LanudBase) => {
    setSelectedBase(base);
    setActiveView('map');
  };

  const handleOpenDetailModal = (summary: BaseThreatSummary) => {
    setSelectedDetailSummary(summary);
  };

  const handleSaveMapKey = (newKey: string) => {
    setMapKey(newKey);
    localStorage.setItem('tni_au_firms_map_key', newKey);
  };

  const handleSaveCartoKey = (newKey: string) => {
    setCartoApiKey(newKey);
    localStorage.setItem('tni_au_carto_api_key', newKey);
  };

  const handleSaveGfwKey = (newKey: string) => {
    setGfwApiKey(newKey);
    localStorage.setItem('tni_au_gfw_api_key', newKey);
  };

  const handleChangeDataSource = (newSource: DataSourceProvider) => {
    setDataSource(newSource);
    localStorage.setItem('tni_au_data_source', newSource);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Bar Header */}
      <TopBar
        onRefreshData={() => loadFireData(true)}
        isLoading={isLoading}
        isCached={isCached}
        lastFetchedAt={lastFetchedAt}
        totalHotspots={activeHotspots.length}
        peatlandCount={peatlandCount}
        dataSource={dataSource}
        criticalBasesCount={criticalSummaries.length}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        activeView={activeView}
        onChangeView={setActiveView}
      />

      {/* Alarm Tactical HUD Banner */}
      <AlarmHUD
        criticalSummaries={criticalSummaries}
        warningSummaries={warningSummaries}
        isAlarmPlaying={alarmAudio.getIsPlaying()}
        isMuted={!alarmAudioEnabled}
        onToggleMute={handleToggleMute}
        onTestAlarm={handleTestAlarm}
        onSelectBase={handleSelectBaseFromAnywhere}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Filter Toolbar */}
      <FilterToolbar
        selectedKoopsud={selectedKoopsud}
        onChangeKoopsud={setSelectedKoopsud}
        selectedBaseType={selectedBaseType}
        onChangeBaseType={setSelectedBaseType}
        selectedThreatLevel={selectedThreatLevel}
        onChangeThreatLevel={setSelectedThreatLevel}
        satelliteSource={satelliteSource}
        onChangeSatelliteSource={setSatelliteSource}
        dataSource={dataSource}
        onChangeDataSource={handleChangeDataSource}
        peatlandOnly={peatlandOnly}
        onTogglePeatlandOnly={() => setPeatlandOnly(!peatlandOnly)}
        peatlandCount={peatlandCount}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        dangerRadiusKm={dangerRadiusKm}
        onChangeDangerRadius={setDangerRadiusKm}
        mapMode={mapMode}
        onChangeMapMode={setMapMode}
        alarmAudioEnabled={alarmAudioEnabled}
        onToggleAlarmAudio={handleToggleMute}
      />

      {/* Notice / GFW Info Banner */}
      {infoNotice && (
        <div className="bg-emerald-950/80 border-b border-emerald-800 px-6 py-2 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Global Forest Watch:</strong> {infoNotice}
            </span>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="text-white bg-emerald-800 hover:bg-emerald-700 px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer shrink-0"
          >
            Atur Key GFW
          </button>
        </div>
      )}

      {/* API Error Notification if any */}
      {fetchError && (
        <div className="bg-red-950/90 border-b border-red-700 px-6 py-2 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Kendala API Satelit: <strong>{fetchError}</strong>. Menampilkan data lokal cadangan.
            </span>
          </div>
          <button
            onClick={() => loadFireData(true)}
            className="text-white bg-red-800 hover:bg-red-700 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 relative w-full h-full min-h-0 overflow-hidden bg-slate-950">
        {activeView === 'map' && (
          mapMode === 'lightweight' ? (
            <LightweightTacticalMap
              bases={filteredBases}
              threatSummaries={allThreatSummaries}
              hotspots={activeHotspots}
              selectedBase={selectedBase}
              onSelectBase={(base) => {
                setSelectedBase(base);
                if (base) {
                  const s = allThreatSummaries.find((summary) => summary.base.id === base.id);
                  if (s) setSelectedDetailSummary(s);
                }
              }}
              dangerRadiusKm={dangerRadiusKm}
              warningRadiusKm={warningRadiusKm}
              advisoryRadiusKm={advisoryRadiusKm}
            />
          ) : (
            <TacticalMap
              bases={filteredBases}
              threatSummaries={allThreatSummaries}
              hotspots={activeHotspots}
              selectedBase={selectedBase}
              onSelectBase={(base) => {
                setSelectedBase(base);
                if (base) {
                  const s = allThreatSummaries.find((summary) => summary.base.id === base.id);
                  if (s) setSelectedDetailSummary(s);
                }
              }}
              dangerRadiusKm={dangerRadiusKm}
              warningRadiusKm={warningRadiusKm}
              advisoryRadiusKm={advisoryRadiusKm}
              mapStyle={mapMode === 'satellite' ? 'satellite' : 'dark'}
              cartoApiKey={cartoApiKey}
            />
          )
        )}

        {activeView === 'threats' && (
          <div className="h-full overflow-y-auto">
            <ThreatsListView
              threatSummaries={filteredThreatSummaries}
              onSelectBase={handleSelectBaseFromAnywhere}
              onOpenDetailModal={handleOpenDetailModal}
            />
          </div>
        )}

        {activeView === 'bases' && (
          <div className="h-full overflow-y-auto">
            <AirbasesDirectory
              bases={filteredBases}
              threatSummaries={allThreatSummaries}
              onSelectBase={handleSelectBaseFromAnywhere}
              onOpenDetailModal={handleOpenDetailModal}
            />
          </div>
        )}
      </main>

      {/* Base Threat & SOP Detail Modal */}
      {selectedDetailSummary && (
        <BaseThreatDetailModal
          summary={selectedDetailSummary}
          onClose={() => setSelectedDetailSummary(null)}
          dangerRadiusKm={dangerRadiusKm}
        />
      )}

      {/* SITREP Military Report Modal */}
      {isReportModalOpen && (
        <SitrepReportModal
          threatSummaries={allThreatSummaries}
          onClose={() => setIsReportModalOpen(false)}
          totalHotspots={activeHotspots.length}
          lastFetchedAt={lastFetchedAt}
          satelliteSource={satelliteSource}
          dangerRadiusKm={dangerRadiusKm}
          warningRadiusKm={warningRadiusKm}
        />
      )}

      {/* Map Key & Radius Settings Modal */}
      {isSettingsModalOpen && (
        <MapKeySettingsModal
          currentMapKey={mapKey}
          onSaveMapKey={handleSaveMapKey}
          currentCartoKey={cartoApiKey}
          onSaveCartoKey={handleSaveCartoKey}
          currentGfwKey={gfwApiKey}
          onSaveGfwKey={handleSaveGfwKey}
          dangerRadiusKm={dangerRadiusKm}
          onSaveDangerRadius={setDangerRadiusKm}
          warningRadiusKm={warningRadiusKm}
          onSaveWarningRadius={setWarningRadiusKm}
          advisoryRadiusKm={advisoryRadiusKm}
          onSaveAdvisoryRadius={setAdvisoryRadiusKm}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
}
