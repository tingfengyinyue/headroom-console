import type { StatsResponse, StatsHistoryResponse } from "./types";

export interface DisplayData {
  tokensSaved: number;
  savingsPercent: number;
  totalRequests: number;
  cachedRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  costSavedUsd: number;
  totalCostUsd: number;
  cacheEntries: number;
  cacheHits: number;
  lifetimeTokensSaved: number;
  lifetimeSavingsUsd: number;
  projects: Array<{ name: string; tokensSaved: number; savingsUsd: number; requests: number }>;
  dailyRollups: Array<{ period: string; tokens_saved: number; savings_usd: number; requests: number; avg_compression_ratio?: number }>;
  weeklyRollups: Array<{ period: string; tokens_saved: number; savings_usd: number; requests: number }>;
  monthlyRollups: Array<{ period: string; tokens_saved: number; savings_usd: number; requests: number }>;
}

export interface TransformStat {
  name: string;
  invocations: number;
  avg_reduction_percent: number;
  total_tokens_saved: number;
  avg_latency_ms: number;
  content_types: Record<string, number>;
}

export interface DisplayRequest {
  id: string;
  timestamp: string;
  model: string;
  tokens_before: number;
  tokens_after: number;
  tokens_saved: number;
  compression_ratio: number;
  latency_ms: number;
  project: string;
  strategies: string;
}

export interface DisplayCacheEntry {
  hash: string;
  content_type: string;
  original_size: number;
  compressed_size: number;
  created_at: string;
  expires_at: string;
  access_count: number;
  last_accessed?: string;
}

export interface CacheChartData {
  compressionCache: {
    totalEntries: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    activeSessions: number;
    tokensSaved: number;
  };
  prefixCache: {
    readTokens: number;
    writeTokens: number;
    hitRate: number;
    requestHitRate: number;
    hitRequests: number;
    bustCount: number;
    bustWriteTokens: number;
    savingsUsd: number;
    netSavingsUsd: number;
    ttlBuckets: Array<{ bucket: string; tokens: number; requests: number }>;
  };
  strategyDistribution: Array<{ name: string; count: number }>;
  tokensByStrategy: Array<{ name: string; tokens: number }>;
  compressionVsCache: {
    savedByCompression: number;
    lostToCacheBust: number;
    netTokens: number;
  };
}

function n(v: unknown, fallback = 0): number {
  const x = Number(v);
  return isFinite(x) ? x : fallback;
}

export function adaptStats(s: StatsResponse): Partial<DisplayData> {
  const costSaved = n(s.summary?.cost?.total_saved_usd) || n(s.cost?.savings_usd) || n(s.cost?.compression_savings_usd);
  const totalCost = n(s.summary?.cost?.without_headroom_usd) || n(s.cost?.cost_with_headroom_usd) + costSaved;

  return {
    tokensSaved: n(s.tokens?.saved),
    savingsPercent: n(s.tokens?.savings_percent),
    totalRequests: n(s.requests?.total),
    cachedRequests: n(s.requests?.cached),
    failedRequests: n(s.requests?.failed),
    rateLimitedRequests: n(s.requests?.rate_limited),
    costSavedUsd: costSaved,
    totalCostUsd: totalCost,
    cacheEntries: n(s.cache?.entries),
    cacheHits: n(s.cache?.total_hits),
    lifetimeTokensSaved: n(s.persistent_savings?.lifetime?.tokens_saved) || n(s.tokens?.saved),
    lifetimeSavingsUsd: n(s.persistent_savings?.lifetime?.compression_savings_usd) || costSaved,
  };
}

export function adaptHistory(h: StatsHistoryResponse): Partial<DisplayData> {
  const mapRollup = (entries: Array<Record<string, unknown>> | undefined) =>
    (entries ?? []).map((e) => ({
      period: String(e.period ?? e.timestamp ?? ""),
      tokens_saved: n(e.tokens_saved),
      savings_usd: n(e.savings_usd ?? e.compression_savings_usd),
      requests: n(e.requests),
      avg_compression_ratio: e.avg_compression_ratio != null ? n(e.avg_compression_ratio) : undefined,
    }));

  const projects = h.projects
    ? Object.entries(h.projects).map(([name, p]) => ({
        name,
        tokensSaved: n(p.tokens_saved),
        savingsUsd: n(p.compression_savings_usd),
        requests: n(p.requests),
      }))
    : [];

  return {
    projects,
    dailyRollups: mapRollup(h.series?.daily as Array<Record<string, unknown>>),
    weeklyRollups: mapRollup(h.series?.weekly as Array<Record<string, unknown>>),
    monthlyRollups: mapRollup(h.series?.monthly as Array<Record<string, unknown>>),
    lifetimeTokensSaved: n(h.lifetime?.tokens_saved),
    lifetimeSavingsUsd: n(h.lifetime?.compression_savings_usd),
  };
}

