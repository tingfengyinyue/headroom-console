// ===== /health =====
export interface HealthResponse {
  service?: string;
  status: string;
  ready?: boolean;
  version?: string;
  timestamp?: string;
  uptime_seconds?: number;
  checks?: Record<string, HealthCheck>;
  config?: {
    backend?: string;
    optimize?: boolean;
    cache?: boolean;
    rate_limit?: boolean;
    [key: string]: unknown;
  };
  runtime?: Record<string, unknown>;
  rust_core?: string;
}

export interface HealthCheck {
  enabled: boolean;
  ready: boolean;
  status: string;
  error?: string | null;
}

// ===== /stats =====
export interface StatsResponse {
  summary?: {
    mode?: string;
    api_requests?: number;
    primary_model?: string;
    compression?: {
      requests_compressed?: number;
      avg_compression_pct?: number;
      best_compression_pct?: number;
      total_tokens_removed?: number;
      [key: string]: unknown;
    };
    cost?: {
      without_headroom_usd?: number;
      with_headroom_usd?: number;
      total_saved_usd?: number;
      savings_pct?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  requests?: {
    total?: number;
    cached?: number;
    rate_limited?: number;
    failed?: number;
    by_provider?: Record<string, unknown>;
    by_model?: Record<string, unknown>;
    [key: string]: unknown;
  };
  tokens?: {
    input?: number;
    output?: number;
    saved?: number;
    savings_percent?: number;
    proxy_compression_saved?: number;
    cli_filtering_saved?: number;
    all_layers_saved?: number;
    all_layers_savings_percent?: number;
    [key: string]: unknown;
  };
  cost?: {
    total_tokens_saved?: number;
    total_input_tokens?: number;
    total_input_cost_usd?: number;
    cost_with_headroom_usd?: number;
    savings_usd?: number;
    compression_savings_usd?: number;
    cache_savings_usd?: number;
    per_model?: Record<string, unknown>;
    [key: string]: unknown;
  };
  cache?: {
    entries?: number;
    max_entries?: number;
    total_hits?: number;
    ttl_seconds?: number;
  };
  persistent_savings?: {
    schema_version?: number;
    storage_path?: string;
    lifetime?: {
      requests?: number;
      tokens_saved?: number;
      compression_savings_usd?: number;
      total_input_tokens?: number;
      total_input_cost_usd?: number;
    };
    display_session?: {
      requests?: number;
      tokens_saved?: number;
      compression_savings_usd?: number;
      savings_percent?: number;
      started_at?: string | null;
      last_activity_at?: string | null;
      [key: string]: unknown;
    };
    recent_history?: Array<{
      timestamp: string;
      total_tokens_saved: number;
      compression_savings_usd: number;
    }>;
    projects?: Record<string, ProjectSavings>;
    [key: string]: unknown;
  };
  compression_cache?: {
    mode?: string;
    enabled?: boolean;
    total_compressions?: number;
    total_retrievals?: number;
    avg_compression_ratio?: number;
    [key: string]: unknown;
  };
  compressions_by_strategy?: Record<string, number>;
  tokens_saved_by_strategy?: Record<string, number>;
  recent_requests?: Array<RecentRequest>;
  agent_usage?: {
    agents?: Array<{
      agent?: string;
      requests?: number;
      before_tokens?: number;
      after_tokens?: number;
      output_tokens?: number;
      tokens_saved?: number;
      savings_percent?: number;
    }>;
    totals?: {
      requests?: number;
      before_tokens?: number;
      after_tokens?: number;
      tokens_saved?: number;
      savings_percent?: number;
    };
    [key: string]: unknown;
  };
  savings?: {
    total_tokens?: number;
    per_project?: Record<string, unknown>;
    by_layer?: Record<string, unknown>;
    [key: string]: unknown;
  };
  latency?: Record<string, unknown>;
  prefix_cache?: Record<string, unknown>;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RecentRequest {
  id?: string;
  timestamp?: string;
  model?: string;
  tokens_before?: number;
  tokens_after?: number;
  tokens_saved?: number;
  compression_ratio?: number;
  strategies?: string[];
  latency_ms?: number;
  project?: string;
  [key: string]: unknown;
}

export interface ProjectSavings {
  requests?: number;
  tokens_saved?: number;
  compression_savings_usd?: number;
  total_input_tokens?: number;
  total_input_cost_usd?: number;
  [key: string]: unknown;
}

// ===== /stats-history =====
export interface StatsHistoryResponse {
  schema_version?: number;
  generated_at?: string;
  storage_path?: string;
  lifetime?: {
    requests?: number;
    tokens_saved?: number;
    compression_savings_usd?: number;
    total_input_tokens?: number;
    total_input_cost_usd?: number;
  };
  display_session?: {
    requests?: number;
    tokens_saved?: number;
    compression_savings_usd?: number;
    savings_percent?: number;
    started_at?: string | null;
    last_activity_at?: string | null;
    [key: string]: unknown;
  };
  history?: Array<{
    timestamp: string;
    total_tokens_saved?: number;
    compression_savings_usd?: number;
    requests?: number;
  }>;
  series?: {
    hourly?: RollupEntry[];
    daily?: RollupEntry[];
    weekly?: RollupEntry[];
    monthly?: RollupEntry[];
  };
  exports?: {
    default_format?: string;
    available_formats?: string[];
    available_series?: string[];
  };
  projects?: Record<string, ProjectSavings>;
  history_summary?: {
    mode?: string;
    stored_points?: number;
    returned_points?: number;
    compacted?: boolean;
  };
  [key: string]: unknown;
}

export interface RollupEntry {
  period?: string;
  tokens_saved?: number;
  savings_usd?: number;
  compression_savings_usd?: number;
  requests?: number;
  avg_compression_ratio?: number;
  [key: string]: unknown;
}

// ===== Display types =====
export interface ConnectionConfig {
  proxyUrl: string;
  pollingInterval: number;
}

export type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d" | "all";
