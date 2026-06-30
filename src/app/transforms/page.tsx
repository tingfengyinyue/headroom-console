"use client";

import { useHeadroomContext } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Zap, Timer, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { formatTokens } from "@/lib/format";

const COLORS = ["hsl(221,83%,53%)", "hsl(160,60%,45%)", "hsl(43,96%,56%)", "hsl(350,89%,60%)"];

export default function TransformsPage() {
  const { transformStats, loading } = useHeadroomContext();

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[400px]" /></div>;

  const barData = transformStats.map((t) => ({ name: t.name, tokens_saved: t.total_tokens_saved, invocations: t.invocations }));
  const maxInvocations = Math.max(...transformStats.map((s) => s.invocations), 1);
  const radarData = transformStats.map((t) => ({
    subject: t.name.split(" ")[0],
    reduction: t.avg_reduction_percent,
    speed: Math.max(0, 100 - t.avg_latency_ms * 10),
    usage: (t.invocations / maxInvocations) * 100,
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Transform Analysis</h1><p className="text-muted-foreground">Compare compression strategies</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {transformStats.map((t, i) => (
          <Card key={t.name}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div><p className="text-sm font-medium text-muted-foreground">{t.name}</p><p className="text-2xl font-bold mt-1">{t.avg_reduction_percent.toFixed(1)}%</p><p className="text-xs text-muted-foreground">avg reduction</p></div>
                <div className="rounded-lg p-2" style={{ backgroundColor: `${COLORS[i]}20`, color: COLORS[i] }}><Layers className="h-4 w-4" /></div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />Invocations</span><span className="font-mono">{t.invocations.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" />Tokens Saved</span><span className="font-mono">{formatTokens(t.total_tokens_saved)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" />Avg Latency</span><span className="font-mono">{t.avg_latency_ms.toFixed(1)}ms</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Tokens Saved by Transform</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => formatTokens(v)} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [formatTokens(v), "Tokens Saved"]} />
                  <Bar dataKey="tokens_saved" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Performance Radar</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Radar name="Reduction %" dataKey="reduction" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
                  <Radar name="Speed" dataKey="speed" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} />
                  <Radar name="Usage" dataKey="usage" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Transform Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transformStats.map((t, i) => (
              <div key={t.name} className="flex items-center gap-4">
                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm font-medium w-40">{t.name}</span>
                <div className="flex-1"><Progress value={t.avg_reduction_percent} className="h-2" /></div>
                <span className="text-sm font-mono w-16 text-right">{t.avg_reduction_percent.toFixed(1)}%</span>
                <div className="flex gap-1">{Object.keys(t.content_types).map((ct) => <Badge key={ct} variant="outline" className="text-[10px]">{ct}</Badge>)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