export function adaptRequests(s: StatsResponse): DisplayRequest[] {
  if (!s.recent_requests || !Array.isArray(s.recent_requests)) return [];
  return s.recent_requests.map((r, i) => ({
    id: String(r.id ?? `req_${i}`),
    timestamp: String(r.timestamp ?? new Date().toISOString()),
    model: String(r.model ?? "unknown"),
    tokens_before: n(r.tokens_before),
    tokens_after: n(r.tokens_after),
    tokens_saved: n(r.tokens_saved),
    compression_ratio: n(r.tokens_before) > 0 ? n(r.tokens_after) / n(r.tokens_before) : 1,
    latency_ms: n(r.latency_ms),
    project: String(r.project ?? ""),
    strategies: Array.isArray(r.strategies) ? r.strategies.join(", ") : String(r.strategies ?? ""),
  }));
}

export function adaptCacheEntries(s: StatsResponse): DisplayCacheEntry[] {
  return [];
}

export function adaptCacheCharts(s: StatsResponse): CacheChartData {
  const cc = s.compression_cache as Record<string, unknown> | undefined;
  const pc = s.prefix_cache as Record<string, unknown> | undefined;
  const totals = (pc?.totals ?? pc?.by_provider ?? {}) as Record<string, unknown>;
  const providerTotals = pc?.totals ? totals : Object.values(totals)[0] as Record<string, unknown> ?? {};

  const ttlBuckets: CacheChartData["prefixCache"]["ttlBuckets"] = [];
  const observed = providerTotals?.observed_ttl_buckets as Record<string, Record<string, unknown>> | undefined;
  if (observed) {
    for (const [bucket, data] of Object.entries(observed)) {
      ttlBuckets.push({ bucket, tokens: n(data?.tokens), requests: n(data?.requests) });
    }
  }

  const cvc = (pc?.compression_vs_cache ?? {}) as Record<string, unknown>;

  const byStrategy = s.compressions_by_strategy ?? {};
  const tokensBySt = s.tokens_saved_by_strategy ?? {};

  return {
    compressionCache: {
      totalEntries: n(cc?.total_entries),
      totalHits: n(cc?.total_hits),
      totalMisses: n(cc?.total_misses),
      hitRate: n(cc?.hit_rate),
      activeSessions: n(cc?.active_sessions),
      tokensSaved: n(cc?.total_tokens_saved),
    },
    prefixCache: {
      readTokens: n(providerTotals?.cache_read_tokens),
      writeTokens: n(providerTotals?.cache_write_tokens),
      hitRate: n(providerTotals?.hit_rate),
      requestHitRate: n(providerTotals?.request_hit_rate),
      hitRequests: n(providerTotals?.hit_requests),
      bustCount: n(providerTotals?.bust_count),
      bustWriteTokens: n(providerTotals?.bust_write_tokens),
      savingsUsd: n(providerTotals?.savings_usd),
      netSavingsUsd: n(providerTotals?.net_savings_usd),
      ttlBuckets,
    },
    strategyDistribution: Object.entries(byStrategy).map(([name, count]) => ({ name, count: n(count) })),
    tokensByStrategy: Object.entries(tokensBySt).map(([name, tokens]) => ({ name, tokens: n(tokens) })),
    compressionVsCache: {
      savedByCompression: n(cvc.tokens_saved_by_compression),
      lostToCacheBust: n(cvc.tokens_lost_to_cache_bust),
      netTokens: n(cvc.net_tokens),
    },
  };
}

export function adaptTransforms(s: StatsResponse): TransformStat[] {
  const byStrategy = s.compressions_by_strategy;
  const tokensByStrategy = s.tokens_saved_by_strategy;
  if (!byStrategy || typeof byStrategy !== "object" || Object.keys(byStrategy).length === 0) return [];

  return Object.entries(byStrategy).map(([name, count]) => ({
    name,
    invocations: n(count),
    avg_reduction_percent: 0,
    total_tokens_saved: n(tokensByStrategy?.[name]),
    avg_latency_ms: 0,
    content_types: {},
  }));
}
