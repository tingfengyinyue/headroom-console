"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  HealthResponse,
  StatsResponse,
  StatsHistoryResponse,
} from "@/lib/types";
import {
  mockStats,
  mockStatsHistory,
  mockHealth,
  mockTransformStats,
  generateMockRequests,
  generateMockCacheEntries,
} from "@/lib/mock-data";
import type { DisplayData, TransformStat, DisplayRequest, DisplayCacheEntry, CacheChartData } from "@/lib/adapters";
import { adaptStats, adaptHistory, adaptRequests, adaptCacheEntries, adaptTransforms, adaptCacheCharts } from "@/lib/adapters";

type DataMode = "live" | "demo";

export interface UseHeadroomReturn {
  mode: DataMode;
  connected: boolean;
  liveHasData: boolean;
  showingDemo: boolean;
  toggleDemo: () => void;
  health: HealthResponse | null;
  data: DisplayData;
  requests: DisplayRequest[];
  cacheEntries: DisplayCacheEntry[];
  transformStats: TransformStat[];
  cacheCharts: CacheChartData | null;
  rawStats: StatsResponse | null;
  rawHistory: StatsHistoryResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setProxyUrl: (url: string) => void;
  proxyUrl: string;
}

function isHeadroomHealth(data: unknown): data is HealthResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.status === "string" && ("ready" in obj || "optimize" in obj || "service" in obj);
}

function isHeadroomStats(data: unknown): data is StatsResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return "tokens" in obj || "requests" in obj || "summary" in obj || "persistent_savings" in obj;
}

const defaultData: DisplayData = {
  tokensSaved: 0, savingsPercent: 0, totalRequests: 0, cachedRequests: 0,
  failedRequests: 0, rateLimitedRequests: 0, costSavedUsd: 0, totalCostUsd: 0,
  cacheEntries: 0, cacheHits: 0, lifetimeTokensSaved: 0, lifetimeSavingsUsd: 0,
  projects: [], dailyRollups: [], weeklyRollups: [], monthlyRollups: [],
};

function mergeDisplay(...partials: Partial<DisplayData>[]): DisplayData {
  const result = { ...defaultData };
  for (const p of partials) Object.assign(result, p);
  return result;
}

const demoData = mergeDisplay(adaptStats(mockStats), adaptHistory(mockStatsHistory));
const demoRequests = generateMockRequests(50);
const demoCacheEntries = generateMockCacheEntries(30);

export function useHeadroom(): UseHeadroomReturn {
  const [mode, setMode] = useState<DataMode>("demo");
  const [connected, setConnected] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(mockHealth as unknown as HealthResponse);

  const [liveData, setLiveData] = useState<DisplayData>(defaultData);
  const [liveRequests, setLiveRequests] = useState<DisplayRequest[]>([]);
  const [liveCacheEntries, setLiveCacheEntries] = useState<DisplayCacheEntry[]>([]);
  const [liveTransformStats, setLiveTransformStats] = useState<TransformStat[]>([]);
  const [liveCacheCharts, setLiveCacheCharts] = useState<CacheChartData | null>(null);

  const [rawStats, setRawStats] = useState<StatsResponse | null>(null);
  const [rawHistory, setRawHistory] = useState<StatsHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proxyUrl, setProxyUrlState] = useState(
    process.env.NEXT_PUBLIC_HEADROOM_URL || "http://localhost:8787"
  );
  const [userWantsLive, setUserWantsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const liveHasData = liveData.totalRequests > 0 || liveData.lifetimeTokensSaved > 0;

  // Not connected → demo; Connected + live data → live; Connected + no data → demo unless user toggles
  const isShowingDemo = !connected || (!liveHasData && !userWantsLive);

  const data = isShowingDemo ? demoData : liveData;
  const requests = isShowingDemo ? demoRequests : liveRequests;
  const cacheEntries = isShowingDemo ? demoCacheEntries : liveCacheEntries;
  const transformStats = isShowingDemo ? mockTransformStats : liveTransformStats;
  const cacheCharts = isShowingDemo ? null : liveCacheCharts;

  const toggleDemo = useCallback(() => {
    if (!connected) return;
    setUserWantsLive((v) => !v);
  }, [connected]);

  const fetchJson = useCallback(
    async (path: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`${proxyUrl}${path}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`${res.status}`);
        return await res.json();
      } finally {
        clearTimeout(timeout);
      }
    },
    [proxyUrl]
  );

  const tryLiveConnect = useCallback(async (): Promise<boolean> => {
    try {
      const h = await fetchJson("/health");
      if (!isHeadroomHealth(h)) return false;

      const [s, hist] = await Promise.all([
        fetchJson("/stats"),
        fetchJson("/stats-history"),
      ]);
      if (!isHeadroomStats(s)) return false;

      setHealth(h);
      setRawStats(s);
      setRawHistory(hist);
      setLiveData(mergeDisplay(adaptStats(s), adaptHistory(hist)));

      const lr = adaptRequests(s);
      if (lr.length > 0) setLiveRequests(lr);

      const lc = adaptCacheEntries(s);
      if (lc.length > 0) setLiveCacheEntries(lc);

      const lt = adaptTransforms(s);
      if (lt.length > 0) setLiveTransformStats(lt);

      setLiveCacheCharts(adaptCacheCharts(s));

      setConnected(true);
      setMode("live");
      setError(null);
      return true;
    } catch {
      return false;
    }
  }, [fetchJson]);

  const loadDemoFallback = useCallback(() => {
    setHealth(mockHealth as unknown as HealthResponse);
    setRawStats(null);
    setRawHistory(null);
    setConnected(false);
    setMode("demo");
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const isLive = await tryLiveConnect();
    if (!isLive) loadDemoFallback();
    setLoading(false);
  }, [tryLiveConnect, loadDemoFallback]);

  const setProxyUrl = useCallback((url: string) => {
    setProxyUrlState(url);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const isLive = await tryLiveConnect();
      if (cancelled) return;
      if (!isLive) loadDemoFallback();
      setLoading(false);
    };
    run();

    intervalRef.current = setInterval(async () => {
      if (cancelled) return;
      await tryLiveConnect();
    }, 5000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [proxyUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    mode, connected, liveHasData,
    showingDemo: isShowingDemo, toggleDemo,
    health, data, requests, cacheEntries, transformStats, cacheCharts,
    rawStats, rawHistory, loading, error, refresh, setProxyUrl, proxyUrl,
  };
}
