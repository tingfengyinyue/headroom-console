"use client";

import { useState, useMemo } from "react";
import { useHeadroomContext } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, HardDrive, Gauge, Timer, Zap, ArrowDownRight, TrendingUp, Target } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { formatTokens } from "@/lib/format";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar, Legend,
} from "recharts";

const COLORS = [
  "hsl(221,83%,53%)", "hsl(160,60%,45%)", "hsl(43,96%,56%)",
  "hsl(350,89%,60%)", "hsl(280,65%,60%)", "hsl(200,70%,50%)",
  "hsl(30,80%,55%)", "hsl(120,50%,45%)",
];

export default function CachePage() {
  const { data, cacheCharts, cacheEntries, loading, showingDemo } = useHeadroomContext();

  if (loading) return <CacheSkeleton />;

  const hasLiveCacheData = cacheCharts && (
    cacheCharts.compressionCache.totalEntries > 0 ||
    cacheCharts.prefixCache.readTokens > 0 ||
    cacheCharts.strategyDistribution.length > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cache & Compression</h1>
        <p className="text-muted-foreground">Cache performance, compression strategies, and prefix cache analytics</p>
      </div>

      {hasLiveCacheData ? (
        <LiveCacheView data={data} cacheCharts={cacheCharts!} />
      ) : (
        <DemoCacheView data={data} cacheEntries={cacheEntries} />
      )}
    </div>
  );
}

