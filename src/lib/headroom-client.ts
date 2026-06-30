import type { HealthResponse, StatsResponse, StatsHistoryResponse } from "./types";

export class HeadroomClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl = "http://localhost:8787", timeout = 3000) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeout = timeout;
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async health(): Promise<HealthResponse> {
    return this.fetchJson("/health");
  }

  async stats(): Promise<StatsResponse> {
    return this.fetchJson("/stats");
  }

  async statsHistory(options?: { format?: "json" | "csv"; series?: string; history_mode?: string }): Promise<StatsHistoryResponse> {
    const params = new URLSearchParams();
    if (options?.format) params.set("format", options.format);
    if (options?.series) params.set("series", options.series);
    if (options?.history_mode) params.set("history_mode", options.history_mode);
    const qs = params.toString();
    return this.fetchJson(`/stats-history${qs ? `?${qs}` : ""}`);
  }
}
