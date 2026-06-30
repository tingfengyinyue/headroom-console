"use client";

import { useHeadroomContext } from "@/components/providers";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, TrendingDown, Zap, Database, BarChart3, Activity } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { format } from "date-fns";
import { formatTokens, formatUSD } from "@/lib/format";

const COLORS = ["hsl(221,83%,53%)", "hsl(160,60%,45%)", "hsl(43,96%,56%)", "hsl(350,89%,60%)", "hsl(280,65%,60%)"];

export default function DashboardPage() {
  const { data, loading, connected, liveHasData, showingDemo } = useHeadroomContext();

  if (loading || !data) return <DashboardSkeleton />;

  const dailyData = (data.dailyRollups ?? []).map((d) => ({
    date: d.period ? format(new Date(d.period), "MM/dd") : "",
    tokens_saved: d.tokens_saved ?? 0,
    savings_usd: d.savings_usd ?? 0,
    compression: d.avg_compression_ratio ? (1 - d.avg_compression_ratio) * 100 : 0,
  }));

  const projectData = data.projects ?? [];

  const breakdown = [
    { name: "Successful", value: data.totalRequests - data.failedRequests - data.cachedRequests },
    { name: "Cached", value: data.cachedRequests },
    { name: "Failed", value: data.failedRequests },
    { name: "Rate Limited", value: data.rateLimitedRequests },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Headroom compression performance overview</p>
      </div>

      {connected && !liveHasData && showingDemo && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <p className="text-sm"><span className="font-medium text-blue-500">Proxy connected, awaiting traffic.</span>{" "}
            <span className="text-muted-foreground">Showing demo data. Route LLM requests through <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">http://localhost:8787</code> to see live metrics. Example:</span>
          </p>
          <code className="mt-2 block rounded bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">ANTHROPIC_BASE_URL=http://localhost:8787 claude</code>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Tokens Saved" value={formatTokens(data.tokensSaved)} subtitle={`${data.savingsPercent.toFixed(1)}% reduction`} icon={Zap} />
        <StatsCard title="Cost Saved" value={formatUSD(data.costSavedUsd)} subtitle={`Total cost: ${formatUSD(data.totalCostUsd)}`} icon={Coins} color="text-emerald-500" />
        <StatsCard title="Total Requests" value={data.totalRequests.toLocaleString()} subtitle={`${data.cachedRequests} cached`} icon={Activity} color="text-blue-500" />
        <StatsCard title="Cache Entries" value={data.cacheEntries.toString()} subtitle={`${data.cacheHits} total hits`} icon={Database} color="text-amber-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-4 w-4" />Token Savings Trend</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="tokens" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                <TabsTrigger value="cost">Cost</TabsTrigger>
                <TabsTrigger value="ratio">Compression %</TabsTrigger>
              </TabsList>
              <TabsContent value="tokens" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatTokens(v)} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [formatTokens(v), "Tokens Saved"]} />
                    <Area type="monotone" dataKey="tokens_saved" stroke={COLORS[0]} fill="url(#tg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="cost" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatUSD(v)} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [formatUSD(v), "Cost Saved"]} />
                    <Area type="monotone" dataKey="savings_usd" stroke={COLORS[1]} fill="url(#cg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="ratio" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${Number(v || 0).toFixed(0)}%`} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [`${Number(v || 0).toFixed(1)}%`, "Compression"]} />
                    <Area type="monotone" dataKey="compression" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Request Breakdown</CardTitle></CardHeader>
          <CardContent>
            {breakdown.length > 0 ? (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={breakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value"
                        label={(p) => `${p.name ?? ""} ${((p.percent ?? 0) * 100).toFixed(0)}%`}>
                        {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {breakdown.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-mono">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No request data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {projectData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Per-Project Savings</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => formatTokens(v)} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [formatTokens(v), "Tokens Saved"]} />
                  <Bar dataKey="tokensSaved" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-8 w-48" /><Skeleton className="mt-2 h-4 w-72" /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-[400px] lg:col-span-2" /><Skeleton className="h-[400px]" /></div>
    </div>
  );
}