function LiveCacheView({ data, cacheCharts }: { data: ReturnType<typeof useHeadroomContext>["data"]; cacheCharts: NonNullable<ReturnType<typeof useHeadroomContext>["cacheCharts"]> }) {
  const { compressionCache: cc, prefixCache: pc, strategyDistribution, tokensByStrategy, compressionVsCache: cvc } = cacheCharts;

  const hitMissData = [
    { name: "Hits", value: cc.totalHits, fill: COLORS[1] },
    { name: "Misses", value: cc.totalMisses, fill: COLORS[3] },
  ].filter((d) => d.value > 0);

  const prefixReadWrite = [
    { name: "Cache Read", tokens: pc.readTokens },
    { name: "Cache Write", tokens: pc.writeTokens },
    { name: "Bust Write", tokens: pc.bustWriteTokens },
  ].filter((d) => d.tokens > 0);

  const hitRateGauge = [
    { name: "Prefix Hit Rate", value: pc.hitRate, fill: COLORS[0] },
  ];

  const requestHitGauge = [
    { name: "Request Hit Rate", value: pc.requestHitRate, fill: COLORS[1] },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Compression Cache Entries" value={cc.totalEntries.toString()} subtitle={`${cc.activeSessions} active sessions`} icon={Database} />
        <StatsCard title="Cache Hit Rate" value={`${cc.hitRate.toFixed(1)}%`} subtitle={`${cc.totalHits} hits / ${cc.totalMisses} misses`} icon={Target} color="text-emerald-500" />
        <StatsCard title="Prefix Cache Read" value={formatTokens(pc.readTokens)} subtitle={`${pc.hitRate.toFixed(1)}% token hit rate`} icon={TrendingUp} color="text-blue-500" />
        <StatsCard title="Prefix Cache Write" value={formatTokens(pc.writeTokens)} subtitle={`${pc.bustCount} cache busts`} icon={HardDrive} color="text-amber-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compression Cache Hit/Miss */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4" />Compression Cache Hit vs Miss</CardTitle>
            <CardDescription>CCR cache lookup results distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {hitMissData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="h-[200px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={hitMissData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {hitMissData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {hitMissData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Hit Rate</p>
                    <p className="text-lg font-bold text-emerald-500">{cc.hitRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No cache lookups yet</p>
            )}
          </CardContent>
        </Card>

        {/* Prefix Cache Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" />Prefix Cache Tokens</CardTitle>
            <CardDescription>Provider-level cache read/write token volume</CardDescription>
          </CardHeader>
          <CardContent>
            {prefixReadWrite.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prefixReadWrite}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatTokens(v)} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [formatTokens(v), "Tokens"]} />
                    <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                      {prefixReadWrite.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No prefix cache data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strategy Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4" />Compression Strategy Distribution</CardTitle>
            <CardDescription>Number of compressions by each strategy</CardDescription>
          </CardHeader>
          <CardContent>
            {strategyDistribution.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" name="Compressions" radius={[0, 4, 4, 0]}>
                      {strategyDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No strategy data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Tokens Saved by Strategy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ArrowDownRight className="h-4 w-4" />Tokens Saved by Strategy</CardTitle>
            <CardDescription>Token reduction contribution per compression strategy</CardDescription>
          </CardHeader>
          <CardContent>
            {tokensByStrategy.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tokensByStrategy} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="tokens"
                        label={(p) => `${p.name ?? ""}`}>
                        {tokensByStrategy.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [formatTokens(v), "Tokens Saved"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {tokensByStrategy.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                      <span className="font-mono ml-auto">{formatTokens(item.tokens)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No token savings data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prefix Cache Hit Rate Gauges + Compression vs Cache */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Token Hit Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={COLORS[0]} strokeWidth="8"
                    strokeDasharray={`${pc.hitRate * 2.51} ${251 - pc.hitRate * 2.51}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{pc.hitRate.toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">of tokens served from prefix cache</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Request Hit Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={COLORS[1]} strokeWidth="8"
                    strokeDasharray={`${pc.requestHitRate * 2.51} ${251 - pc.requestHitRate * 2.51}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{pc.requestHitRate.toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{pc.hitRequests} of requests had cache hits</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Compression vs Cache</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Saved by Compression</p>
                <p className="text-xl font-bold text-emerald-500">+{formatTokens(cvc.savedByCompression)}</p>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Lost to Cache Bust</p>
                <p className="text-xl font-bold text-red-500">{cvc.lostToCacheBust > 0 ? `-${formatTokens(cvc.lostToCacheBust)}` : "0"}</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Net Token Benefit</p>
                <p className="text-xl font-bold">{formatTokens(cvc.netTokens)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TTL Buckets */}
      {pc.ttlBuckets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4" />TTL Bucket Distribution</CardTitle>
            <CardDescription>Provider-reported cache write TTL usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pc.ttlBuckets.map((bucket) => (
                <div key={bucket.bucket} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs font-mono">{bucket.bucket} TTL</Badge>
                    <span className="text-xs text-muted-foreground">{bucket.requests} requests</span>
                  </div>
                  <p className="text-2xl font-bold">{formatTokens(bucket.tokens)}</p>
                  <p className="text-xs text-muted-foreground">tokens written</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function DemoCacheView({ data, cacheEntries }: { data: any; cacheEntries: any[] }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const types = useMemo(() => [...new Set(cacheEntries.map((e: any) => e.content_type))], [cacheEntries]);
  const filtered = useMemo(() => typeFilter === "all" ? cacheEntries : cacheEntries.filter((e: any) => e.content_type === typeFilter), [cacheEntries, typeFilter]);

  const TYPE_LABELS: Record<string, string> = { json_array: "JSON Array", code: "Code", log: "Logs", search_results: "Search", text: "Text", diff: "Diff", html: "HTML" };

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    cacheEntries.forEach((e: any) => { counts[e.content_type] = (counts[e.content_type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ name: TYPE_LABELS[type] || type, value: count }));
  }, [cacheEntries]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Cache Entries" value={data.cacheEntries.toString()} icon={Database} />
        <StatsCard title="Total Hits" value={data.cacheHits.toString()} icon={Gauge} color="text-emerald-500" />
        <StatsCard title="Hit Rate" value={data.cacheEntries > 0 ? `${((data.cacheHits / (data.cacheHits + data.cacheEntries)) * 100).toFixed(1)}%` : "—"} icon={Timer} color="text-blue-500" />
        <StatsCard title="Total Entries" value={cacheEntries.length.toString()} subtitle="CCR demo entries" icon={HardDrive} color="text-amber-500" />
      </div>

      {typeDistribution.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Content Type Distribution (Demo)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                    label={(p) => `${p.name ?? ""} ${((p.percent ?? 0) * 100).toFixed(0)}%`}>
                    {typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function CacheSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-8 w-48" /><Skeleton className="mt-2 h-4 w-72" /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-[300px]" /><Skeleton className="h-[300px]" /></div>
    </div>
  );
}
