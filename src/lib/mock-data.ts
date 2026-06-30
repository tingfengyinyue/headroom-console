import type { StatsResponse, StatsHistoryResponse } from "./types";
import type { TransformStat, DisplayRequest, DisplayCacheEntry } from "./adapters";

export const mockHealth = {
  service: "headroom-proxy",
  status: "healthy",
  ready: true,
  version: "0.27.0 (demo)",
};

export const mockStats: StatsResponse = {
  requests: { total: 1842, cached: 312, rate_limited: 3, failed: 7 },
  tokens: { input: 7250000, output: 1180000, saved: 5678900, savings_percent: 78.3 },
  cost: { savings_usd: 142.58, cost_with_headroom_usd: 38.92, compression_savings_usd: 142.58 },
  cache: { entries: 156, total_hits: 312 },
  persistent_savings: {
    lifetime: { requests: 1842, tokens_saved: 5678900, compression_savings_usd: 142.58 },
    recent_history: [],
    projects: {},
  },
  compressions_by_strategy: {},
  tokens_saved_by_strategy: {},
  recent_requests: [],
};

export const mockStatsHistory: StatsHistoryResponse = {
  lifetime: { requests: 1842, tokens_saved: 5678900, compression_savings_usd: 142.58 },
  series: {
    hourly: generateRollups(24, 3600000),
    daily: generateRollups(30, 86400000),
    weekly: generateRollups(12, 604800000),
    monthly: generateRollups(6, 2592000000),
  },
  history: [],
  projects: {
    "finance-server": { requests: 743, tokens_saved: 2340000, compression_savings_usd: 58.5 },
    "bohrium-agents": { requests: 612, tokens_saved: 1890000, compression_savings_usd: 47.25 },
    "sigma-search": { requests: 312, tokens_saved: 948900, compression_savings_usd: 23.72 },
    "agent-platform": { requests: 175, tokens_saved: 500000, compression_savings_usd: 12.5 },
  },
};

export const mockTransformStats: TransformStat[] = [
  { name: "SmartCrusher", invocations: 892, avg_reduction_percent: 82.4, total_tokens_saved: 3200000, avg_latency_ms: 3.2, content_types: { json_array: 650, search_results: 142, text: 100 } },
  { name: "ContentRouter", invocations: 743, avg_reduction_percent: 65.8, total_tokens_saved: 1800000, avg_latency_ms: 2.1, content_types: { code: 280, log: 210, text: 153, html: 60, diff: 40 } },
  { name: "ML Compressor", invocations: 312, avg_reduction_percent: 71.2, total_tokens_saved: 478900, avg_latency_ms: 8.5, content_types: { text: 180, log: 82, code: 50 } },
  { name: "ContextManager", invocations: 156, avg_reduction_percent: 45.3, total_tokens_saved: 200000, avg_latency_ms: 1.8, content_types: { conversation: 156 } },
];

export function generateMockRequests(count: number): DisplayRequest[] {
  const models = ["claude-sonnet-4-20250514", "gpt-4o", "claude-3-haiku", "gpt-4o-mini"];
  const strategies = ["smart_crusher", "content_router", "smart_crusher, content_router", "ml_compressor"];
  const projects = ["finance-server", "bohrium-agents", "sigma-search", "agent-platform"];
  return Array.from({ length: count }, (_, i) => {
    const before = Math.floor(Math.random() * 15000) + 2000;
    const ratio = 0.15 + Math.random() * 0.6;
    const after = Math.floor(before * ratio);
    const ts = new Date(Date.now() - i * 180000);
    return {
      id: `req_${ts.getTime()}_${i}`,
      timestamp: ts.toISOString(),
      model: models[Math.floor(Math.random() * models.length)],
      tokens_before: before,
      tokens_after: after,
      tokens_saved: before - after,
      compression_ratio: ratio,
      latency_ms: Math.floor(Math.random() * 15) + 1,
      project: projects[Math.floor(Math.random() * projects.length)],
      strategies: strategies[Math.floor(Math.random() * strategies.length)],
    };
  });
}

export function generateMockCacheEntries(count: number): DisplayCacheEntry[] {
  const types = ["json_array", "code", "log", "search_results", "text", "diff", "html"];
  return Array.from({ length: count }, () => {
    const orig = Math.floor(Math.random() * 50000) + 1000;
    const comp = Math.floor(orig * (0.1 + Math.random() * 0.4));
    const created = new Date(Date.now() - Math.random() * 300000);
    return {
      hash: Math.random().toString(16).slice(2, 10),
      content_type: types[Math.floor(Math.random() * types.length)],
      original_size: orig,
      compressed_size: comp,
      created_at: created.toISOString(),
      expires_at: new Date(created.getTime() + 300000).toISOString(),
      access_count: Math.floor(Math.random() * 10),
      last_accessed: Math.random() > 0.3 ? new Date(created.getTime() + Math.random() * 200000).toISOString() : undefined,
    };
  });
}

function generateRollups(count: number, intervalMs: number) {
  return Array.from({ length: count }, (_, i) => {
    const ts = new Date(Date.now() - i * intervalMs);
    const tokens = Math.floor(Math.random() * 500000) + 100000;
    return {
      period: ts.toISOString(),
      tokens_saved: tokens,
      savings_usd: tokens * 0.000025,
      requests: Math.floor(Math.random() * 200) + 30,
      avg_compression_ratio: 0.2 + Math.random() * 0.3,
    };
  }).reverse();
}
